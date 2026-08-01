import mongoose from "mongoose";
import ShortUrl from "../models/shortUrl.model.js";
import { generteNanoId } from "../utils/generteNanoId.js";

export const saveShortUrl = async ({
  fullUrl,
  shortUrl,
  userId,
  custom = false,
}) => {
  return await ShortUrl.create({
    fullUrl,
    shortUrl,
    userId,
    custom,
  });
};
export const getFullUrl = async (shortUrl, viewLog = {}) => {
  const updateQuery = {
    $inc: { clicks: 1 },
  };

  if (viewLog && Object.keys(viewLog).length > 0) {
    updateQuery.$push = {
      viewsHistory: {
        $each: [
          {
            timestamp: new Date(),
            ip: viewLog.ip || "127.0.0.1",
            userAgent: viewLog.userAgent || "Unknown",
            referrer: viewLog.referrer || "Direct",
            browser: viewLog.browser || "Chrome",
            os: viewLog.os || "Windows",
            device: viewLog.device || "Desktop",
          },
        ],
        $position: 0,
      },
    };
  }

  const urlData = await ShortUrl.findOneAndUpdate({ shortUrl }, updateQuery, {
    new: true,
  });

  return urlData ? urlData.fullUrl : null;
};
export const findUrl = async (shortUrl) => {
  const urlData = await ShortUrl.findOne({ shortUrl });

  return urlData ? urlData.fullUrl : null;
};
export const getAllUrls = async () => {
  return await ShortUrl.find();
};
export const deleteURLFromDB = async (identifier) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  return await ShortUrl.findOneAndDelete({
    $or: [
      { shortUrl: identifier },
      ...(isObjectId ? [{ _id: identifier }] : []),
    ],
  });
};

