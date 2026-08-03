import fs from "fs";
import os from "os";
import path from "path";
import puppeteer from "puppeteer-core";

const WINDOWS_BROWSER_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  path.join(os.homedir(), "AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"),
  path.join(os.homedir(), "AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe"),
].filter(Boolean);

const UNIX_BROWSER_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean);

const findBrowserExecutable = () => {
  const candidates =
    process.platform === "win32" ? WINDOWS_BROWSER_CANDIDATES : UNIX_BROWSER_CANDIDATES;

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }

  return null;
};

const ensureFullHtmlDocument = (html, title = "Abdullah Usman — Resume") => {
  const raw = String(html || "").trim();
  if (!raw) return "";
  if (/<html[\s>]/i.test(raw) || /<body[\s>]/i.test(raw)) return raw;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body {
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      color: #222;
      font-size: 11.5px;
      line-height: 1.45;
      margin: 0;
      padding: 16px 18px;
    }
    h1 { font-size: 26px; letter-spacing: 0.5px; color: #1f3864; font-weight: 700; margin: 0 0 2px; }
    h2 {
      font-size: 12.5px; color: #1f3864; text-transform: uppercase;
      letter-spacing: 0.8px; border-bottom: 1.5px solid #1f3864;
      padding: 0 0 2px; margin: 12px 0 6px; font-weight: 700;
    }
    a { color: #1155cc; text-decoration: none; }
    ul { padding-left: 18px; margin: 0 0 4px; }
    li { margin: 0 0 3px; }
    p { margin: 0 0 6px; }
  </style>
</head>
<body>
${raw}
</body>
</html>`;
};

/**
 * Convert resume HTML into a PDF Buffer using system Chrome/Edge.
 */
export const htmlToPdfBuffer = async (html, { title = "Abdullah Usman — Resume" } = {}) => {
  const documentHtml = ensureFullHtmlDocument(html, title);
  if (!documentHtml) {
    const err = new Error("Resume HTML is empty — cannot build PDF attachment");
    err.code = "PDF_EMPTY_HTML";
    throw err;
  }

  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    const err = new Error(
      "Chrome/Edge not found for PDF generation. Set CHROME_PATH or PUPPETEER_EXECUTABLE_PATH.",
    );
    err.code = "PDF_BROWSER_MISSING";
    throw err;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setContent(documentHtml, { waitUntil: "networkidle0", timeout: 60000 });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.35in", right: "0.4in", bottom: "0.35in", left: "0.4in" },
    });

    return Buffer.from(pdf);
  } catch (error) {
    const err = new Error(error.message || "Failed to generate resume PDF");
    err.code = "PDF_GENERATION_FAILED";
    throw err;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
  }
};

export const buildResumePdfAttachment = async (
  resumeHtml,
  { filename = "Abdullah_Usman_Resume.pdf" } = {},
) => {
  const content = await htmlToPdfBuffer(resumeHtml);
  return {
    filename,
    content,
    contentType: "application/pdf",
  };
};
