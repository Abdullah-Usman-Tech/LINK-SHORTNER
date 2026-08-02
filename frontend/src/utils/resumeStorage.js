const STORAGE_KEY = "resumeHandler.html.v1";

export function getStoredResumeHtml(fallback = "") {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.includes("<body")) return saved;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function saveResumeHtml(html) {
  try {
    localStorage.setItem(STORAGE_KEY, html);
  } catch {
    /* ignore quota */
  }
}

export function clearStoredResumeHtml() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function extractBodyInner(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1].trim() : html;
}

export function extractStyles(html) {
  const matches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  return matches.map((m) => m[1]).join("\n");
}

export function buildFullHtml(bodyInner, styles, title = "Abdullah Usman — Resume") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${styles}</style>
</head>
<body>
${bodyInner}
</body>
</html>`;
}

export function htmlToPlainText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export { STORAGE_KEY };
