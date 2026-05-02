import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { Property } from "../models/Property.js";

const sampleProperties = [
  {
    title: "Skyline Penthouse at Marina Bay",
    price: 1850000,
    location: "Mumbai",
    tags: ["luxury", "city_view", "modern"],
    aiDescription:
      "An exceptional penthouse residence with sweeping skyline views, designer finishes, and a private terrace crafted for elevated urban living.",
    analysisStatus: "done",
    coverImageUrl:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
        publicId: "sample/skyline-penthouse-1",
        roomType: "living_room",
        keyFeatures: ["panoramic_view", "floor_to_ceiling_windows", "premium_furniture"],
        qualityScore: 93,
        improvementTips: ["Use warmer accent lighting for evening ambience."],
      },
    ],
  },
  {
    title: "Oceanfront Villa with Infinity Pool",
    price: 3250000,
    location: "Goa",
    tags: ["luxury", "sea_view", "pool"],
    aiDescription:
      "A breathtaking oceanfront villa featuring an infinity-edge pool, serene tropical landscaping, and curated interiors for resort-style luxury.",
    analysisStatus: "done",
    coverImageUrl:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80",
        publicId: "sample/ocean-villa-1",
        roomType: "exterior",
        keyFeatures: ["infinity_pool", "sea_view", "private_garden"],
        qualityScore: 96,
        improvementTips: ["Capture golden-hour photos for richer tones."],
      },
    ],
  },
  {
    title: "Modern Glass House in Hills",
    price: 1420000,
    location: "Bengaluru",
    tags: ["modern", "mountain_view", "minimalist"],
    aiDescription:
      "A striking glass-forward home in the hills, blending minimalist architecture with tranquil views and natural light throughout.",
    analysisStatus: "done",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
        publicId: "sample/glass-house-1",
        roomType: "exterior",
        keyFeatures: ["glass_facade", "open_plan", "nature_facing"],
        qualityScore: 90,
        improvementTips: ["Slightly increase contrast for facade definition."],
      },
    ],
  },
  {
    title: "Heritage Mansion with Courtyard",
    price: 2750000,
    location: "Hyderabad",
    tags: ["heritage", "luxury", "courtyard"],
    aiDescription:
      "A rare heritage mansion showcasing timeless craftsmanship, grand courtyards, and opulent rooms with historic character.",
    analysisStatus: "done",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
        publicId: "sample/heritage-mansion-1",
        roomType: "exterior",
        keyFeatures: ["arched_entry", "large_courtyard", "stonework"],
        qualityScore: 88,
        improvementTips: ["Add dusk shots to highlight facade lighting."],
      },
    ],
  },
  {
    title: "Lakeside Smart Home Retreat",
    price: 1190000,
    location: "Pune",
    tags: ["smart_home", "lake_view", "modern"],
    aiDescription:
      "An elegant lakeside retreat with seamless smart-home automation, contemporary styling, and calming waterfront outlooks.",
    analysisStatus: "done",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80",
        publicId: "sample/lakeside-smart-1",
        roomType: "living_room",
        keyFeatures: ["smart_lighting", "lake_view", "open_lounge"],
        qualityScore: 87,
        improvementTips: ["Add one close-up shot of smart controls."],
      },
    ],
  },
  {
    title: "Designer Duplex with Private Terrace",
    price: 980000,
    location: "Chennai",
    tags: ["duplex", "designer", "terrace"],
    aiDescription:
      "A refined designer duplex featuring layered textures, premium materials, and a private terrace for relaxed city evenings.",
    analysisStatus: "done",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80",
        publicId: "sample/designer-duplex-1",
        roomType: "bedroom",
        keyFeatures: ["premium_finish", "terrace_access", "ambient_lighting"],
        qualityScore: 85,
        improvementTips: ["Slightly widen frame to include terrace doors."],
      },
    ],
  },
  {
    title: "Seaside Apartment with Balcony Deck",
    price: 860000,
    location: "Kochi",
    tags: ["sea_view", "balcony", "contemporary"],
    aiDescription:
      "A contemporary seaside apartment with a generous balcony deck, airy interiors, and sweeping water views.",
    analysisStatus: "done",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600607687644-c7f34b5d2f5f?auto=format&fit=crop&w=1400&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600607687644-c7f34b5d2f5f?auto=format&fit=crop&w=1400&q=80",
        publicId: "sample/seaside-apartment-1",
        roomType: "living_room",
        keyFeatures: ["balcony_deck", "sea_view", "natural_light"],
        qualityScore: 84,
        improvementTips: ["Add an evening balcony shot with city lights."],
      },
    ],
  },
  {
    title: "Urban Loft with Rooftop Lounge",
    price: 730000,
    location: "Delhi",
    tags: ["loft", "rooftop", "urban"],
    aiDescription:
      "A stylish urban loft with dramatic double-height spaces and an exclusive rooftop lounge for entertaining.",
    analysisStatus: "done",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1400&q=80",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1400&q=80",
        publicId: "sample/urban-loft-1",
        roomType: "living_room",
        keyFeatures: ["double_height_ceiling", "rooftop_lounge", "industrial_chic"],
        qualityScore: 83,
        improvementTips: ["Include one twilight rooftop lifestyle shot."],
      },
    ],
  },
];

async function seed() {
  await connectDb();
  await Property.insertMany(sampleProperties);
  console.log(`Seeded ${sampleProperties.length} properties.`);
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error("Failed to seed properties:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
