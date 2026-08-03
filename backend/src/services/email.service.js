import nodemailer from "nodemailer";
import dotenv from "dotenv";

const getSmtpConfig = (overrides = {}) => {
  dotenv.config();

  const host = overrides.host || process.env.SMTP_HOST || "smtp.titan.email";
  const port = parseInt(overrides.port || process.env.SMTP_PORT || "465", 10);
  const user = overrides.user || process.env.SMTP_USER || "hello@abdullah-usman.tech";
  const pass = overrides.pass !== undefined ? overrides.pass : process.env.SMTP_PASS;

  const secure = port === 465;

  return { host, port, user, pass, secure };
};

const createTransporter = (overrides = {}) => {
  const config = getSmtpConfig(overrides);

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // tls: {
    //   rejectUnauthorized: false,
    // },
  });
};

export const verifyConnection = async (overrides = {}) => {
  try {
    const config = getSmtpConfig(overrides);
    const transporter = createTransporter(overrides);
    await transporter.verify();
    return {
      success: true,
      message: `Connected successfully to ${config.host}:${config.port} as ${config.user}`,
      user: config.user,
      host: config.host,
      port: config.port,
    };
  } catch (error) {
    const config = getSmtpConfig(overrides);
    return {
      success: false,
      message: error.message || "Failed to authenticate with SMTP server",
      user: config.user,
      host: config.host,
      port: config.port,
      errorResponse: error.response,
      errorCode: error.code,
    };
  }
};

const normalizeAttachments = (attachments = []) => {
  if (!Array.isArray(attachments) || attachments.length === 0) return undefined;

  return attachments
    .map((item) => {
      if (!item) return null;

      const filename = item.filename || item.name || "attachment";
      const contentType = item.contentType || item.content_type || undefined;
      const encoding = item.encoding || undefined;
      let content = item.content ?? item.data ?? item.buffer;

      if (typeof content === "string" && encoding === "base64") {
        content = Buffer.from(content.replace(/^data:[^;]+;base64,/, ""), "base64");
      }

      if (content == null || content === "") return null;

      return {
        filename,
        content,
        contentType,
        cid: item.cid,
      };
    })
    .filter(Boolean);
};

export const sendMail = async ({
  to,
  subject,
  text,
  html,
  attachments = [],
  smtpOverrides = {},
}) => {
  try {
    const config = getSmtpConfig(smtpOverrides);
    const transporter = createTransporter(smtpOverrides);
    const fromAddress = `Abdullah Usman <${config.user}>`;
    const normalizedAttachments = normalizeAttachments(attachments);

    const mailOptions = {
      from: fromAddress,
      to,
      cc: fromAddress,
      subject: subject || "Test Email from Automation Sandbox",
      text: text || undefined,
      html: html || text || "<p>This is a test email sent from your automation dashboard.</p>",
      ...(normalizedAttachments?.length ? { attachments: normalizedAttachments } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      attachmentCount: normalizedAttachments?.length || 0,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(error.message || "Failed to send email");
  }
};
