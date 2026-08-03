import {
  getAllCategoriesFromDB,
  saveCategoryToDB,
  getAllTrackedItemsFromDB,
  saveTrackedItemToDB,
  updateTrackedItemStatusInDB,
  deleteTrackedItemFromDB,
} from "../dao/trackedItem.dao.js";

export const getCategoriesController = async (req, res) => {
  try {
    const categories = await getAllCategoriesFromDB(req.user._id);
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
};

export const createCategoryController = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const category = await saveCategoryToDB({
      name: name.trim(),
      icon,
      color,
      userId: req.user._id,
    });
    res.status(201).json({ category });
  } catch (error) {
    res.status(500).json({ message: "Failed to create category", error: error.message });
  }
};

export const getTrackedItemsController = async (req, res) => {
  try {
    const items = await getAllTrackedItemsFromDB(req.user._id);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tracked items", error: error.message });
  }
};

export const createTrackedItemController = async (req, res) => {
  try {
    const { title, companyOrPlatform, category, description, sourceUrl, status, trackedLinks } =
      req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const item = await saveTrackedItemToDB({
      title: title.trim(),
      companyOrPlatform: companyOrPlatform ? companyOrPlatform.trim() : "",
      category: category || "Jobs",
      description: description || "",
      sourceUrl: sourceUrl || "",
      status: status || "Applied",
      trackedLinks: trackedLinks || [],
      userId: req.user._id,
    });

    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ message: "Failed to create tracked item", error: error.message });
  }
};

export const updateTrackedItemStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateTrackedItemStatusInDB(id, status, req.user._id);
    if (!updated) {
      return res.status(404).json({ message: "Tracked item not found" });
    }
    res.json({ item: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update item status", error: error.message });
  }
};

export const deleteTrackedItemController = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteTrackedItemFromDB(id, req.user._id);
    if (!deleted) {
      return res.status(404).json({ message: "Tracked item not found" });
    }
    res.json({ message: "Tracked item deleted", deleted });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item", error: error.message });
  }
};
