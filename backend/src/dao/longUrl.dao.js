import LongUrl from "../models/longUrl.model.js";

export const saveLongUrl = async ({ url, name, userId }) => {
  const finalName =
    name && name.trim()
      ? name.trim()
      : `random-${Math.floor(1000 + Math.random() * 9000)}`;

  const existing = await LongUrl.findOne({ url, name: finalName, userId });
  if (existing) {
    return existing;
  }

  return LongUrl.create({
    url: url.trim(),
    name: finalName,
    userId,
  });
};

export const getAllLongUrls = async (userId) => {
  return LongUrl.find({ userId }).sort({ createdAt: -1 });
};

export const deleteLongUrlFromDB = async (id, userId) => {
  return LongUrl.findOneAndDelete({ _id: id, userId });
};
