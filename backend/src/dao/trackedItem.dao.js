import TrackedItem from "../models/trackedItem.model.js";
import Category from "../models/category.model.js";

const DEFAULT_CATEGORIES = [
  { name: "All Links", slug: "all", icon: "🔗", type: "all", color: "gray" },
  { name: "Job Applications", slug: "jobs", icon: "💼", type: "jobs", color: "blue" },
  { name: "My Projects", slug: "projects", icon: "🚀", type: "projects", color: "emerald" },
  { name: "Automate Apply", slug: "automate-apply", icon: "🤖", type: "automate-apply", color: "slate" },
  { name: "Test Lab", slug: "test-lab", icon: "🧪", type: "test-lab", color: "violet" },
];

export const ensureDefaultCategories = async (userId) => {
  if (!userId) return;

  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate(
      { userId, slug: cat.slug },
      { $setOnInsert: { ...cat, userId } },
      { upsert: true, new: true },
    );
  }
};

export const getAllCategoriesFromDB = async (userId) => {
  await ensureDefaultCategories(userId);
  return Category.find({ userId }).sort({ createdAt: 1 });
};

export const saveCategoryToDB = async ({ name, icon = "📁", color = "violet", userId }) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existing = await Category.findOne({ userId, slug });
  if (existing) return existing;

  return Category.create({
    name,
    slug,
    icon,
    color,
    type: "custom",
    userId,
  });
};

export const saveTrackedItemToDB = async (itemData) => {
  return TrackedItem.create(itemData);
};

export const getAllTrackedItemsFromDB = async (userId) => {
  return TrackedItem.find({ userId }).sort({ createdAt: -1 });
};

export const updateTrackedItemStatusInDB = async (id, status, userId) => {
  return TrackedItem.findOneAndUpdate({ _id: id, userId }, { status }, { new: true });
};

export const deleteTrackedItemFromDB = async (id, userId) => {
  return TrackedItem.findOneAndDelete({ _id: id, userId });
};
