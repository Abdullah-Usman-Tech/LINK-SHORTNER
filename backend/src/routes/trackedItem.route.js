import express from "express";
import {
  getCategoriesController,
  createCategoryController,
  getTrackedItemsController,
  createTrackedItemController,
  updateTrackedItemStatusController,
  deleteTrackedItemController,
} from "../controllers/trackedItem.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/categories", getCategoriesController);
router.post("/categories", createCategoryController);

router.get("/", getTrackedItemsController);
router.post("/", createTrackedItemController);
router.patch("/:id/status", updateTrackedItemStatusController);
router.delete("/:id", deleteTrackedItemController);

export default router;
