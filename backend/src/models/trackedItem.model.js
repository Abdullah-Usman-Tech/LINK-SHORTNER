import mongoose from "mongoose";

const trackedLinkSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["email", "resume", "portfolio", "demo", "repo", "other"],
    default: "other",
  },
  shortUrl: {
    type: String,
    required: true,
  },
  fullUrl: {
    type: String,
    required: true,
  },
});

const trackedItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    companyOrPlatform: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: "Jobs",
    },
    description: {
      type: String,
      default: "",
    },
    sourceUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Applied",
    },
    trackedLinks: [trackedLinkSchema],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const TrackedItem = mongoose.model("TrackedItem", trackedItemSchema);
export default TrackedItem;
