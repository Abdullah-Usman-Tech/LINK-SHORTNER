import express from "express";
import {
  createLongUrlController,
  getAllLongUrlsController,
  deleteLongUrlController,
} from "../controllers/longUrl.controller.js";

const router = express.Router();

router.get("/", getAllLongUrlsController);
router.post("/", createLongUrlController);
router.delete("/:id", deleteLongUrlController);

export default router;
