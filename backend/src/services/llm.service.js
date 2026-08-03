import dotenv from "dotenv";

dotenv.config();

const getLlmConfig = () => ({
  provider: (process.env.LLM_PROVIDER || "gemini").toLowerCase(),
  apiKey:
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    "",
  model: process.env.GEMINI_MODEL || process.env.LLM_MODEL || "gemini-2.5-flash",
  baseUrl: (
    process.env.GEMINI_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta"
  ).replace(/\/$/, ""),
});

const classifyGeminiError = (status, data) => {
  const raw =
    data?.error?.message ||
    data?.message ||
    (typeof data?.error === "string" ? data.error : "") ||
    "";
  const lower = String(raw).toLowerCase();
  const statusText = String(data?.error?.status || "").toLowerCase();

  // Free-tier / quota / rate limit
  if (
    status === 429 ||
    statusText.includes("resource_exhausted") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("too many requests") ||
    lower.includes("exceeded your current quota")
  ) {
    return {
      code: "QUOTA_EXCEEDED",
      status: 429,
      message:
        "Gemini free API limit reached (quota / rate limit). Wait a bit, or create another free API key in Google AI Studio, then update GEMINI_API_KEY in backend/.env.",
      hint: "Check usage at https://aistudio.google.com/apikey",
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    statusText.includes("permission") ||
    lower.includes("api key not valid") ||
    lower.includes("invalid api key") ||
    lower.includes("api_key_invalid") ||
    lower.includes("permission denied")
  ) {
    return {
      code: "INVALID_API_KEY",
      status: status || 401,
      message:
        "Gemini API key is invalid or blocked. Verify GEMINI_API_KEY in backend/.env and that the Generative Language API is enabled.",
      hint: "Create/copy a key from https://aistudio.google.com/apikey",
    };
  }

  if (status === 404 || lower.includes("not found") || lower.includes("is not found")) {
    return {
      code: "MODEL_NOT_FOUND",
      status: 404,
      message: `Gemini model not found. Update GEMINI_MODEL in backend/.env (current request failed for this model). Details: ${raw || "n/a"}`,
      hint: "Try gemini-2.5-flash or gemini-flash-latest",
    };
  }

  if (status === 400) {
    return {
      code: "BAD_REQUEST",
      status: 400,
      message: raw || "Gemini rejected the request (bad request).",
      hint: "JD/resume may be too large, or the prompt format is invalid.",
    };
  }

  if (status >= 500) {
    return {
      code: "PROVIDER_DOWN",
      status,
      message: `Gemini service error (${status}). Try again in a minute.`,
      hint: raw || undefined,
    };
  }

  return {
    code: "LLM_ERROR",
    status: status || 500,
    message: raw || `Gemini request failed (${status || "unknown"})`,
  };
};

const stripCodeFences = (content) => {
  let text = String(content || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "");
  }
  return text.trim();
};

const callGemini = async ({ apiKey, baseUrl, model, systemPrompt, userPrompt }) => {
  const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192,
        },
      }),
    });
  } catch (networkErr) {
    const err = new Error(
      `Could not reach Gemini API. Check your internet connection. (${networkErr.message})`,
    );
    err.code = "NETWORK_ERROR";
    err.status = 503;
    throw err;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const classified = classifyGeminiError(response.status, data);
    const err = new Error(classified.message);
    err.code = classified.code;
    err.status = classified.status;
    err.hint = classified.hint;
    throw err;
  }

  // Blocked / safety / empty candidates
  const blockReason =
    data?.promptFeedback?.blockReason ||
    data?.candidates?.[0]?.finishReason;
  const finish = String(blockReason || "").toUpperCase();

  if (finish === "SAFETY" || finish === "BLOCKLIST" || finish === "PROHIBITED_CONTENT") {
    const err = new Error(
      "Gemini blocked this request for safety reasons. Soften the JD/guidelines wording and try again.",
    );
    err.code = "CONTENT_BLOCKED";
    err.status = 400;
    throw err;
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const content = stripCodeFences(parts.map((p) => p.text || "").join("\n"));

  if (!content) {
    // Sometimes free tier returns empty with finishReason MAX_TOKENS / OTHER
    const err = new Error(
      finish
        ? `Gemini returned empty content (finish reason: ${finish}). Try a shorter JD/resume or another free model.`
        : "Gemini returned an empty resume. Try again, or switch GEMINI_MODEL.",
    );
    err.code = "EMPTY_RESPONSE";
    err.status = 502;
    err.hint = "If this keeps happening on free tier, wait and retry — quota may be soft-throttling.";
    throw err;
  }

  return {
    content,
    model,
    usage: data?.usageMetadata || null,
  };
};

