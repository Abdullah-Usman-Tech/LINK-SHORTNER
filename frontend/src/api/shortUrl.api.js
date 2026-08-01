import { api } from "../config/axios";

export const createShortUrl = async (fullUrl) => {
  const res = await api.post("/shortUrl", { fullUrl });
  return res.data.shortUrl;
};
export const createCustomUrl = async (fullUrl, slug) => {
  const res = await api.post("/shortUrl/custom", { fullUrl, slug });
  return res.data.shortUrl;
};
export const getAllUrls = async () => {
  const res = await api.get("/shortUrl");
  return res.data;
};

export const deleteLink = async (shortUrl) => {
  const res = await api.delete(`/shortUrl/${encodeURIComponent(shortUrl)}`);
  return res.data;
};

