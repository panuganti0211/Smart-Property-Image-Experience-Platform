import dotenv from "dotenv";

dotenv.config();

const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_property",
  /** `gemini` | `mock` — mock = no API calls, for local demo when you have no credits */
  // aiProvider: provider === "mock" ? "mock" : "gemini",
  aiProvider: process.env.AI_PROVIDER || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
};
