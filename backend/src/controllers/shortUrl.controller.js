import {
  deleteURLFromDB,
  getAllUrls,
  getFullUrl,
} from "../dao/shortUrl.dao.js";
import { createShortUrlWithoutUser } from "../services/shortUrl.service.js";

export const createShortUrl = async (req, res) => {
  const { fullUrl } = req.body;
  const shortUrl = await createShortUrlWithoutUser(fullUrl);
  res.json({ shortUrl });
};
export const createCustomUrl = async (req, res) => {
  // const user = req.user;
  const { fullUrl, slug } = req.body;
  // const shortUrl = await createShortUrlWithoutUser(fullUrl, slug, "admin");
  
  const shortUrl = await createShortUrlWithoutUser(fullUrl, slug);
  if (!shortUrl)
    return res.status(400).json({
      message: "Custom slug already exists. Please choose a different one.",
    });
  res.json({ shortUrl });
};
export const redirectFromShortUrl = async (req, res) => {
  const { shortUrl } = req.params;
  const userAgent = req.headers["user-agent"] || "Unknown";
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
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

  const fullUrl = await getFullUrl(shortUrl, {
    ip,
    userAgent,
    referrer,
    browser,
    os,
    device,
  });

  if (fullUrl) {
    res.redirect(fullUrl);
  } else {
    res.status(404).send("Short URL not found");
  }
};

export const allUrls = async (req, res) => {
  const urls = await getAllUrls();
  res.json({ urls: urls });
};

export const deleteUrl = async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const deletedDocument = await deleteURLFromDB(shortUrl);
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

