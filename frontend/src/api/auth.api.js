import { api } from "../config/axios";

export const signIn = async ({ email, password }) => {
  const res = await api.post("/auth/signin", { email, password });
  return res.data;
};

export const signUp = async ({ email, password }) => {
  const res = await api.post("/auth/signup", { email, password });
  return res.data;
};

export const signOut = async () => {
  const res = await api.post("/auth/signout");
  return res.data;
};

export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};
