import User from "../models/user.model.js";

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

export const findUserByEmail = async (email, { includePassword = false } = {}) => {
  let query = User.findOne({ email: String(email || "").trim().toLowerCase() });
  if (includePassword) query = query.select("+password");
  return query;
};

export const findUserById = async (id, { includePassword = false } = {}) => {
  let query = User.findById(id);
  if (includePassword) query = query.select("+password");
  return query;
};

export const createUser = async (email, password) => {
  return User.create({
    email: String(email || "").trim().toLowerCase(),
    password,
  });
};

export const updateUserProfile = async (userId, profileData = {}) => {
  const allowed = [
    "name",
    "bio",
    "phone",
    "location",
    "website",
    "github",
    "linkedin",
    "twitter",
    "portfolio",
    "youtube",
    "customLinks",
  ];

  const updates = {};
  for (const key of allowed) {
    if (profileData[key] === undefined) continue;
    updates[key] = profileData[key];
  }

  return User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
};

export { sanitizeUser };
