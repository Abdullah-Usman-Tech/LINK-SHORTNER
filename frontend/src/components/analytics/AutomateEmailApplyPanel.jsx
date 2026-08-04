import { useEffect, useRef, useState } from "react";
import defaultResumeHtml from "../../templates/defaultResume.html?raw";
import { automateEmailApply, createTrackedItem, sendTestEmail } from "../../api/shortUrl.api.js";
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

const STEPS = [
  "Parse post",
  "Tailor resume",
  "Write email",
  "Send (if on)",
];

export default function AutomateEmailApplyPanel({ onJobTracked, user }) {
  const styles = extractStyles(defaultResumeHtml);
  const [inputMode, setInputMode] = useState("paste"); // paste | url
  const [postText, setPostText] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [autoSendEmail, setAutoSendEmail] = useState(true);
  const [running, setRunning] = useState(false);
  const [sendingDraft, setSendingDraft] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
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

  const buildTrackedItemPayload = (extracted, recipientEmail, trackedLinks = []) => {
    const company = extracted?.company?.trim() || "";
    const jobTitle = extracted?.jobTitle?.trim() || "";
    const title = jobTitle || (company ? `Application at ${company}` : "Job Application");

    return {
      title,
      companyOrPlatform: company,
      category: "jobs",
      description: [
        "Auto-applied via Automate Email Apply.",
        recipientEmail ? `Sent to: ${recipientEmail}` : "",
        extracted?.hiringManager ? `Contact: ${extracted.hiringManager}` : "",
        inputMode === "url" && postUrl.trim() ? `Source: url` : "Source: paste",
        extracted?.notes?.trim() || "",
      ]
        .filter(Boolean)
        .join("\n"),
      sourceUrl: inputMode === "url" ? postUrl.trim() : "",
      status: "Email Sent",
      sendSource: "automate",
      trackingEnabled: Array.isArray(trackedLinks) && trackedLinks.length > 0,
      recipientEmail: recipientEmail || "",
      emailSubject: "",
      sentAt: new Date().toISOString(),
      trackedLinks: trackedLinks || [],
    };
  };

  const notifyJobTracked = () => {
    if (typeof onJobTracked === "function") onJobTracked();
  };

  const persistEdits = () => {
    const el = previewRef.current;
    if (!el) return resultHtml;
    const next = buildFullHtml(el.innerHTML, styles, "Abdullah Usman — Tailored Resume");
    setResultHtml(next);
    return next;
  };

  const formatError = (err) => {
    const data = err.response?.data;
    const code = data?.code;
    let text = data?.message || err.message || "Automate email apply failed";

    if (code === "QUOTA_EXCEEDED") text = `Free API limit hit: ${text}`;
    else if (code === "INVALID_API_KEY" || code === "MISSING_API_KEY")
      text = `API key issue: ${text}`;
    else if (code === "NETWORK_ERROR" || code === "PROVIDER_DOWN")
      text = `Gemini connection issue: ${text}`;
    else if (code === "FETCH_FAILED" || code === "FETCH_EMPTY")
      text = `URL fetch failed: ${text}`;

    return { text, code, hint: data?.hint };
  };

  const handleRun = async (e) => {
    e.preventDefault();

    if (inputMode === "paste" && !postText.trim()) {
      setMessage({ type: "error", text: "Paste the full LinkedIn / job post text." });
      return;
    }
    if (inputMode === "url" && !postUrl.trim()) {
      setMessage({ type: "error", text: "Provide a LinkedIn post / job URL." });
      return;
    }

    const resumeHtml = getStoredResumeHtml(defaultResumeHtml);
    if (!resumeHtml?.trim()) {
      setMessage({
        type: "error",
        text: "No resume found. Open Test Lab → My Resume and save your resume first.",
      });
      return;
    }

    const hasProfileLinks = Boolean(
      user?.portfolio ||
        user?.website ||
        user?.github ||
        user?.linkedin ||
        user?.twitter ||
        user?.youtube ||
        (Array.isArray(user?.customLinks) && user.customLinks.some((l) => l?.url)),
    );
    if (!hasProfileLinks) {
      setMessage({
        type: "error",
        text: "Add at least one link in Account (Portfolio / GitHub / LinkedIn), click Save changes, then run auto-apply again. Short tracking URLs are created from those links.",
      });
      return;
    }

    setRunning(true);
    setMessage(null);
    setResult(null);
    setEditing(false);
    setActiveStep(0);

    const stepTimers = [
      setTimeout(() => setActiveStep(1), 900),
      setTimeout(() => setActiveStep(2), 2800),
      setTimeout(() => setActiveStep(3), 5200),
    ];

    try {
      const res = await automateEmailApply({
        postText: inputMode === "paste" ? postText.trim() : "",
        postUrl: inputMode === "url" ? postUrl.trim() : "",
        resumeHtml,
        guidelines: guidelines.trim(),
        autoSendEmail,
        applicantName: user?.name || "Abdullah Usman",
        profileLinks: {
          name: user?.name || "",
          website: user?.website || "",
          portfolio: user?.portfolio || "",
          github: user?.github || "",
          linkedin: user?.linkedin || "",
          twitter: user?.twitter || "",
          youtube: user?.youtube || "",
          customLinks: Array.isArray(user?.customLinks) ? user.customLinks : [],
        },
      });

      const tailored = res.tailoredHtml || "";
      const full = tailored.includes("<body")
        ? tailored
        : buildFullHtml(tailored, styles, "Abdullah Usman — Tailored Resume");

      setResultHtml(full);
      setEmailTo(res.emailDraft?.to || res.extracted?.email || "");
      setEmailSubject(res.emailDraft?.subject || "");
      setEmailBody(res.emailDraft?.bodyHtml || "");
      setResult(res);
      setActiveStep(3);

      if (res.trackingCreated || (res.trackedLinks && res.trackedLinks.length > 0)) {
        notifyJobTracked();
      }

      setMessage({
        type: res.profileHint || res.openTrackingWarning ? "error" : "success",
        text: [
          res.message || "Automate email apply finished.",
          res.profileHint,
          res.openTrackingWarning,
        ]
          .filter(Boolean)
          .join(" "),
      });
    } catch (err) {
      const formatted = formatError(err);
      setMessage({ type: "error", ...formatted });
      setActiveStep(-1);
    } finally {
      stepTimers.forEach(clearTimeout);
      setRunning(false);
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
      setMessage({ type: "error", text: "Run automate apply first." });
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

  const handleSendDraft = async () => {
    if (!emailTo.trim()) {
      setMessage({ type: "error", text: "Recipient email is missing — add it before sending." });
      return;
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      setMessage({ type: "error", text: "Subject and email body are required." });
      return;
    }
    if (!resultHtml && !previewRef.current) {
      setMessage({ type: "error", text: "Tailored resume is missing — run automate apply first." });
      return;
    }

    setSendingDraft(true);
    setMessage(null);
    if (editing) persistEdits();

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const source =
        previewRef.current ||
        (() => {
          const el = document.createElement("div");
          el.innerHTML = extractBodyInner(
            resultHtml.includes("<body")
              ? resultHtml
              : buildFullHtml(resultHtml, styles, "Abdullah Usman — Tailored Resume"),
          );
          return el;
        })();

      const pdfDataUri = await html2pdf()
        .set({
          margin: [0.15, 0.2, 0.15, 0.2],
          filename: "Abdullah_Usman_Tailored_Resume.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(source)
        .outputPdf("datauristring");

      const base64 = String(pdfDataUri).includes(",")
        ? String(pdfDataUri).split(",")[1]
        : String(pdfDataUri);

      const res = await sendTestEmail({
        to: emailTo.trim(),
        subject: emailSubject.trim(),
        body: emailBody,
        isHtml: true,
        includeTracking: false,
        persistRecord: false,
        sendSource: "automate",
        attachments: [
          {
            filename: "Abdullah_Usman_Resume.pdf",
            content: base64,
            encoding: "base64",
            contentType: "application/pdf",
          },
        ],
      });
      setMessage({
        type: "success",
        text: res.message || `Email sent to ${emailTo.trim()} with resume PDF attached`,
      });
      if (result?.extracted) {
        await createTrackedItem(
          buildTrackedItemPayload(
            result.extracted,
            emailTo.trim(),
            result.trackedLinks || [],
          ),
        );
        notifyJobTracked();
      }
      setResult((prev) =>
        prev
          ? {
              ...prev,
              emailSent: true,
              resumeAttached: true,
              trackingCreated: true,
              emailSkippedReason: null,
              emailResult: res.details || null,
            }
          : prev,
      );
    } catch (err) {
      const formatted = formatError(err);
      setMessage({ type: "error", ...formatted });
    } finally {
      setSendingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="border-b border-gray-100 pb-4 mb-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📧</span> Automate Email Apply
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Paste a hiring post (or try a URL). We extract JD + apply email, tailor your resume,
            create tracking short links from your Account profile, draft the mail with those links,
            attach the resume PDF — and send only when auto-send is on.
          </p>
        </div>

        <form onSubmit={handleRun} className="space-y-4">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 w-fit">
            {[
              { id: "paste", label: "Paste post" },
              { id: "url", label: "Post URL" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setInputMode(mode.id)}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  inputMode === mode.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {inputMode === "paste" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full post copy *
              </label>
              <textarea
                rows={9}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Paste the whole LinkedIn / job post here (JD + apply email)…"
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                LinkedIn / job post URL *
              </label>
              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/..."
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all"
              />
              <p className="text-[11px] text-amber-700 mt-1.5">
                LinkedIn often blocks automated fetches. If this fails, switch to Paste post.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Guidelines <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="e.g. Emphasize React Native, keep email under 180 words…"
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-xs font-semibold text-gray-900">Auto-send email</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {autoSendEmail
                  ? "On — email is sent with resume PDF + Account tracking links, and a job entry is created."
                  : "Off — still parse + tailor + draft with tracking links, but do not send."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoSendEmail}
              onClick={() => setAutoSendEmail((v) => !v)}
              className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer shrink-0 ${
                autoSendEmail ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  autoSendEmail ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {(running || activeStep >= 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STEPS.map((label, idx) => {
                const done = activeStep > idx || (!running && result && activeStep >= idx);
                const current = running && activeStep === idx;
                return (
                  <div
                    key={label}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-semibold ${
                      done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : current
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {idx + 1}. {label}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={running}
              className="h-10 px-5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
            >
              {running
                ? "Running automate apply…"
                : autoSendEmail
                  ? "Parse → Tailor → Send email"
                  : "Parse → Tailor → Draft only"}
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

      {result && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4">Extracted from post</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                ["Job title", result.extracted?.jobTitle || "—"],
                ["Company", result.extracted?.company || "—"],
                ["Hiring contact", result.extracted?.hiringManager || "—"],
                ["Apply email", result.extracted?.email || "Not found"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    {label}
                  </p>
                  <p className="text-gray-900 font-medium mt-0.5 break-all">{value}</p>
                </div>
              ))}
            </div>
            {result.extracted?.jobDescription && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                  Job description
                </p>
                <div className="max-h-40 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
                  {result.extracted.jobDescription}
                </div>
              </div>
            )}
            {result.extracted?.notes && (
              <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {result.extracted.notes}
              </p>
            )}
            {Array.isArray(result.trackedLinks) && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
                  Tracking links created
                </p>
                {result.trackedLinks.length === 0 ? (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    No profile links found. Add Portfolio / GitHub / LinkedIn in Account, then run again.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {result.trackedLinks.map((link) => (
                      <div
                        key={`${link.type}-${link.shortUrl}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-gray-800">
                          {link.label}{" "}
                          <span className="font-normal text-gray-400">({link.type})</span>
                        </span>
                        <a
                          href={link.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-gray-600 hover:text-gray-900 break-all"
                        >
                          {link.shortUrl}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">Application email</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {result.emailSent
                    ? result.resumeAttached
                      ? result.trackingCreated
                        ? "Sent with resume PDF attached and saved in your job tracker."
                        : "Sent automatically with resume PDF attached."
                      : "Sent automatically."
                    : result.emailSkippedReason || "Draft ready — review and send if you want."}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  result.emailSent
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {result.emailSent ? "Sent" : "Not sent"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Body (HTML)</label>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 font-mono text-xs text-gray-800 outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
              {!result.emailSent && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSendDraft}
                    disabled={sendingDraft}
                    className="h-9 px-4 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                  >
                    {sendingDraft ? "Sending with resume…" : "Send this email now"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {resultHtml && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">JD-tailored resume</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Same pipeline as Test Lab — edit and download if needed.
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
                    {downloading ? "Preparing…" : "Download PDF"}
                  </button>
                </div>
              </div>

              {editing && (
                <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Click any text to edit, then press <b>Save Edits</b>.
                </div>
              )}

              <div className="border border-gray-200 overflow-auto max-h-[720px]">
                <style>{RESUME_PREVIEW_CSS}</style>
                <div
                  ref={previewRef}
                  contentEditable={editing}
                  suppressContentEditableWarning
                  className={`resume-preview outline-none ${
                    editing ? "ring-2 ring-inset ring-gray-400" : ""
                  }`}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
