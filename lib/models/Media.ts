import { Schema, model, models } from "mongoose";

const mediaSchema = new Schema(
  {
    media_url: { type: String, required: true },
    media_type: { type: String, enum: ["photo", "video"], required: true },
    thumbnail_url: { type: String, default: "" },
    timestamp: { type: Date, required: true, default: Date.now },

    // Ownership & context
    user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    event_id: { type: Schema.Types.ObjectId, ref: "Event", default: null },
    prompt: { type: String, default: "" },
    slot_id: { type: String, default: "" },

    // Media metadata
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration_seconds: { type: Number, default: null },
    file_size_bytes: { type: Number, default: null },
    mime_type: { type: String, default: "" },

    // Extras
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
    caption: { type: String, default: "" },
    is_private: { type: Boolean, default: false },
    cloudinary_public_id: { type: String, default: "" }
  },
  { collection: "media", timestamps: true }
);

export const Media = models.Media || model("Media", mediaSchema);
