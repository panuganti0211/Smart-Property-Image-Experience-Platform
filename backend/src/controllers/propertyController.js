import { Property } from "../models/Property.js";
import cloudinary from "../config/cloudinary.js";
import { env } from "../config/env.js";
import {
  analyzePropertyImage,
  generateLuxuryDescription,
} from "../services/aiService.js";

function logStep(step, data = {}) {
  console.log(`[PropertyFlow] ${step}`, data);
}

function normalizeTags(tags = []) {
  return [...new Set(tags.map((t) => t.toLowerCase().replace(/\s+/g, "_")))];
}

function pickCoverImage(images) {
  if (!images?.length) return "";
  const ranked = [...images].sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
  return ranked[0]?.url || "";
}

const activeAnalysisIds = new Set();

function scheduleAnalysis(propertyId) {
  const id = String(propertyId);
  if (activeAnalysisIds.has(id)) {
    logStep("analysis.schedule.skippedAlreadyActive", { propertyId: id });
    return false;
  }
  activeAnalysisIds.add(id);
  logStep("analysis.schedule.start", { propertyId: id });
  analyzePropertyAsync(id)
    .catch((error) => {
      logStep("analysis.schedule.error", { propertyId: id, message: error.message, stack: error.stack });
    })
    .finally(() => {
      activeAnalysisIds.delete(id);
      logStep("analysis.schedule.done", { propertyId: id });
    });
  return true;
}

export async function createProperty(req, res, next) {
  try {
    const { title, price, location } = req.body;
    logStep("createProperty.request", { title, price, location });
    const property = await Property.create({ title, price, location });
    logStep("createProperty.created", {
      propertyId: String(property._id),
      analysisStatus: property.analysisStatus,
    });
    res.status(201).json(property);
  } catch (error) {
    logStep("createProperty.error", { message: error.message, stack: error.stack });
    next(error);
  }
}

export async function getProperties(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 9);
    const location = req.query.location;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const tags = req.query.tags ? String(req.query.tags).split(",") : [];

    const filter = {};
    if (location) filter.location = new RegExp(location, "i");
    if (minPrice !== null || maxPrice !== null) {
      filter.price = {};
      if (minPrice !== null) filter.price.$gte = minPrice;
      if (maxPrice !== null) filter.price.$lte = maxPrice;
    }
    if (tags.length) filter.tags = { $in: tags };

    const [items, total] = await Promise.all([
      Property.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Property.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPropertyById(req, res, next) {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found." });
    res.json(property);
  } catch (error) {
    next(error);
  }
}

export async function uploadPropertyImages(req, res, next) {
  try {
    logStep("uploadPropertyImages.request", {
      propertyId: req.params.id,
      fileCount: req.files?.length || 0,
      files:
        req.files?.map((file) => ({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
        })) || [],
    });
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found." });
    if (!req.files?.length) {
      return res.status(400).json({ message: "Please upload 1 to 5 images." });
    }
    if (
      !env.cloudinaryCloudName ||
      !env.cloudinaryApiKey ||
      !env.cloudinaryApiSecret
    ) {
      return res.status(500).json({
        message:
          "Image upload is not configured. Please set Cloudinary keys in backend/.env.",
      });
    }

    const uploaded = [];
    for (const file of req.files) {
      logStep("cloudinary.upload.start", {
        propertyId: String(property._id),
        file: { originalname: file.originalname, path: file.path, size: file.size },
      });
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "smart-property",
      });
      logStep("cloudinary.upload.success", {
        propertyId: String(property._id),
        cloudinary: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
          resource_type: result.resource_type,
        },
      });
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }

    property.images = [...property.images, ...uploaded].slice(0, 5);
    property.analysisStatus = "pending";
    await property.save();
    logStep("uploadPropertyImages.saved", {
      propertyId: String(property._id),
      imageCount: property.images.length,
      analysisStatus: property.analysisStatus,
    });

    scheduleAnalysis(property._id);
    logStep("uploadPropertyImages.analysisScheduled", { propertyId: String(property._id) });
    res.status(201).json({ message: "Images uploaded and analysis started." });
  } catch (error) {
    logStep("uploadPropertyImages.error", { message: error.message, stack: error.stack });
    error.message =
      error.message || "Image upload failed. Please check Cloudinary configuration.";
    next(error);
  }
}

