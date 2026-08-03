import {
  deleteURLFromDB,
  getAllUrls,
  getFullUrl,
} from "../dao/shortUrl.dao.js";
import { createShortUrlWithoutUser } from "../services/shortUrl.service.js";

export const EMAIL_OPEN_PIXEL_TARGET = "__EMAIL_OPEN_PIXEL__";

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const normalizeShortCode = (value = "") =>
  String(value)
    .trim()
    .replace(/\.gif$/i, "")
    .replace(/^\/+/, "");

const buildViewLog = (req) => {
  const userAgent = req.headers["user-agent"] || "Unknown";
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1";
  const referrer = req.headers["referer"] || req.headers["referrer"] || "Direct";

  let browser = "Chrome";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";

  let os = "Windows";
  if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

  let device = "Desktop";
  if (/mobile|android|iphone|ipad|tablet/i.test(userAgent)) {
    device = /ipad|tablet/i.test(userAgent) ? "Tablet" : "Mobile";
  }

  return { ip, userAgent, referrer, browser, os, device };
};

const sendOpenPixel = (res) => {
  res.set({
    "Content-Type": "image/gif",
    "Content-Length": String(TRANSPARENT_GIF.length),
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });
  return res.status(200).end(TRANSPARENT_GIF);
};

export const createShortUrl = async (req, res) => {
  try {
    const { fullUrl } = req.body;
    if (!fullUrl?.trim()) {
      return res.status(400).json({ message: "fullUrl is required" });
    }
    const shortUrl = await createShortUrlWithoutUser(fullUrl.trim(), null, req.user._id);
    res.json({ shortUrl });
  } catch (error) {
    res.status(500).json({ message: "Failed to create short URL", error: error.message });
  }
};

export const createCustomUrl = async (req, res) => {
  try {
    const { fullUrl, slug } = req.body;
    if (!fullUrl?.trim() || !slug?.trim()) {
      return res.status(400).json({ message: "fullUrl and slug are required" });
    }

    const shortUrl = await createShortUrlWithoutUser(fullUrl.trim(), slug.trim(), req.user._id);
    if (!shortUrl) {
      return res.status(400).json({
        message: "Custom slug already exists. Please choose a different one.",
      });
    }
    res.json({ shortUrl });
  } catch (error) {
    res.status(500).json({ message: "Failed to create custom URL", error: error.message });
  }
};

export const redirectFromShortUrl = async (req, res) => {
  const shortUrl = normalizeShortCode(req.params.shortUrl);
  const viewLog = buildViewLog(req);
  const fullUrl = await getFullUrl(shortUrl, viewLog);

  if (!fullUrl) {
    return res.status(404).send("Short URL not found");
  }

  if (fullUrl === EMAIL_OPEN_PIXEL_TARGET) {
    return sendOpenPixel(res);
  }

  return res.redirect(fullUrl);
};

/** Dedicated email-open endpoint — always serves GIF when code matches a pixel short link. */
export const openEmailPixel = async (req, res) => {
  const shortUrl = normalizeShortCode(req.params.shortUrl);
  const viewLog = buildViewLog(req);
  const fullUrl = await getFullUrl(shortUrl, viewLog);

  if (!fullUrl) {
    // Still return a GIF so clients don't retry aggressively
    return sendOpenPixel(res);
  }

  return sendOpenPixel(res);
};

export const allUrls = async (req, res) => {
  try {
    const urls = await getAllUrls(req.user._id);
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch URLs", error: error.message });
  }
};

export const deleteUrl = async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const deletedDocument = await deleteURLFromDB(shortUrl, req.user._id);
    if (!deletedDocument) {
      return res.status(404).json({ message: "Short URL not found" });
    }
    res.json({
      message: "Short URL deleted successfully",
      deletedUrl: deletedDocument,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete short URL",
      error: error.message,
    });
  }
};
