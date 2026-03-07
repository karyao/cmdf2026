import { Schema, model, models } from "mongoose";

const photoSchema = new Schema(
  {
    image_url: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    prompt: { type: String, default: "" },
    user_id: { type: String, default: "guest" }
  },
  { collection: "photos" }
);

export const Photo = models.Photo || model("Photo", photoSchema);
