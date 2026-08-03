import mongoose from "mongoose";
import { findUserByEmail, createUser } from "../dao/user.dao.js";
import ShortUrl from "../models/shortUrl.model.js";
import LongUrl from "../models/longUrl.model.js";
import TrackedItem from "../models/trackedItem.model.js";
import Category from "../models/category.model.js";
import { hashPassword } from "../utils/hashPassword.js";

const OWNER_EMAIL = (
  process.env.OWNER_EMAIL ||
  process.env.SMTP_USER ||
  "hello@abdullah-usman.tech"
)
  .trim()
  .toLowerCase();

/**
 * Ensures the primary owner account exists and owns any pre-auth / orphan data.
 * Password comes from OWNER_PASSWORD or SMTP_PASS in .env.
 */
export const ensureOwnerAccountAndMigrateData = async () => {
  const ownerPassword = process.env.OWNER_PASSWORD || process.env.SMTP_PASS;
  if (!ownerPassword) {
    console.warn(
      "[auth-bootstrap] OWNER_PASSWORD / SMTP_PASS missing — skipping owner bootstrap",
    );
    return null;
  }

  let owner = await findUserByEmail(OWNER_EMAIL, { includePassword: true });
  if (!owner) {
    owner = await createUser(OWNER_EMAIL, await hashPassword(ownerPassword));
    console.log(`[auth-bootstrap] Created owner account: ${OWNER_EMAIL}`);
  } else {
    owner.password = await hashPassword(ownerPassword);
    await owner.save();
    console.log(`[auth-bootstrap] Owner account ready: ${OWNER_EMAIL}`);
  }

  const ownerId = owner._id;
  const legacyHardcodedId = new mongoose.Types.ObjectId("688b71076fef2f5075799af6");

  const orphanFilter = {
    $or: [
      { userId: null },
      { userId: { $exists: false } },
      { userId: legacyHardcodedId },
    ],
  };

  const [shortUpdated, longUpdated, trackedUpdated] = await Promise.all([
    ShortUrl.updateMany(orphanFilter, { $set: { userId: ownerId } }),
    LongUrl.updateMany(orphanFilter, { $set: { userId: ownerId } }),
    TrackedItem.updateMany(orphanFilter, { $set: { userId: ownerId } }),
  ]);

  await Category.updateMany(
    { $or: [{ userId: null }, { userId: { $exists: false } }] },
    { $set: { userId: ownerId } },
  );

  console.log(
    `[auth-bootstrap] Migrated orphans → short:${shortUpdated.modifiedCount}, long:${longUpdated.modifiedCount}, tracked:${trackedUpdated.modifiedCount}`,
  );

  return owner;
};
