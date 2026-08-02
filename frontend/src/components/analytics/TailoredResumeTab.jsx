import { useEffect, useRef, useState } from "react";
import defaultResumeHtml from "../../templates/defaultResume.html?raw";
import { tailorResume } from "../../api/shortUrl.api.js";
import {
  buildFullHtml,
  extractBodyInner,
  extractStyles,
  getStoredResumeHtml,
} from "../../utils/resumeStorage.js";

const RESUME_PREVIEW_CSS = `
  .resume-preview {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    color: #222;
    font-size: 11.5px;
    line-height: 1.45;
    background: #fff;
    padding: 16px 18px;
    max-width: 100%;
    margin: 0;
  }
  .resume-preview h1 {
    font-size: 26px; letter-spacing: 0.5px; color: #1f3864;
    font-weight: 700; margin: 0 0 2px;
  }
  .resume-preview .subtitle {
    font-size: 13px; color: #555; font-weight: 600; margin: 0 0 6px;
  }
  .resume-preview .contact {
    font-size: 11px; color: #555; margin: 0 0 12px;
  }
  .resume-preview .contact a { color: #1155cc; text-decoration: none; }
  .resume-preview h2 {
    font-size: 12.5px; color: #1f3864; text-transform: uppercase;
    letter-spacing: 0.8px; border-bottom: 1.5px solid #1f3864;
    padding: 0 0 2px; margin: 12px 0 6px; font-weight: 700;
  }
  .resume-preview p { margin: 0 0 6px; }
  .resume-preview .job { margin: 0 0 8px; }
  .resume-preview .job-header {
    display: flex; justify-content: space-between; gap: 12px;
    flex-wrap: wrap; font-weight: 700; margin: 0 0 2px;
  }
  .resume-preview .job-meta {
    color: #555; font-weight: 500; font-size: 11px; margin: 0 0 4px;
  }
  .resume-preview ul { padding-left: 18px; margin: 0 0 4px; }
  .resume-preview li { margin: 0 0 3px; }
  .resume-preview .skills-row { margin: 0 0 4px; }
  .resume-preview .project { margin: 0 0 8px; }
  .resume-preview .project-title { font-weight: 700; }
  .resume-preview .project-link {
    color: #1155cc; text-decoration: none; font-size: 11px;
  }
  .resume-preview .tech { color: #555; font-size: 11px; margin: 2px 0 4px; }
`;

