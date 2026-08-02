import express from "express";
import {
  getCategoriesController,
  createCategoryController,
  getTrackedItemsController,
  createTrackedItemController,
  updateTrackedItemStatusController,
  deleteTrackedItemController,
} from "../controllers/trackedItem.controller.js";

const router = express.Router();

// Categories routes
router.get("/categories", getCategoriesController);
router.post("/categories", createCategoryController);

// Tracked items routes
router.get("/", getTrackedItemsController);
router.post("/", createTrackedItemController);
router.patch("/:id/status", updateTrackedItemStatusController);
router.delete("/:id", deleteTrackedItemController);

export default router;
