import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    bio: { type: String, default: "" },
    provider: { type: String, required: true },
    providerId: { type: String, required: true }
  },
  { collection: "users", timestamps: true }
);

export const User = models.User || model("User", userSchema);
