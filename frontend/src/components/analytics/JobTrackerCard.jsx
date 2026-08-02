import { useState } from "react";
import { ExternalLinkIcon, TrashIcon } from "../../icons/index.jsx";
import { timeAgo } from "../../utils/analytics.js";

const MailIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const FileTextIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const GlobeIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export default function JobTrackerCard({
  item,
  allLinks = [],
  onOpenDetails,
  onDelete,
  onStatusChange,
}) {
  const [updating, setUpdating] = useState(false);

  // Status badges map
  const statusColors = {
    Applied: "bg-blue-50 text-blue-700 border-blue-200",
    "Email Sent": "bg-violet-50 text-violet-700 border-violet-200",
    Interviewing: "bg-amber-50 text-amber-700 border-amber-200",
    Offered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  // Helper to find actual click count / views history for a tracked link
  const getLinkMetrics = (shortUrlVal) => {
    if (!shortUrlVal) return { clicks: 0, viewsHistory: [] };

    // Extract slug (e.g., "http://localhost:3000/abc123" -> "abc123")
    const targetSlug = shortUrlVal.split("/").filter(Boolean).pop() || shortUrlVal;

    const matched = allLinks.find((l) => {
      if (!l || !l.shortUrl) return false;
      const lSlug = l.shortUrl.split("/").filter(Boolean).pop() || l.shortUrl;
      return (
        l.shortUrl === shortUrlVal ||
        l.shortUrl === targetSlug ||
        lSlug === targetSlug ||
        shortUrlVal.endsWith(`/${l.shortUrl}`) ||
        l.fullUrl === shortUrlVal
      );
    });

    return {
      clicks: matched ? matched.clicks : 0,
      viewsHistory: matched ? matched.viewsHistory || [] : [],
    };
  };

  // Calculate total metrics across all tracked links
  let totalViews = 0;
  let emailViews = 0;
  let resumeViews = 0;
  let portfolioViews = 0;

  (item.trackedLinks || []).forEach((link) => {
    const m = getLinkMetrics(link.shortUrl);
    totalViews += m.clicks;
    if (link.type === "email") emailViews += m.clicks;
    else if (link.type === "resume") resumeViews += m.clicks;
    else if (link.type === "portfolio") portfolioViews += m.clicks;
  });

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${item.title}"? It will only be removed when you confirm deletion.`,
      )
    ) {
      onDelete(item._id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all shadow-xs hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
            {item.companyOrPlatform && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700">
                @{item.companyOrPlatform}
              </span>
            )}
            <select
              value={item.status}
              onChange={(e) => onStatusChange(item._id, e.target.value)}
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${
                statusColors[item.status] || "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              <option value="Applied">Applied</option>
              <option value="Email Sent">Email Sent</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offered">Offered</option>
              <option value="Rejected">Rejected</option>
              <option value="Active">Active</option>
            </select>
          </div>

          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="text-gray-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
          title="Delete job application entry"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Source URL if available */}
      {item.sourceUrl && (
        <div className="mb-4">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-mono truncate max-w-full"
          >
            <span>Source: {item.sourceUrl}</span>
            <ExternalLinkIcon />
          </a>
        </div>
      )}

      {/* Tracked Links Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-4 p-3 bg-gray-50/80 rounded-lg border border-gray-100">
        {/* Email Tracker Status */}
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-md ${
              emailViews > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-400"
            }`}
          >
            <MailIcon />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-gray-700 block">Email Opened</span>
            <span
              className={`text-xs font-bold ${
                emailViews > 0 ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              {emailViews > 0 ? `Yes (${emailViews} opens)` : "Not opened yet"}
            </span>
          </div>
        </div>

        {/* Resume Tracker Status */}
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-md ${
              resumeViews > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-400"
            }`}
          >
            <FileTextIcon />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-gray-700 block">Resume Viewed</span>
            <span
              className={`text-xs font-bold ${
                resumeViews > 0 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {resumeViews > 0 ? `Yes (${resumeViews} views)` : "Not viewed yet"}
            </span>
          </div>
        </div>

        {/* Portfolio Tracker Status */}
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-md ${
              portfolioViews > 0 ? "bg-violet-100 text-violet-700" : "bg-gray-200 text-gray-400"
            }`}
          >
            <GlobeIcon />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-gray-700 block">Portfolio Visited</span>
            <span
              className={`text-xs font-bold ${
                portfolioViews > 0 ? "text-violet-600" : "text-gray-400"
              }`}
            >
              {portfolioViews > 0 ? `Yes (${portfolioViews} visits)` : "Not visited yet"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
        <span className="text-gray-400">Created {timeAgo(item.createdAt)}</span>
        <button
          onClick={() => onOpenDetails(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
        >
          View Timelines & Details ({totalViews} total views)
        </button>
      </div>
    </div>
  );
}
