import { verifyConnection, sendMail } from "../services/email.service.js";
import {
  tailorResumeWithLlm,
  parseJobPostWithLlm,
  generateApplyEmailWithLlm,
  fetchPostContentFromUrl,
} from "../services/llm.service.js";
import { buildResumePdfAttachment } from "../services/resumePdf.service.js";
import {
  appendTrackedLinksToEmail,
  buildTrackedLinksFromProfile,
  createJobApplicationFromAutoApply,
  mergeProfileSources,
} from "../services/jobTracker.service.js";
import { findUserById } from "../dao/user.dao.js";
import {
  getPublicHost,
  isLocalTrackingHost,
} from "../services/shortUrl.service.js";

const llmErrorResponse = (err) => {
  const status =
    err.code === "MISSING_API_KEY" ||
    err.code === "VALIDATION" ||
    err.code === "FETCH_FAILED" ||
    err.code === "FETCH_EMPTY"
      ? err.status || 400
      : err.status && err.status >= 400 && err.status < 600
        ? err.status
        : 500;

  return {
    status,
    body: {
      success: false,
      message: err.message || "LLM request failed",
      code: err.code || "UNKNOWN",
      hint: err.hint || undefined,
    },
  };
};

export const verifySmtp = async (req, res) => {
  try {
    const { host, port, user, pass } = req.query;
    const overrides = {};
    if (host) overrides.host = host;
    if (port) overrides.port = port;
    if (user) overrides.user = user;
    if (pass !== undefined) overrides.pass = pass;

    const result = await verifyConnection(overrides);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error during SMTP verification",
    });
  }
};

export const sendTestEmail = async (req, res) => {
  try {
    const { to, subject, body, isHtml = true, attachments = [], smtpOverrides } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient email ('to') is required",
      });
    }

    const emailPayload = {
      to,
      subject: subject || "Test Email from Automation Sandbox",
      ...(isHtml ? { html: body } : { text: body }),
      attachments,
      smtpOverrides: smtpOverrides || {},
    };

    const result = await sendMail(emailPayload);

    return res.status(200).json({
      success: true,
      message: `Email sent successfully to ${to}${
        result.attachmentCount ? ` with ${result.attachmentCount} attachment(s)` : ""
      }`,
      details: result,
      sentAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to send test email",
    });
  }
};

export const tailorResume = async (req, res) => {
  try {
    const { jobDescription, guidelines = "", resumeHtml = "" } = req.body || {};

    if (!jobDescription?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description (JD) is required",
      });
    }

    if (!resumeHtml?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resume HTML is required. Enable 'Use my resume' or paste resume content.",
      });
    }

    const result = await tailorResumeWithLlm({
      jobDescription,
      guidelines,
      resumeHtml,
    });

    return res.status(200).json({
      success: true,
      message: "Resume tailored successfully for this job",
      tailoredHtml: result.tailoredHtml,
      model: result.model,
      usage: result.usage,
    });
  } catch (err) {
    const { status, body } = llmErrorResponse(err);
    return res.status(status).json({
      ...body,
      message: err.message || "Failed to tailor resume",
    });
  }
};

