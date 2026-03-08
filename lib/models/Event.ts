import { Schema, model, models } from "mongoose";

const eventSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["public", "private"], default: "public" },
    city: { type: String, default: "" },
    intervalMinutes: { type: Number, default: 60 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { collection: "events", timestamps: true }
);

export const Event = models.Event || model("Event", eventSchema);
