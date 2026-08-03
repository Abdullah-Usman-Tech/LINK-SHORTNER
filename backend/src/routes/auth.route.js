import express from "express";
import { getMe, signIn, signOut, signUp, updateMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signin", signIn);
router.post("/signup", signUp);
router.post("/signout", authMiddleware, signOut);
router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, updateMe);

export default router;
