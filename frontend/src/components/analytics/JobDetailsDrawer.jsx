import { useEffect } from "react";
import CopyButton from "../shared/CopyButton.jsx";
import { ExternalLinkIcon } from "../../icons/index.jsx";
import { timeAgo, formatClicks } from "../../utils/analytics.js";

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function JobDetailsDrawer({ item, allLinks = [], onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/80 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200">
                  {item.sendSource === "automate"
                    ? "Automate"
                    : item.sendSource === "manual"
                      ? "Manual / Test"
                      : item.category || "Jobs"}{" "}
                  Tracker
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-1">{item.title}</h2>
                {item.companyOrPlatform && (
                  <p className="text-xs font-semibold text-gray-600">
                    @{item.companyOrPlatform}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <CloseIcon />
              </button>
            </div>

            {item.description && (
              <p className="text-xs text-gray-500 mt-2 bg-white p-3 rounded-lg border border-gray-200/80">
                {item.description}
              </p>
            )}

            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-mono truncate max-w-full"
              >
                <span>Job Posting Source Link</span>
                <ExternalLinkIcon />
              </a>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Attached Tracked Links & Real-time Analytics
            </h3>

            {(item.trackedLinks || []).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                No tracked links attached to this item.
              </p>
            ) : (
              (item.trackedLinks || []).map((link, idx) => {
                const targetSlug = link.shortUrl ? link.shortUrl.split("/").filter(Boolean).pop() : "";
                const fullShortUrl = link.shortUrl.startsWith("http")
                  ? link.shortUrl
                  : `${backendUrl}/${link.shortUrl}`;

                const matched = allLinks.find((l) => {
                  if (!l || !l.shortUrl) return false;
                  const lSlug = l.shortUrl.split("/").filter(Boolean).pop() || l.shortUrl;
                  return (
                    l.shortUrl === link.shortUrl ||
                    l.shortUrl === targetSlug ||
                    lSlug === targetSlug ||
                    link.shortUrl.endsWith(`/${l.shortUrl}`) ||
                    l.fullUrl === link.fullUrl
                  );
                });

                const clicks = matched ? matched.clicks : 0;
                const history = matched ? matched.viewsHistory || [] : [];

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-violet-600" />
                        {link.label}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                        {formatClicks(clicks)} views
                      </span>
                    </div>

                    {/* Short Link copy row */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 truncate select-all">
                        {fullShortUrl}
                      </div>
                      <CopyButton textToCopy={fullShortUrl} size="sm" />
                    </div>

                    <p className="text-[11px] font-mono text-gray-400 truncate" title={link.fullUrl}>
                      ↳ Target: {link.fullUrl}
                    </p>

                    {/* View History Timeline */}
                    <div className="pt-2 border-t border-gray-100">
                      <h4 className="text-[11px] font-semibold text-gray-700 mb-2">
                        View Activity Timeline ({history.length} events)
                      </h4>

                      {history.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">
                          No views recorded yet for this link.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {history.map((h, i) => (
                            <div
                              key={i}
                              className="text-[11px] bg-gray-50 p-2 rounded border border-gray-100 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-semibold text-gray-800">
                                  {new Date(h.timestamp).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="text-gray-400 ml-1">({timeAgo(h.timestamp)})</span>
                              </div>
                              <span className="font-mono text-[10px] text-gray-500">
                                {h.browser || "Chrome"} · {h.ip}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
