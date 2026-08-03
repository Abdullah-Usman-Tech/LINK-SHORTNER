import express from "express";
import {
  allUrls,
  createCustomUrl,
  createShortUrl,
  deleteUrl,
} from "../controllers/shortUrl.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", allUrls);
router.post("/", createShortUrl);
router.post("/custom", createCustomUrl);
router.delete("/:shortUrl", deleteUrl);

export default router;
