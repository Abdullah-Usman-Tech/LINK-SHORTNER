import express from "express";
import {
  allUrls,
  createCustomUrl,
  createShortUrl,
  deleteUrl,
  redirectFromShortUrl,
} from "../controllers/shortUrl.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = express.Router();
router.delete("/:shortUrl", deleteUrl);
router.get("/", allUrls);
router.post("/", createShortUrl);
// router.post("/custom", authMiddleware, createCustomUrl);

router.post("/custom", createCustomUrl);

export default router;
