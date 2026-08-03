import { findUserById, sanitizeUser } from "../dao/user.dao.js";
import { verifyJWT } from "../utils/JWT.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token || extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyJWT(token);
    const userId = decoded.userId || decoded.userid;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = sanitizeUser(user);
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

const extractBearerToken = (req) => {
  const header = req.headers?.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
};
