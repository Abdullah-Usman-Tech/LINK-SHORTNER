import express from "express";
import {
  createLongUrlController,
  getAllLongUrlsController,
  deleteLongUrlController,
} from "../controllers/longUrl.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAllLongUrlsController);
router.post("/", createLongUrlController);
router.delete("/:id", deleteLongUrlController);

export default router;
