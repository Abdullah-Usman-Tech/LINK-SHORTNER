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
import {
  openEmailPixel,
  redirectFromShortUrl,
} from "./src/controllers/shortUrl.controller.js";
import { ensureOwnerAccountAndMigrateData } from "./src/services/authBootstrap.service.js";
import {
  getPublicHost,
  isLocalTrackingHost,
} from "./src/services/shortUrl.service.js";
import Category from "./src/models/category.model.js";

dotenv.config();

const app = express();

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

const allowedOrigins = [
  "https://link-shortner-frontend.abdullah-usman.tech",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Non-browser clients (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");
      const allowed = allowedOrigins.some(
        (o) => o && o.replace(/\/$/, "") === cleanOrigin,
      );

      if (allowed) {
        // Reflect exact origin (required when credentials: true)
        return callback(null, origin);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser());

// Email open pixel (must be public HTTPS — Gmail proxies this URL from their servers)
app.get("/o/:shortUrl", openEmailPixel);
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

const dropLegacyCategorySlugIndex = async () => {
  try {
    await Category.collection.dropIndex("slug_1");
    console.log("[auth-bootstrap] Dropped legacy Category.slug unique index");
  } catch (err) {
    if (err?.codeName !== "IndexNotFound" && err?.code !== 27) {
      console.warn("[auth-bootstrap] Could not drop slug_1 index:", err.message);
    }
  }
};

connectDB()
  .then(async () => {
    await dropLegacyCategorySlugIndex();
    await ensureOwnerAccountAndMigrateData();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`[tracking] Public host for short links / pixels: ${getPublicHost()}`);
      if (isLocalTrackingHost()) {
        console.warn(
          "[tracking] PUBLIC_HOST/HOST is localhost — Gmail cannot load email open pixels. Set PUBLIC_HOST to a public HTTPS URL (deployed API or a tunnel like cloudflared/ngrok).",
        );
      }
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