const requireGeminiConfig = () => {
  const config = getLlmConfig();

  if (!config.apiKey) {
    const err = new Error(
      "Gemini API key is missing. Set GEMINI_API_KEY in backend/.env",
    );
    err.code = "MISSING_API_KEY";
    err.status = 400;
    err.hint = "Get a free key at https://aistudio.google.com/apikey";
    throw err;
  }

  if (config.provider !== "gemini") {
    const err = new Error(
      `Unsupported LLM_PROVIDER "${config.provider}". Set LLM_PROVIDER=gemini in backend/.env`,
    );
    err.code = "UNSUPPORTED_PROVIDER";
    err.status = 400;
    throw err;
  }

  return config;
};

const parseJsonFromLlm = (content) => {
  let text = String(content || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM did not return valid JSON");
  }
  return JSON.parse(text.slice(start, end + 1));
};

const extractEmailsFromText = (text) => {
  const matches = String(text || "").match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  );
  if (!matches?.length) return [];
  const skip = /noreply|no-reply|donotreply|example\.com|sentry|linkedin\.com/i;
  return [...new Set(matches.filter((e) => !skip.test(e)))];
};

export const fetchPostContentFromUrl = async (url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    const err = new Error("Invalid post URL");
    err.code = "VALIDATION";
    err.status = 400;
    throw err;
  }

  if (!/^https?:$/i.test(parsed.protocol)) {
    const err = new Error("Only http/https URLs are supported");
    err.code = "VALIDATION";
    err.status = 400;
    throw err;
  }

  let response;
  try {
    response = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (networkErr) {
    const err = new Error(
      `Could not fetch the post URL (${networkErr.message}). Paste the full post text instead.`,
    );
    err.code = "FETCH_FAILED";
    err.status = 400;
    throw err;
  }

  const html = await response.text();
  if (!response.ok) {
    const err = new Error(
      `Could not load post URL (HTTP ${response.status}). LinkedIn often blocks automated fetches — paste the full post text instead.`,
    );
    err.code = "FETCH_FAILED";
    err.status = 400;
    throw err;
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 80) {
    const err = new Error(
      "Fetched page had almost no readable text (login wall / blocked). Paste the full LinkedIn post text instead.",
    );
    err.code = "FETCH_EMPTY";
    err.status = 400;
    throw err;
  }

  return text.slice(0, 25000);
};

export const parseJobPostWithLlm = async ({ postText }) => {
  const { apiKey, model, baseUrl } = requireGeminiConfig();

  if (!postText?.trim()) {
    const err = new Error("Post text is required");
    err.code = "VALIDATION";
    err.status = 400;
    throw err;
  }

  const systemPrompt = `You extract job-application details from LinkedIn / hiring posts.
Return ONLY valid JSON (no markdown) with this exact shape:
{
  "jobTitle": "string or empty",
  "company": "string or empty",
  "hiringManager": "string or empty",
  "email": "application email if present else empty",
  "jobDescription": "cleaned full JD / role requirements from the post",
  "notes": "short note if email missing or unclear"
}
Rules:
- Prefer the email where candidates should apply / send CV.
- jobDescription must keep requirements, responsibilities, and location/experience if present.
- Do not invent an email. If none, use "".`;

  const userPrompt = `POST CONTENT:
${postText.trim().slice(0, 20000)}

Extract the JSON now.`;

  const result = await callGemini({
    apiKey,
    baseUrl,
    model,
    systemPrompt,
    userPrompt,
  });

  let extracted;
  try {
    extracted = parseJsonFromLlm(result.content);
  } catch {
    const err = new Error("Failed to parse job post into structured fields");
    err.code = "PARSE_FAILED";
    err.status = 502;
    throw err;
  }

  const regexEmails = extractEmailsFromText(postText);
  const email =
    String(extracted.email || "").trim() || regexEmails[0] || "";

  return {
    extracted: {
      jobTitle: String(extracted.jobTitle || "").trim(),
      company: String(extracted.company || "").trim(),
      hiringManager: String(extracted.hiringManager || "").trim(),
      email,
      jobDescription: String(extracted.jobDescription || postText).trim(),
      notes: String(extracted.notes || "").trim(),
    },
    model: result.model,
    usage: result.usage,
  };
};

