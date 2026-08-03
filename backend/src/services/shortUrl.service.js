import mongoose from "mongoose";
import { findUrl, saveShortUrl } from "../dao/shortUrl.dao.js";
import { generteNanoId } from "../utils/generteNanoId.js";

export const getPublicHost = () => {
  const host = process.env.PUBLIC_HOST || process.env.HOST || "http://localhost:3000/";
  return host.endsWith("/") ? host : `${host}/`;
};

/** Gmail/Outlook fetch images from their own servers — localhost can never receive those hits. */
export const isLocalTrackingHost = () => {
  try {
    const { hostname } = new URL(getPublicHost());
    const host = hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local")
    );
  } catch {
    return true;
  }
};

export const getShortCodeFromUrl = (shortLinkOrId = "") => {
  const last = String(shortLinkOrId).split("/").filter(Boolean).pop() || "";
  return last.replace(/\.gif$/i, "");
};

/** Email-friendly open pixel URL (looks like an image path for client proxies). */
export const buildEmailOpenPixelUrl = (shortLinkOrId) => {
  const code = getShortCodeFromUrl(shortLinkOrId);
  return `${getPublicHost()}o/${code}.gif`;
};

export const createShortUrlWithoutUser = async (fullUrl, slug = null, userId = null) => {
  if (!fullUrl?.trim()) {
    throw new Error("fullUrl is required to create a short link");
  }

  const id = slug || generteNanoId();
  const shortUrl = `${getPublicHost()}${id}`;
  const existingUrl = await findUrl(id);
  if (existingUrl) return false;

  const normalizedUserId =
    userId && mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : null;

  await saveShortUrl({
    fullUrl: fullUrl.trim(),
    shortUrl: id,
    userId: normalizedUserId,
    custom: Boolean(slug),
  });

  return shortUrl;
};
