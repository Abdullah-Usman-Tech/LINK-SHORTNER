import { saveTrackedItemToDB } from "../dao/trackedItem.dao.js";
import {
  buildEmailOpenPixelUrl,
  createShortUrlWithoutUser,
} from "./shortUrl.service.js";

const buildJobApplicationTitle = ({ jobTitle = "", company = "" }) => {
  const title = String(jobTitle || "").trim();
  const org = String(company || "").trim();

  if (title) return title;
  if (org) return `Application at ${org}`;
  return "Job Application";
};

const buildJobApplicationDescription = ({
  recipientEmail = "",
  hiringManager = "",
  sourceMode = "",
  notes = "",
}) => {
  return [
    "Auto-applied via Automate Email Apply.",
    recipientEmail ? `Sent to: ${recipientEmail}` : "",
    hiringManager ? `Contact: ${hiringManager}` : "",
    sourceMode ? `Source: ${sourceMode}` : "",
    notes ? String(notes).trim() : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const ensureHttpUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const createOneTrackedLink = async ({ label, type, fullUrl, userId }) => {
  const normalized =
    fullUrl === "__EMAIL_OPEN_PIXEL__" ? fullUrl : ensureHttpUrl(fullUrl);
  if (!normalized) return null;

  try {
    const shortUrl = await createShortUrlWithoutUser(normalized, null, userId);
    if (!shortUrl) return null;
    return {
      label,
      type,
      shortUrl,
      fullUrl: normalized,
    };
  } catch (err) {
    console.error(`[job-tracker] Failed to create short link for ${label}:`, err.message);
    return null;
  }
};

/**
 * Build short tracking links from the signed-in user's Account profile.
 * These are saved on the job application and inserted into the apply email.
 */
export const buildTrackedLinksFromProfile = async (user, userId) => {
  if (!userId) {
    console.warn("[job-tracker] Missing userId — cannot create tracking short links");
    return [];
  }
  if (!user) {
    console.warn("[job-tracker] Missing profile user — cannot create tracking short links");
    return [];
  }

  // Support both mongoose docs and plain objects / request overrides
  const profile = typeof user.toObject === "function" ? user.toObject() : user;

  const candidates = [
    {
      label: "Email Open Tracker",
      type: "email",
      // Special target: redirect handler serves a 1x1 GIF (real open tracking)
      fullUrl: "__EMAIL_OPEN_PIXEL__",
    },
    {
      label: "Resume / Portfolio",
      type: "resume",
      fullUrl: profile.portfolio || profile.website || "",
    },
    {
      label: "Portfolio",
      type: "portfolio",
      fullUrl: profile.portfolio || profile.website || "",
    },
    {
      label: "GitHub",
      type: "repo",
      fullUrl: profile.github || "",
    },
    {
      label: "LinkedIn",
      type: "other",
      fullUrl: profile.linkedin || "",
    },
    {
      label: "Website",
      type: "other",
      fullUrl:
        profile.website && profile.website !== profile.portfolio ? profile.website : "",
    },
    {
      label: "Twitter / X",
      type: "other",
      fullUrl: profile.twitter || "",
    },
    {
      label: "YouTube",
      type: "other",
      fullUrl: profile.youtube || "",
    },
  ];

  if (Array.isArray(profile.customLinks)) {
    for (const item of profile.customLinks) {
      const label = String(item?.label || "").trim();
      const url = String(item?.url || "").trim();
      if (!label || !url) continue;
      const lower = label.toLowerCase();
      let type = "other";
      if (lower.includes("resume") || lower.includes("cv")) type = "resume";
      else if (lower.includes("portfolio")) type = "portfolio";
      else if (lower.includes("git")) type = "repo";
      else if (lower.includes("demo")) type = "demo";
      candidates.push({ label, type, fullUrl: url });
    }
  }

  const seen = new Set();
  const unique = [];
  for (const item of candidates) {
    const fullUrl =
      item.fullUrl === "__EMAIL_OPEN_PIXEL__"
        ? "__EMAIL_OPEN_PIXEL__"
        : ensureHttpUrl(item.fullUrl);
    if (!fullUrl) continue;
    const key = `${item.type}::${fullUrl.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...item, fullUrl });
  }

  console.log(
    `[job-tracker] Creating tracking short links for user ${userId}: ${unique.length} candidate(s)`,
  );

  const links = [];
  for (const item of unique) {
    const created = await createOneTrackedLink({
      label: item.label,
      type: item.type,
      fullUrl: item.fullUrl,
      userId,
    });
    if (created) {
      console.log(`[job-tracker] Created ${item.type} → ${created.shortUrl}`);
      links.push(created);
    }
  }

  return links;
};

export const mergeProfileSources = (dbUser, profileLinks = {}) => {
  const base =
    dbUser && typeof dbUser.toObject === "function" ? dbUser.toObject() : dbUser || {};
  const override = profileLinks && typeof profileLinks === "object" ? profileLinks : {};

  const pick = (key) => {
    const fromOverride = String(override[key] || "").trim();
    const fromBase = String(base[key] || "").trim();
    return fromOverride || fromBase || "";
  };

  return {
    ...base,
    name: pick("name"),
    website: pick("website"),
    portfolio: pick("portfolio"),
    github: pick("github"),
    linkedin: pick("linkedin"),
    twitter: pick("twitter"),
    youtube: pick("youtube"),
    customLinks:
      Array.isArray(override.customLinks) && override.customLinks.length
        ? override.customLinks
        : base.customLinks || [],
  };
};

export const appendTrackedLinksToEmail = ({ bodyHtml = "", bodyText = "", trackedLinks = [] }) => {
  const visibleLinks = (trackedLinks || []).filter((l) => l.type !== "email");
  const emailPixel = (trackedLinks || []).find((l) => l.type === "email");

  if (!visibleLinks.length && !emailPixel) {
    return { bodyHtml, bodyText };
  }

  const htmlItems = visibleLinks
    .map(
      (l) =>
        `<li><a href="${l.shortUrl}" target="_blank" rel="noopener noreferrer">${l.label}</a></li>`,
    )
    .join("");

  const textItems = visibleLinks.map((l) => `- ${l.label}: ${l.shortUrl}`).join("\n");

  const pixelHtml = emailPixel
    ? `<img src="${buildEmailOpenPixelUrl(emailPixel.shortUrl)}" width="1" height="1" alt="" border="0" style="display:block;width:1px;height:1px;border:0;outline:none;overflow:hidden;" />`
    : "";

  const linksBlockHtml = visibleLinks.length
    ? `<div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 8px;font-size:13px;"><strong>Useful links</strong></p>
        <ul style="margin:0;padding-left:18px;font-size:13px;">${htmlItems}</ul>
      </div>${pixelHtml}`
    : pixelHtml;

  const linksBlockText = visibleLinks.length
    ? `\n\nUseful links:\n${textItems}`
    : "";

  return {
    bodyHtml: `${String(bodyHtml || "").trim()}${linksBlockHtml}`,
    bodyText: `${String(bodyText || "").trim()}${linksBlockText}`,
  };
};

export const createJobApplicationFromAutoApply = async ({
  extracted = {},
  postUrl = "",
  recipientEmail = "",
  sourceMode = "",
  userId,
  trackedLinks = [],
}) => {
  if (!userId) {
    throw new Error("userId is required to create a tracked job application");
  }

  const company = String(extracted.company || "").trim();
  const hiringManager = String(extracted.hiringManager || "").trim();
  const applyEmail = String(recipientEmail || extracted.email || "").trim();

  return saveTrackedItemToDB({
    title: buildJobApplicationTitle({
      jobTitle: extracted.jobTitle,
      company,
    }),
    companyOrPlatform: company,
    category: "jobs",
    description: buildJobApplicationDescription({
      recipientEmail: applyEmail,
      hiringManager,
      sourceMode,
      notes: extracted.notes,
    }),
    sourceUrl: String(postUrl || "").trim(),
    status: "Email Sent",
    trackedLinks: trackedLinks || [],
    userId,
  });
};

export { buildJobApplicationTitle, buildJobApplicationDescription };
