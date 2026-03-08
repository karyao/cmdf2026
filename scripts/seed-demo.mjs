#!/usr/bin/env node

/**
 * Seeds demo data for recap video generation.
 * Creates:
 * - 3 demo users (participants)
 * - 1 demo event with hourly intervals
 * - Photos at 4 different hourly timeframes, each with 2-3 participants
 *
 * Usage:
 *   node scripts/seed-demo.mjs
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

// ─── Schemas ───────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    bio: { type: String, default: "" },
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  { collection: "users", timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["public", "private"], default: "public" },
    city: { type: String, default: "" },
    intervalMinutes: { type: Number, default: 60 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { collection: "events", timestamps: true }
);

const mediaSchema = new mongoose.Schema(
  {
    media_url: { type: String, required: true },
    media_type: { type: String, enum: ["photo", "video"], required: true },
    thumbnail_url: { type: String, default: "" },
    timestamp: { type: Date, required: true, default: Date.now },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    prompt: { type: String, default: "" },
    caption: { type: String, default: "" },
    slot_id: { type: String, default: "" },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration_seconds: { type: Number, default: null },
    file_size_bytes: { type: Number, default: null },
    mime_type: { type: String, default: "" },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    is_private: { type: Boolean, default: false },
    cloudinary_public_id: { type: String, default: "" },
  },
  { collection: "media", timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
const Media = mongoose.models.Media || mongoose.model("Media", mediaSchema);

// ─── Demo Data ─────────────────────────────────────────────────
const DEMO_USER_ID = "000000000000000000000001";

const participants = [
  { _id: new mongoose.Types.ObjectId(DEMO_USER_ID), name: "Camille Yao", email: "camille@demo.com" },
  { _id: new mongoose.Types.ObjectId("000000000000000000000002"), name: "Alex Chen", email: "alex@demo.com" },
  { _id: new mongoose.Types.ObjectId("000000000000000000000003"), name: "Jordan Lee", email: "jordan@demo.com" },
];

// Sample images from public/images/
const IMAGES = [
  "/images/IMG_1450.jpeg",
  "/images/IMG_1240.jpeg",
  "/images/IMG_1485.jpeg",
  "/images/IMG_0555.jpeg",
  "/images/IMG_0559.jpeg",
  "/images/IMG_0565.jpeg",
  "/images/IMG_0540.jpeg",
  "/images/IMG_1644.jpeg",
  "/images/IMG_1501.jpeg",
  "/images/IMG_1235.jpeg",
];

const captions = [
  "Morning coffee ☕",
  "Walking to class 🏫",
  "Lunch break downtown 🍜",
  "Study session at the library 📚",
  "Golden hour vibes 🌅",
  "Evening walk by the water 🌊",
  "Late night coding 💻",
  "Sunset from the rooftop 🌆",
  "Cooking dinner 🍳",
  "Night time city lights ✨",
];

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!\n");

  // 1. Upsert demo users
  console.log("Creating demo users...");
  for (const p of participants) {
    await User.findByIdAndUpdate(
      p._id,
      {
        name: p.name,
        email: p.email,
        provider: "demo",
        providerId: String(p._id),
        bio: `Demo participant for Day in the Life`,
      },
      { upsert: true, new: true }
    );
    console.log(`  ✓ ${p.name} (${p._id})`);
  }

  // 2. Create demo event
  console.log("\nCreating demo event...");
  const existingEvent = await Event.findOne({ title: "Vancouver Day Trip 🌲" });
  let event;
  if (existingEvent) {
    event = existingEvent;
    console.log(`  ✓ Using existing event: ${event._id}`);
  } else {
    event = await Event.create({
      title: "Vancouver Day Trip 🌲",
      type: "public",
      city: "Vancouver",
      intervalMinutes: 60,
      createdBy: participants[0]._id,
      members: participants.map((p) => p._id),
    });
    console.log(`  ✓ Created event: ${event._id}`);
  }

  // 3. Clean old demo media for this event
  const deleted = await Media.deleteMany({ event_id: event._id });
  console.log(`  Cleaned ${deleted.deletedCount} old demo photos.\n`);

  // 4. Insert photos at different hourly timeframes
  // Simulate a full day: 9 AM, 11 AM, 1 PM, 3 PM, 5 PM, 7 PM
  const today = new Date();
  today.setHours(9, 0, 0, 0); // Start at 9 AM

  const timeframes = [
    { hour: 9, label: "9:00 AM" },
    { hour: 11, label: "11:00 AM" },
    { hour: 13, label: "1:00 PM" },
    { hour: 15, label: "3:00 PM" },
    { hour: 17, label: "5:00 PM" },
    { hour: 19, label: "7:00 PM" },
  ];

  let imageIdx = 0;
  let captionIdx = 0;
  const insertedPhotos = [];

  for (const tf of timeframes) {
    const timestamp = new Date(today);
    timestamp.setHours(tf.hour, 0, 0, 0);

    console.log(`📸 Timeframe: ${tf.label}`);

    // Each timeframe: 2-3 participants take a photo
    const numPhotos = tf.hour <= 13 ? 3 : 2; // morning = 3 people, afternoon = 2

    for (let p = 0; p < numPhotos; p++) {
      const participant = participants[p % participants.length];
      const img = IMAGES[imageIdx % IMAGES.length];
      const caption = captions[captionIdx % captions.length];

      // Add slight time offset per person (within same minute)
      const photoTime = new Date(timestamp);
      photoTime.setSeconds(p * 15); // 0s, 15s, 30s apart

      const media = await Media.create({
        media_url: img,
        media_type: "photo",
        timestamp: photoTime,
        user_id: participant._id,
        event_id: event._id,
        caption,
        prompt: "",
        slot_id: `slot-${tf.hour}-${p}`,
        width: 1080,
        height: 1920,
        mime_type: "image/jpeg",
      });

      insertedPhotos.push(media);
      console.log(`  ✓ ${participant.name} → ${img} (${caption})`);
      imageIdx++;
      captionIdx++;
    }
  }

  console.log(`\n✅ Seeded ${insertedPhotos.length} photos across ${timeframes.length} timeframes`);
  console.log(`\nEvent ID: ${event._id}`);
  console.log(`\nYou can now generate a recap video for this event!`);
  console.log(`The video will show ${timeframes.length} grid slides with participants at each hour.`);

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
