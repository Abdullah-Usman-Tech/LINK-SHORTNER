import express from "express";
import { verifySmtp, sendTestEmail, tailorResume } from "../controllers/test.controller.js";

const router = express.Router();

router.get("/verify-smtp", verifySmtp);
router.post("/send-email", sendTestEmail);
router.post("/tailor-resume", tailorResume);

export default router;
