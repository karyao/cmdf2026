import { Schema, model, models } from "mongoose";

const videoSchema = new Schema(
  {
    event_id: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    user_id: { type: String, default: null },
    video_url: { type: String, required: true },
    thumbnail_url: { type: String, default: "" },
    title: { type: String, required: true },
    duration_seconds: { type: Number, default: 0 },
    photo_count: { type: Number, default: 0 },
    participants: [{ type: String }],
    event_title: { type: String, default: "" },
    event_city: { type: String, default: "" },
  },
  { collection: "videos", timestamps: true }
);

export const Video = models.Video || model("Video", videoSchema);
