import { verifyConnection, sendMail } from "../services/email.service.js";
import { tailorResumeWithLlm } from "../services/llm.service.js";

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
    const { to, subject, body, isHtml = true, smtpOverrides } = req.body;

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
      smtpOverrides: smtpOverrides || {},
    };

    const result = await sendMail(emailPayload);

    return res.status(200).json({
      success: true,
      message: `Email sent successfully to ${to}`,
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
    const status =
      err.code === "MISSING_API_KEY" || err.code === "VALIDATION"
        ? 400
        : err.status && err.status >= 400 && err.status < 600
          ? err.status
          : 500;

    return res.status(status).json({
      success: false,
      message: err.message || "Failed to tailor resume",
      code: err.code || "UNKNOWN",
      hint: err.hint || undefined,
    });
  }
};
