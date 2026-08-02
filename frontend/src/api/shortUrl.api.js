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

export const getAllLongUrls = async () => {
  const res = await api.get("/longUrl");
  return res.data;
};

export const createLongUrl = async (url, name) => {
  const res = await api.post("/longUrl", { url, name });
  return res.data.longUrl;
};

export const deleteLongUrl = async (id) => {
  const res = await api.delete(`/longUrl/${id}`);
  return res.data;
};

// Categories & Tracked Items APIs
export const getCategories = async () => {
  const res = await api.get("/tracked-items/categories");
  return res.data.categories;
};

export const createCategory = async (name, icon, color) => {
  const res = await api.post("/tracked-items/categories", { name, icon, color });
  return res.data.category;
};

export const getTrackedItems = async () => {
  const res = await api.get("/tracked-items");
  return res.data.items;
};

export const createTrackedItem = async (itemData) => {
  const res = await api.post("/tracked-items", itemData);
  return res.data.item;
};

export const updateTrackedItemStatus = async (id, status) => {
  const res = await api.patch(`/tracked-items/${id}/status`, { status });
  return res.data.item;
};

export const deleteTrackedItem = async (id) => {
  const res = await api.delete(`/tracked-items/${id}`);
  return res.data;
};

// Test & SMTP Automation APIs
export const verifySmtp = async (params = {}) => {
  const res = await api.get("/test/verify-smtp", { params });
  return res.data;
};

export const sendTestEmail = async ({ to, subject, body, isHtml = true, smtpOverrides = {} }) => {
  const res = await api.post("/test/send-email", { to, subject, body, isHtml, smtpOverrides });
  return res.data;
};

export const tailorResume = async ({ jobDescription, guidelines = "", resumeHtml = "" }) => {
  const res = await api.post("/test/tailor-resume", {
    jobDescription,
    guidelines,
    resumeHtml,
  });
  return res.data;
};


