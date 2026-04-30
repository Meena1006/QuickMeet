import mongoose, { Schema } from "mongoose";

const participantSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  socketId: String,
  name: String,
  email: String,
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number,
    default: 0, // in seconds
  },
  attendancePercent: {
    type: Number,
    default: 0,
  },
  micOn: {
    type: Boolean,
    default: true,
  },
  cameraOn: {
    type: Boolean,
    default: true,
  },
  isScreenSharing: {
    type: Boolean,
    default: false,
  },
});

const chatMessageSchema = new Schema({
  sender: String,
  senderId: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const meetingSchema = new Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled Meeting",
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hostName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed"],
      default: "active",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // total meeting duration in seconds
    },
    peakParticipants: {
      type: Number,
      default: 0,
    },
    totalJoined: {
      type: Number,
      default: 0,
    },
    participants: [participantSchema],
    chat: [chatMessageSchema],
  },
  { timestamps: true }
);

export const Meeting = mongoose.model("Meeting", meetingSchema);

