import express from "express";
import {
  verifySmtp,
  sendTestEmail,
  tailorResume,
  automateEmailApply,
} from "../controllers/test.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/verify-smtp", verifySmtp);
router.post("/send-email", sendTestEmail);
router.post("/tailor-resume", tailorResume);
router.post("/automate-email-apply", automateEmailApply);

export default router;
