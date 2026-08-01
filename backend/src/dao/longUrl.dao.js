import LongUrl from "../models/longUrl.model.js";

export const saveLongUrl = async ({ url, name, userId = null }) => {
  const finalName =
    name && name.trim()
      ? name.trim()
      : `random-${Math.floor(1000 + Math.random() * 9000)}`;

  // Check if identical name/url already exists or save new entry
  const existing = await LongUrl.findOne({ url, name: finalName });
  if (existing) {
    return existing;
  }

  return await LongUrl.create({
    url: url.trim(),
    name: finalName,
    userId,
  });
};

export const getAllLongUrls = async () => {
  return await LongUrl.find().sort({ createdAt: -1 });
};

export const deleteLongUrlFromDB = async (id) => {
  return await LongUrl.findByIdAndDelete(id);
};
