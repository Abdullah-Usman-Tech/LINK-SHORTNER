import { useEffect, useRef, useState } from "react";
import defaultResumeHtml from "../../templates/defaultResume.html?raw";
import {
  buildFullHtml,
  clearStoredResumeHtml,
  extractBodyInner,
  extractStyles,
  getStoredResumeHtml,
  saveResumeHtml,
} from "../../utils/resumeStorage.js";

export default function ResumeHandler() {
  const [html, setHtml] = useState(() => getStoredResumeHtml(defaultResumeHtml));
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState(null);
  const previewRef = useRef(null);
  const styles = extractStyles(defaultResumeHtml);

  useEffect(() => {
    if (editing) return;
    const el = previewRef.current;
    if (!el) return;
    el.innerHTML = extractBodyInner(html);
  }, [html, editing]);

  const persistFromDom = () => {
    const el = previewRef.current;
    if (!el) return html;
    const next = buildFullHtml(el.innerHTML, styles);
    setHtml(next);
    saveResumeHtml(next);
    return next;
  };

  const handleToggleEdit = () => {
    if (editing) {
      persistFromDom();
      setMessage({ type: "success", text: "Resume changes saved locally." });
      setEditing(false);
    } else {
      setMessage(null);
      setEditing(true);
    }
  };

  const handleReset = () => {
    if (!confirm("Reset resume to the original template? Your edits will be lost.")) return;
    setEditing(false);
    setHtml(defaultResumeHtml);
    clearStoredResumeHtml();
    setMessage({ type: "success", text: "Resume reset to default template." });
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setMessage(null);

    if (editing) persistFromDom();

    const source = previewRef.current;
    if (!source) {
      setDownloading(false);
      setMessage({ type: "error", text: "Resume preview is not ready." });
      return;
    }

    const prevPadding = source.style.padding;
    const prevMaxWidth = source.style.maxWidth;
    source.style.padding = "12px 16px";
    source.style.maxWidth = "100%";

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      await html2pdf()
        .set({
          margin: [0.15, 0.2, 0.15, 0.2],
          filename: "Abdullah_Usman_Resume.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(source)
        .save();

      setMessage({
        type: "success",
        text: "Resume PDF downloaded successfully.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to download PDF.",
      });
    } finally {
      source.style.padding = prevPadding;
      source.style.maxWidth = prevMaxWidth;
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📄</span> My Resume
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Preview, edit content inline, then download as PDF. Used by Modified Resume wrt Job when
            enabled.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggleEdit}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              editing
                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {editing ? "Save Edits" : "Edit Resume"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-all cursor-pointer"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-all cursor-pointer"
          >
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Editing mode is on — click any text below to change it, then press <b>Save Edits</b>.
        </div>
      )}

      {message && (
        <div
          className={`mb-4 px-3.5 py-2.5 rounded-xl border text-xs ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="border border-gray-200 overflow-auto max-h-[720px]">
        <style>{`
          .resume-preview {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            color: #222;
            font-size: 11.5px;
            line-height: 1.45;
            background: #fff;
            padding: 16px 18px;
            max-width: 100%;
            margin: 0;
            box-shadow: none;
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
        `}</style>

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
  );
}
