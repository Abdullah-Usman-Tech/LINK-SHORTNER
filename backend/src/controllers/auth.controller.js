import { cookiesOptions } from "../config/config.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  sanitizeUser,
} from "../dao/user.dao.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import { createJWT } from "../utils/JWT.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await findUserByEmail(email, { includePassword: true });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createJWT({ userId: user._id });
    res.cookie("token", token, cookiesOptions);

    return res.status(200).json({
      message: "Login successful",
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to sign in",
    });
  }
};

export const signUp = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await createUser(email, hashedPassword);
    const token = createJWT({ userId: newUser._id });
    res.cookie("token", token, cookiesOptions);

    return res.status(201).json({
      message: "Account created successfully",
      user: sanitizeUser(newUser),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to sign up",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to fetch profile",
    });
  }
};

export const signOut = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: cookiesOptions.httpOnly,
    secure: cookiesOptions.secure,
    sameSite: cookiesOptions.sameSite,
  });
  return res.status(200).json({ message: "Signed out successfully" });
};