export async function reanalyzeProperty(req, res, next) {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found." });
    if (!property.images?.length) {
      return res.status(400).json({ message: "No images found to analyze." });
    }

    property.analysisStatus = "pending";
    await property.save();
    scheduleAnalysis(property._id);
    res.json({ message: "Re-analysis started." });
  } catch (error) {
    next(error);
  }
}

async function analyzePropertyAsync(propertyId) {
  logStep("analysis.begin", { propertyId: String(propertyId) });
  const property = await Property.findById(propertyId);
  if (!property) return;

  try {
    const nextImages = [];
    const allTags = [];
    let fallbackCount = 0;

    for (let i = 0; i < property.images.length; i += 1) {
      const image = property.images[i];
      logStep("analysis.image.start", {
        propertyId: String(property._id),
        imageId: String(image._id),
        index: i,
        url: image.url,
      });
      const ai = await analyzePropertyImage(image.url);
      if (ai.__fallback) fallbackCount += 1;
      logStep("analysis.image.aiResult", {
        propertyId: String(property._id),
        imageId: String(image._id),
        index: i,
        ai,
      });
      nextImages.push({
        ...image.toObject(),
        roomType: ai.__fallback ? "" : String(ai.roomType || "").trim(),
        features: ai.__fallback ? [] : ai.features || ai.keyFeatures || [],
        keyFeatures: ai.__fallback ? [] : ai.features || ai.keyFeatures || [],
        qualityScore: ai.__fallback ? 0 : Number(ai.qualityScore || 0),
        suggestions: ai.__fallback ? [] : ai.suggestions || ai.improvementTips || [],
        improvementTips: ai.__fallback ? [] : ai.suggestions || ai.improvementTips || [],
      });
      allTags.push(...(ai.tags || []));
    }

    const tags = normalizeTags(allTags);
    logStep("analysis.tags.normalized", { propertyId: String(property._id), tags });
    if (fallbackCount === property.images.length) {
      property.analysisStatus = "failed";
      await property.save();
      logStep("analysis.saved.failedAllFallback", {
        propertyId: String(property._id),
        fallbackCount,
        totalImages: property.images.length,
        reason: "No valid AI insights returned for any image.",
      });
      return;
    }

    const aiDescription = await generateLuxuryDescription({
      title: property.title,
      location: property.location,
      images: nextImages.map((image) => ({
        roomType: image.roomType,
        features: image.features,
        qualityScore: image.qualityScore,
      })),
      tags,
    });
    logStep("analysis.description.generated", {
      propertyId: String(property._id),
      aiDescription,
    });

    property.images = nextImages;
    property.tags = tags;
    property.aiDescription = aiDescription;
    property.coverImageUrl = pickCoverImage(nextImages);
    property.analysisStatus = "done";
    await property.save();
    logStep("analysis.saved.done", {
      propertyId: String(property._id),
      analysisStatus: property.analysisStatus,
      coverImageUrl: property.coverImageUrl,
      tagsCount: property.tags.length,
    });
  } catch (error) {
    logStep("analysis.failed", {
      propertyId: String(propertyId),
      message: error.message,
      stack: error.stack,
    });
    property.analysisStatus = "failed";
    await property.save();
    logStep("analysis.saved.failed", {
      propertyId: String(property._id),
      analysisStatus: property.analysisStatus,
    });
  }
}

export async function resumePendingAnalyses() {
  const pending = await Property.find({ analysisStatus: "pending" }).select("_id");
  logStep("analysis.resume.scan", { pendingCount: pending.length });
  let resumed = 0;
  for (const property of pending) {
    if (scheduleAnalysis(property._id)) resumed += 1;
  }
  logStep("analysis.resume.done", { resumed });
  return resumed;
}
