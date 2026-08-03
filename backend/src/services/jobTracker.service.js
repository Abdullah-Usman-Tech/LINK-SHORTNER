import { saveTrackedItemToDB } from "../dao/trackedItem.dao.js";

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

export const createJobApplicationFromAutoApply = async ({
  extracted = {},
  postUrl = "",
  recipientEmail = "",
  sourceMode = "",
}) => {
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
    trackedLinks: [],
  });
};

export { buildJobApplicationTitle, buildJobApplicationDescription };
