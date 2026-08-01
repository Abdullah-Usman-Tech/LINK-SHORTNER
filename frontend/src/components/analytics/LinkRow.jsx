import { useState } from "react";
import { deleteLink } from "../../api/shortUrl.api.js";
import CopyButton from "../shared/CopyButton.jsx";
import { ExternalLinkIcon, TrashIcon } from "../../icons/index.jsx";
import { formatClicks, timeAgo } from "../../utils/analytics.js";

export default function LinkRow({ link, onDelete, onViewTimeline }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    deleteLink(link.shortUrl)
      .then(() => onDelete(link._id))
      .catch((err) => {
        console.error("Failed to delete link:", err);
        alert(err.response?.data?.message || "Failed to delete link.");
      })
      .finally(() => setDeleting(false));
  };

  const barWidth = Math.min(100, (link.clicks / (link.maxClicks || 500)) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-sm text-gray-900">
              {`${import.meta.env.VITE_BACKEND_URL}/${link.shortUrl}`}
            </span>
            {link.custom && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-200 shrink-0">
                custom
              </span>
            )}
            <a
              href={`${import.meta.env.VITE_BACKEND_URL}/${link.shortUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-gray-500 transition-colors"
              aria-label="Open link"
            >
              <ExternalLinkIcon />
            </a>
          </div>

          <p
            className="text-xs font-mono text-gray-400 truncate mb-3"
            title={link.fullUrl}
          >
            {link.fullUrl}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-800 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <button
              onClick={() => onViewTimeline && onViewTimeline(link)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-900 text-gray-700 hover:text-white transition-all text-xs font-semibold shrink-0 cursor-pointer group shadow-xs hover:shadow-sm"
              title="Click to view view timeline"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{formatClicks(link.clicks)} views</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <CopyButton
            textToCopy={`${import.meta.env.VITE_BACKEND_URL}/${link.shortUrl}`}
          />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Delete link"
          >
            {deleting ? (
              <span className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <TrashIcon />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Created {timeAgo(link.createdAt)}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            link.active
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-gray-100 text-gray-400 border-gray-200"
          }`}
        >
          {link.active ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}
