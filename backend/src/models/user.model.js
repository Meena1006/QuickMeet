import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    contacts: [
      {
        type: String,
      },
    ],
    meetingHistory: [
      {
        roomId: String,
        joinedAt: Date,
        duration: Number,
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

