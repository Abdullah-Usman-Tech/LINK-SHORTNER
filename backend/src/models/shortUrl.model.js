import mongoose from "mongoose";
const shortUrlSchema = new mongoose.Schema(
  {
    fullUrl: {
      type: String,
      required: true,
    },
    shortUrl: {
      type: String,
      required: true,
      unique: true,
    },
    clicks: {
      type: Number,
      required: true,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: false,
    },
    custom: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    maxClicks: {
      type: Number,
      default: 5000,
    },
    viewsHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        ip: {
          type: String,
          default: "127.0.0.1",
        },
        userAgent: {
          type: String,
          default: "Unknown",
        },
        referrer: {
          type: String,
          default: "Direct",
        },
        browser: {
          type: String,
          default: "Chrome",
        },
        os: {
          type: String,
          default: "Windows",
        },
        device: {
          type: String,
          default: "Desktop",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);
const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);
export default ShortUrl;