export const automateEmailApply = async (req, res) => {
  try {
    const {
      postText = "",
      postUrl = "",
      resumeHtml = "",
      guidelines = "",
      autoSendEmail = false,
      smtpOverrides = {},
      applicantName = "Abdullah Usman",
      profileLinks = {},
    } = req.body || {};

    if (!resumeHtml?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resume HTML is required. Save your resume in My Resume (Test Lab) first.",
        code: "VALIDATION",
      });
    }

    let sourceText = String(postText || "").trim();
    let sourceMode = sourceText ? "paste" : null;

    if (!sourceText && postUrl?.trim()) {
      sourceText = await fetchPostContentFromUrl(postUrl.trim());
      sourceMode = "url";
    }

    if (!sourceText) {
      return res.status(400).json({
        success: false,
        message: "Paste the full LinkedIn post text, or provide a post URL.",
        code: "VALIDATION",
      });
    }

    const parsed = await parseJobPostWithLlm({ postText: sourceText });
    const extracted = parsed.extracted;

    if (!extracted.jobDescription?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Could not extract a job description from the post.",
        code: "PARSE_FAILED",
        extracted,
      });
    }

    const dbUser = await findUserById(req.user._id);
    const profileUser = mergeProfileSources(dbUser, profileLinks);
    const applicantDisplayName =
      profileUser?.name?.trim() || applicantName || "Abdullah Usman";

    const tailored = await tailorResumeWithLlm({
      jobDescription: extracted.jobDescription,
      guidelines,
      resumeHtml,
    });

    const emailDraft = await generateApplyEmailWithLlm({
      jobDescription: extracted.jobDescription,
      resumeHtml: tailored.tailoredHtml || resumeHtml,
      company: extracted.company,
      jobTitle: extracted.jobTitle,
      hiringManager: extracted.hiringManager,
      applicantName: applicantDisplayName,
    });

    const trackedLinks = await buildTrackedLinksFromProfile(profileUser, req.user._id);
    const withLinks = appendTrackedLinksToEmail({
      bodyHtml: emailDraft.bodyHtml,
      bodyText: emailDraft.bodyText,
      trackedLinks,
    });

    const draft = {
      to: extracted.email || "",
      subject: emailDraft.subject,
      bodyHtml: withLinks.bodyHtml,
      bodyText: withLinks.bodyText,
    };

    const profileHint =
      trackedLinks.length === 0
        ? "No tracking short links created — add Portfolio/GitHub/LinkedIn in Account and save, then retry."
        : null;

    const openTrackingWarning = isLocalTrackingHost()
      ? `Email open pixel points at ${getPublicHost()} which Gmail cannot reach. Set PUBLIC_HOST in backend/.env to a public HTTPS URL (deployed API or cloudflared/ngrok tunnel), restart the server, then send a new email.`
      : null;

    let emailSent = false;
    let emailResult = null;
    let emailSkippedReason = null;
    let resumeAttached = false;
    let trackedItem = null;

    if (!autoSendEmail) {
      emailSkippedReason = "Auto-send is off — email was drafted only.";
    } else if (!draft.to) {
      emailSkippedReason =
        "No application email found in the post — draft is ready, but nothing was sent.";
    } else {
      const safeName = applicantDisplayName.replace(/[^\w.-]+/g, "_") || "Resume";
      const resumeAttachment = await buildResumePdfAttachment(
        tailored.tailoredHtml || resumeHtml,
        { filename: `${safeName}_Resume.pdf` },
      );

      emailResult = await sendMail({
        to: draft.to,
        subject: draft.subject,
        html: draft.bodyHtml,
        text: draft.bodyText,
        attachments: [resumeAttachment],
        smtpOverrides: smtpOverrides || {},
      });
      emailSent = true;
      resumeAttached = true;

      trackedItem = await createJobApplicationFromAutoApply({
        extracted,
        postUrl,
        recipientEmail: draft.to,
        sourceMode: sourceMode || "automate-email-apply",
        userId: req.user._id,
        trackedLinks,
      });
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? `Application sent to ${draft.to} with resume PDF + ${trackedLinks.length} tracking short link(s). Job added to tracker.`
        : trackedLinks.length
          ? `Draft ready with ${trackedLinks.length} tracking short link(s). Email not sent.`
          : "Post parsed and resume tailored. Email drafted (not sent).",
      sourceMode,
      extracted,
      tailoredHtml: tailored.tailoredHtml,
      emailDraft: draft,
      trackedLinks,
      linksCreatedCount: trackedLinks.length,
      profileHint,
      openTrackingWarning,
      publicHost: getPublicHost(),
      openTrackingReady: !isLocalTrackingHost(),
      autoSendEmail: Boolean(autoSendEmail),
      emailSent,
      resumeAttached,
      trackingCreated: Boolean(trackedItem),
      trackedItem,
      emailSkippedReason,
      emailResult,
      model: tailored.model,
    });
  } catch (err) {
    if (err.message && String(err.message).toLowerCase().includes("email")) {
      // SMTP failures after LLM work — still surface clearly
    }
    const { status, body } = llmErrorResponse(err);
    return res.status(status).json({
      ...body,
      message: err.message || "Automate email apply failed",
    });
  }
};
