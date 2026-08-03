import {
  saveLongUrl,
  getAllLongUrls,
  deleteLongUrlFromDB,
} from "../dao/longUrl.dao.js";

export const createLongUrlController = async (req, res) => {
  try {
    const { url, name } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: "URL is required" });
    }

    const saved = await saveLongUrl({ url, name, userId: req.user._id });
    res.status(201).json({ longUrl: saved });
  } catch (error) {
    res.status(500).json({ message: "Failed to save long URL", error: error.message });
  }
};

export const getAllLongUrlsController = async (req, res) => {
  try {
    const longUrls = await getAllLongUrls(req.user._id);
    res.json({ longUrls });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch long URLs", error: error.message });
  }
};

export const deleteLongUrlController = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteLongUrlFromDB(id, req.user._id);
    if (!deleted) {
      return res.status(404).json({ message: "Long URL not found" });
    }
    res.json({ message: "Long URL deleted successfully", deleted });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete long URL", error: error.message });
  }
};
