import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "📁",
    },
    color: {
      type: String,
      default: "violet",
    },
    type: {
      type: String,
      enum: ["all", "jobs", "projects", "custom", "test-lab", "automate-apply"],
      default: "custom",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ userId: 1, slug: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;
