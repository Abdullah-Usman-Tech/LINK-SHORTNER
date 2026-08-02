import TrackedItem from "../models/trackedItem.model.js";
import Category from "../models/category.model.js";

// Seed default categories if none exist
export const ensureDefaultCategories = async () => {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany([
      { name: "All Links", slug: "all", icon: "🔗", type: "all", color: "gray" },
      { name: "Job Applications", slug: "jobs", icon: "💼", type: "jobs", color: "blue" },
      { name: "My Projects", slug: "projects", icon: "🚀", type: "projects", color: "emerald" },
    ]);
  }
};

export const getAllCategoriesFromDB = async () => {
  await ensureDefaultCategories();
  return await Category.find().sort({ createdAt: 1 });
};

export const saveCategoryToDB = async ({ name, icon = "📁", color = "violet" }) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const existing = await Category.findOne({ slug });
  if (existing) return existing;

  return await Category.create({
    name,
    slug,
    icon,
    color,
    type: "custom",
  });
};

export const saveTrackedItemToDB = async (itemData) => {
  return await TrackedItem.create(itemData);
};

export const getAllTrackedItemsFromDB = async () => {
  return await TrackedItem.find().sort({ createdAt: -1 });
};

export const updateTrackedItemStatusInDB = async (id, status) => {
  return await TrackedItem.findByIdAndUpdate(id, { status }, { new: true });
};

export const deleteTrackedItemFromDB = async (id) => {
  return await TrackedItem.findByIdAndDelete(id);
};
