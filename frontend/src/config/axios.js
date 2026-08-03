import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || error.message || "Request failed";
    const enriched = new Error(message);
    enriched.response = error.response;
    enriched.status = error.response?.status;
    return Promise.reject(enriched);
  },
);
