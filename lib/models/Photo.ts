import { Schema, model, models } from "mongoose";

const photoSchema = new Schema(
  {
    image_url: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    prompt: { type: String, default: "" },
    user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    event_id: { type: Schema.Types.ObjectId, ref: "Event", default: null }
  },
  { collection: "photos" }
);

export const Photo = models.Photo || model("Photo", photoSchema);