export const generateApplyEmailWithLlm = async ({
  jobDescription,
  resumeHtml,
  company = "",
  jobTitle = "",
  hiringManager = "",
  applicantName = "Abdullah Usman",
}) => {
  const { apiKey, model, baseUrl } = requireGeminiConfig();

  const systemPrompt = `You write concise, professional job-application emails.
Return ONLY valid JSON (no markdown):
{
  "subject": "email subject",
  "bodyHtml": "HTML email body with short paragraphs and a polite close",
  "bodyText": "plain-text version of the same email"
}
Rules:
- 120–220 words.
- Mention role + company if known.
- Highlight 2–4 truthful strengths aligned to the JD (from resume only — do not invent experience).
- Ask for next steps / interview politely.
- Mention that the tailored resume PDF is attached (it will be attached by the sending system).
- Sign off as ${applicantName}.`;

  const userPrompt = `ROLE: ${jobTitle || "Not specified"}
COMPANY: ${company || "Not specified"}
HIRING CONTACT: ${hiringManager || "Hiring Team"}

JOB DESCRIPTION:
${String(jobDescription || "").trim().slice(0, 12000)}

CANDIDATE RESUME (HTML / text):
${String(resumeHtml || "").trim().slice(0, 18000)}

Write the application email JSON now.`;

  const result = await callGemini({
    apiKey,
    baseUrl,
    model,
    systemPrompt,
    userPrompt,
  });

  let draft;
  try {
    draft = parseJsonFromLlm(result.content);
  } catch {
    const err = new Error("Failed to generate application email");
    err.code = "EMAIL_GEN_FAILED";
    err.status = 502;
    throw err;
  }

  const subject =
    String(draft.subject || "").trim() ||
    `Application for ${jobTitle || "the role"}${company ? ` at ${company}` : ""}`;

  const bodyHtml =
    String(draft.bodyHtml || "").trim() ||
    `<p>${String(draft.bodyText || "").trim()}</p>`;

  const bodyText = String(draft.bodyText || "").trim();

  return {
    subject,
    bodyHtml,
    bodyText,
    model: result.model,
    usage: result.usage,
  };
};

export const tailorResumeWithLlm = async ({
  jobDescription,
  resumeHtml,
  guidelines = "",
}) => {
  const { apiKey, model, baseUrl } = requireGeminiConfig();

  if (!jobDescription?.trim()) {
    const err = new Error("Job description is required");
    err.code = "VALIDATION";
    err.status = 400;
    throw err;
  }

  if (!resumeHtml?.trim()) {
    const err = new Error("Resume content is required when using your resume");
    err.code = "VALIDATION";
    err.status = 400;
    throw err;
  }

  const systemPrompt = `You are an expert resume writer and ATS specialist.
Rewrite the candidate's resume HTML so it is tailored to the given job description.

Rules:
1. Return ONLY valid HTML for the resume body content (no markdown, no code fences, no explanations).
2. Keep the same semantic structure and CSS class names when present (h1, h2, .subtitle, .contact, .job, .job-header, .job-meta, .skills-row, .project, .project-title, .project-link, .tech, ul/li).
3. Do NOT invent fake employers, degrees, dates, or projects. You may rephrase, reorder emphasis, and selectively expand truthful bullets.
4. Tune the Summary, skills ordering, and bullet wording to mirror relevant JD keywords naturally.
5. Keep length suitable for a 1-page resume.
6. Preserve contact info and real links from the original resume.
7. If guidelines are provided, follow them strictly.`;

  const userPrompt = `JOB DESCRIPTION:
${jobDescription.trim()}

${guidelines?.trim() ? `EXTRA GUIDELINES:\n${guidelines.trim()}\n` : ""}
CURRENT RESUME HTML:
${resumeHtml.trim()}

Return the tailored resume as HTML body content only.`;

  const result = await callGemini({ apiKey, baseUrl, model, systemPrompt, userPrompt });
  return {
    tailoredHtml: result.content,
    model: result.model,
    usage: result.usage,
  };
};
