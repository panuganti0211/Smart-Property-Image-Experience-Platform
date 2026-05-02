import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    roomType: { type: String, default: null },
    features: { type: [String], default: [] },
    keyFeatures: { type: [String], default: [] },
    qualityScore: { type: Number, default: 0 },
    suggestions: { type: [String], default: [] },
    improvementTips: { type: [String], default: [] },
  },
  { _id: true }
);

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true, index: true },
    images: { type: [imageSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    aiDescription: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },
    analysisStatus: {
      type: String,
      enum: ["idle", "pending", "done", "failed"],
      default: "idle",
    },
  },
  { timestamps: true }
);

export const Property = mongoose.model("Property", propertySchema);
