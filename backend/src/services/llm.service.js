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
    tailoredHtml: content,
    model,
    usage: data?.usageMetadata || null,
  };
};

export const tailorResumeWithLlm = async ({
  jobDescription,
  resumeHtml,
  guidelines = "",
}) => {
  const { apiKey, model, baseUrl, provider } = getLlmConfig();

  if (!apiKey) {
    const err = new Error(
      "Gemini API key is missing. Set GEMINI_API_KEY in backend/.env",
    );
    err.code = "MISSING_API_KEY";
    err.status = 400;
    err.hint = "Get a free key at https://aistudio.google.com/apikey";
    throw err;
  }

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

  if (provider !== "gemini") {
    const err = new Error(
      `Unsupported LLM_PROVIDER "${provider}". Set LLM_PROVIDER=gemini in backend/.env`,
    );
    err.code = "UNSUPPORTED_PROVIDER";
    err.status = 400;
    throw err;
  }

  return callGemini({ apiKey, baseUrl, model, systemPrompt, userPrompt });
};