export default function TailoredResumeTab() {
  const styles = extractStyles(defaultResumeHtml);
  const [jobDescription, setJobDescription] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [useMyResume, setUseMyResume] = useState(true);
  const [customResume, setCustomResume] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [resultHtml, setResultHtml] = useState("");
  const previewRef = useRef(null);

  useEffect(() => {
    if (!resultHtml || editing) return;
    const el = previewRef.current;
    if (!el) return;
    el.innerHTML = extractBodyInner(
      resultHtml.includes("<body")
        ? resultHtml
        : buildFullHtml(resultHtml, styles, "Abdullah Usman — Tailored Resume"),
    );
  }, [resultHtml, editing, styles]);

  const resolveResumeHtml = () => {
    if (useMyResume) {
      return getStoredResumeHtml(defaultResumeHtml);
    }
    return customResume.trim();
  };

  const persistEdits = () => {
    const el = previewRef.current;
    if (!el) return resultHtml;
    const next = buildFullHtml(el.innerHTML, styles, "Abdullah Usman — Tailored Resume");
    setResultHtml(next);
    return next;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setMessage({ type: "error", text: "Please paste a job description (JD)." });
      return;
    }

    const resumeHtml = resolveResumeHtml();
    if (!resumeHtml) {
      setMessage({
        type: "error",
        text: useMyResume
          ? "No saved resume found. Open My Resume tab first, or paste resume HTML below."
          : "Paste your resume content, or enable Use my resume.",
      });
      return;
    }

    setGenerating(true);
    setMessage(null);
    setEditing(false);

    try {
      const res = await tailorResume({
        jobDescription: jobDescription.trim(),
        guidelines: guidelines.trim(),
        resumeHtml,
      });

      const tailored = res.tailoredHtml || "";
      const full = tailored.includes("<body")
        ? tailored
        : buildFullHtml(tailored, styles, "Abdullah Usman — Tailored Resume");

      setResultHtml(full);
      setMessage({
        type: "success",
        text: res.message || "Tailored resume ready. You can edit and download this version.",
      });
    } catch (err) {
      const data = err.response?.data;
      const code = data?.code;
      const hint = data?.hint;
      let text = data?.message || err.message || "Failed to tailor resume";

      if (code === "QUOTA_EXCEEDED") {
        text = `⏳ Free API limit hit: ${text}`;
      } else if (code === "INVALID_API_KEY" || code === "MISSING_API_KEY") {
        text = `🔑 API key issue: ${text}`;
      } else if (code === "NETWORK_ERROR" || code === "PROVIDER_DOWN") {
        text = `🌐 Gemini connection issue: ${text}`;
      } else if (code === "CONTENT_BLOCKED") {
        text = `🚫 Blocked by Gemini: ${text}`;
      }

      setMessage({
        type: "error",
        text,
        code,
        hint,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleEdit = () => {
    if (!resultHtml) return;
    if (editing) {
      persistEdits();
      setMessage({ type: "success", text: "Tailored resume edits saved for this session." });
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resultHtml && !previewRef.current) {
      setMessage({ type: "error", text: "Generate a tailored resume first." });
      return;
    }

    setDownloading(true);
    setMessage(null);
    if (editing) persistEdits();

    const source = previewRef.current;
    const prevPadding = source.style.padding;
    source.style.padding = "12px 16px";

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [0.15, 0.2, 0.15, 0.2],
          filename: "Abdullah_Usman_Tailored_Resume.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(source)
        .save();

      setMessage({ type: "success", text: "Tailored resume PDF downloaded." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to download PDF." });
    } finally {
      source.style.padding = prevPadding;
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="border-b border-gray-100 pb-4 mb-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>🎯</span> Modified Resume wrt Job
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Paste a JD. Behind the scenes we send JD + your resume (+ optional guidelines) to the LLM
            and return a job-tailored version you can download.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Job Description (JD) *
            </label>
            <textarea
              rows={8}
              required
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Guidelines <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="e.g. Keep summary under 4 lines, emphasize React Native, keep 1 page..."
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-xs font-semibold text-gray-900">Use my resume</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                When enabled, we use the resume from the <b>My Resume</b> tab automatically.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useMyResume}
              onClick={() => setUseMyResume((v) => !v)}
              className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer shrink-0 ${
                useMyResume ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  useMyResume ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {!useMyResume && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Paste resume HTML / text *
              </label>
              <textarea
                rows={6}
                value={customResume}
                onChange={(e) => setCustomResume(e.target.value)}
                placeholder="Paste resume HTML or plain text if not using My Resume..."
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 font-mono text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="h-10 px-5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {generating ? "Tailoring with LLM…" : "Generate Tailored Resume"}
            </button>
          </div>
        </form>

        {message && (
          <div
            className={`mt-4 px-3.5 py-2.5 rounded-xl border text-xs space-y-1 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <p>{message.text}</p>
            {message.code && (
              <p className="font-mono text-[11px] opacity-80">Error code: {message.code}</p>
            )}
            {message.hint && <p className="opacity-90">{message.hint}</p>}
          </div>
        )}
      </div>

      {resultHtml && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Tailored Output</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Edit if needed, then download this job-specific PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleToggleEdit}
                className={`h-9 px-3.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  editing
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {editing ? "Save Edits" : "Edit"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
              >
                {downloading ? "Preparing…" : "Download This PDF"}
              </button>
            </div>
          </div>

          {editing && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Click any text to edit this tailored version, then press <b>Save Edits</b>.
            </div>
          )}

          <div className="border border-gray-200 overflow-auto max-h-[720px]">
            <style>{RESUME_PREVIEW_CSS}</style>
            <div
              ref={previewRef}
              contentEditable={editing}
              suppressContentEditableWarning
              className={`resume-preview outline-none ${
                editing ? "ring-2 ring-inset ring-indigo-300" : ""
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
