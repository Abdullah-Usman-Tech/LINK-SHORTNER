import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";
import shortUrlRoutes from "./src/routes/shortUrl.route.js";
import authRoutes from "./src/routes/auth.route.js";
import longUrlRoutes from "./src/routes/longUrl.route.js";
import trackedItemRoutes from "./src/routes/trackedItem.route.js";
import testRoutes from "./src/routes/test.route.js";
import { redirectFromShortUrl } from "./src/controllers/shortUrl.controller.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "https://link-shortner-frontend.abdullah-usman.tech",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.some((o) => o && o.replace(/\/$/, "") === cleanOrigin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser());

app.get("/:shortUrl", redirectFromShortUrl);
app.use("/api/auth", authRoutes);
app.use("/api/shortUrl", shortUrlRoutes);
app.use("/api/longUrl", longUrlRoutes);
app.use("/api/tracked-items", trackedItemRoutes);
app.use("/api/test", testRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

const PORT = process.env.PORT || 3000;

connectDB().then(
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  }),
);
