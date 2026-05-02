import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai =
  env.aiProvider === "gemini" && env.geminiApiKey
    ? new GoogleGenAI({
        apiKey: env.geminiApiKey,
      })
    : null;

function stableHash(input) {
  let h = 0;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Local demo insights — no vision, no billing. Stable per URL for consistent UI.
 */
function mockInsightFromUrl(imageUrl) {
  const h = stableHash(imageUrl);
  const rooms = [
    "living room",
    "bedroom",
    "kitchen",
    "bathroom",
    "exterior",
    "dining room",
    "hallway",
    "balcony",
  ];
  const featureSets = [
    ["natural_light", "open_layout", "neutral_palette"],
    ["high_ceilings", "hardwood_floors", "modern_fixtures"],
    ["sea_view", "large_windows", "minimalist_style"],
    ["landscaped_garden", "pool_area", "outdoor_living"],
    ["waterfront", "sunset_views", "architectural_detail"],
  ];
  const tagSets = [
    ["luxury", "well_lit", "modern"],
    ["spacious", "premium_finish", "curb_appeal"],
    ["coastal", "serene", "showcase_ready"],
  ];
  const roomType = rooms[h % rooms.length];
  const features = featureSets[h % featureSets.length];
  const tags = tagSets[h % tagSets.length];
  const qualityScore = 55 + (h % 38);
  const suggestions = [
    "Capture a wider angle to show room flow and depth.",
    "Balance exposure so windows do not blow out highlights.",
    "Add a twilight exterior frame for listing hero appeal.",
  ];
  const pick = h % suggestions.length;
  return {
    roomType,
    features,
    keyFeatures: features,
    tags,
    suggestions: [suggestions[pick], suggestions[(pick + 1) % suggestions.length]],
    improvementTips: [
      suggestions[pick],
      suggestions[(pick + 1) % suggestions.length],
    ],
    qualityScore,
    __fallback: false,
  };
}

function mockLuxuryDescription(imagesSummary) {
  const title = imagesSummary?.title || "This residence";
  const loc = imagesSummary?.location ? ` in ${imagesSummary.location}` : "";
  const rooms = Array.isArray(imagesSummary?.images)
    ? [...new Set(imagesSummary.images.map((i) => i.roomType).filter(Boolean))]
    : [];
  const roomPhrase = rooms.length ? ` Highlights include ${rooms.slice(0, 3).join(", ")} spaces.` : "";
  return (
    `${title}${loc}: a thoughtfully presented home with standout visual storytelling for discerning buyers.${roomPhrase}` +
    ` Curated interiors and appealing composition support a luxury market position.`
  );
}

/**
 * Gemini model aliases differ by API channel; unreleased names yield 404 on v1beta.
 * Primary from env + fallbacks documented at https://ai.google.dev/api
 */
function geminiModelCandidates() {
  const primary = (env.geminiModel || "gemini-2.0-flash").trim();
  // After primary, prefer 1.x models when 2.x hits quota (limits are often per model family).
  const fallbacks = [
    // "gemini-1.5-flash-002",
    // "gemini-1.5-flash-001",
    // "gemini-1.5-flash-latest",
    // "gemini-1.5-flash",
    "gemini-2.0-flash-001",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];
  return [...new Set([primary, ...fallbacks])];
}

function isModelNotFoundError(error) {
  const msg = error?.message || String(error);
  if (/"code":\s*404/.test(msg)) return true;
  if (/not found for API version/i.test(msg)) return true;
  if (/NOT_FOUND/i.test(msg) && /models\/gemini/i.test(msg)) return true;
  return false;
}

/** Per-model quotas: 429 on one model may still allow another (e.g. 1.5 vs 2.0). */
function isRetryableQuotaOrRateLimitError(error) {
  const msg = error?.message || String(error);
  if (/"code":\s*429/.test(msg)) return true;
  if (/RESOURCE_EXHAUSTED/i.test(msg)) return true;
  if (/quota exceeded/i.test(msg)) return true;
  if (/Too Many Requests/i.test(msg)) return true;
  return false;
}

async function generateContentWithFallback(contents, logLabel) {
  const models = geminiModelCandidates();
  let lastError;
  for (const model of models) {
    try {
      console.log("[AIService] generateContent.try", { logLabel, model });
      const result = await ai.models.generateContent({
        model,
        contents,
      });
      console.log("[AIService] generateContent.ok", { logLabel, model });
      return result;
    } catch (err) {
      lastError = err;
      if (isModelNotFoundError(err)) {
        console.warn("[AIService] generateContent.skipModel.notFound", {
          model,
          message: err.message?.slice(0, 200),
        });
        continue;
      }
      if (isRetryableQuotaOrRateLimitError(err)) {
        console.warn("[AIService] generateContent.tryNextAfterQuota", {
          model,
          message: err.message?.slice(0, 280),
        });
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function truncateText(value, max = 800) {
  if (typeof value !== "string") return "";
  return value.length > max
    ? `${value.slice(0, max)}...[truncated ${value.length - max} chars]`
    : value;
}

function fallbackInsight() {
  return {
    roomType: "",
    features: [],
    keyFeatures: [],
    qualityScore: 0,
    suggestions: [],
    improvementTips: [],
    tags: [],
    __fallback: true,
  };
}

function parseJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function getImageBase64FromUrl(imageUrl) {
  console.log("[AIService] getImage.fetch.start", { imageUrl });

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Failed to fetch image");
  }

  const mimeType = response.headers.get("content-type") || "image/jpeg";

  const buffer = Buffer.from(await response.arrayBuffer());

  console.log("[AIService] getImage.fetch.success", {
    imageUrl,
    mimeType,
    bytes: buffer.length,
  });

  return {
    mimeType,
    data: buffer.toString("base64"),
  };
}

export async function analyzePropertyImage(imageUrl) {
  console.log("[AIService] analyzePropertyImage.start", {
    imageUrl,
    provider: env.aiProvider,
    models: env.aiProvider === "gemini" ? geminiModelCandidates() : ["mock"],
  });

  if (env.aiProvider === "mock") {
    const normalized = mockInsightFromUrl(imageUrl);
    console.log("[AIService] analyzePropertyImage.mockResult", {
      imageUrl,
      roomType: normalized.roomType,
      qualityScore: normalized.qualityScore,
    });
    return normalized;
  }

  if (!env.geminiApiKey || !ai) {
    console.log("[AIService] analyzePropertyImage.fallback.noApiKey");
    return fallbackInsight();
  }

  try {
    const imageData = await getImageBase64FromUrl(imageUrl);

    const prompt = `
You are a professional real estate image analyst.

Analyze this property image and return STRICT JSON only.

Format:
{
  "roomType": "",
  "features": [],
  "tags": [],
  "suggestions": [],
  "qualityScore": 0
}

Rules:
- roomType should be like bedroom, kitchen, bathroom, living room, exterior
- tags must be snake_case
- qualityScore between 0 and 100
- No markdown
- No explanation
`;

    const result = await generateContentWithFallback(
      [
        {
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.data,
          },
        },
        prompt,
      ],
      "analyzePropertyImage"
    );

    const content = result.text || "{}";

    console.log("[AIService] analyzePropertyImage.rawResponse", {
      imageUrl,
      raw: truncateText(content),
    });

    const parsed = parseJson(content);

    if (!parsed) {
      console.log("[AIService] analyzePropertyImage.parseFailed");

      return fallbackInsight();
    }

    const features = Array.isArray(parsed.features)
      ? parsed.features
      : [];

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
      : [];

    const normalized = {
      roomType: typeof parsed.roomType === "string" ? parsed.roomType.trim() : "",
      features,
      keyFeatures: features,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      suggestions,
      improvementTips: suggestions,
      qualityScore: Number.isFinite(Number(parsed.qualityScore)) ? Number(parsed.qualityScore) : 0,
      __fallback: false,
    };

    console.log("[AIService] analyzePropertyImage.normalized", {
      normalized,
    });

    return normalized;
  } catch (error) {
    console.error("[AIService] analyzePropertyImage.error", {
      imageUrl,
      message: error.message,
      stack: error.stack,
    });

    return fallbackInsight();
  }
}

export async function generateLuxuryDescription(imagesSummary) {
  console.log("[AIService] generateLuxuryDescription.start", {
    provider: env.aiProvider,
    models: env.aiProvider === "gemini" ? geminiModelCandidates() : ["mock"],
  });

  if (env.aiProvider === "mock") {
    const text = mockLuxuryDescription(imagesSummary);
    console.log("[AIService] generateLuxuryDescription.mockDone");
    return text;
  }

  if (!env.geminiApiKey || !ai) {
    return "";
  }

  try {
    const prompt = `
Generate a luxury real estate description in 2-3 lines.

Property summary:
${JSON.stringify(imagesSummary)}
`;

    const result = await generateContentWithFallback([prompt], "generateLuxuryDescription");

    const responseText = result.text?.trim();

    console.log("[AIService] generateLuxuryDescription.rawResponse", {
      raw: truncateText(responseText || ""),
    });

    return responseText || "";
  } catch (error) {
    console.error("[AIService] generateLuxuryDescription.error", {
      message: error.message,
      stack: error.stack,
    });

    return "";
  }
}
