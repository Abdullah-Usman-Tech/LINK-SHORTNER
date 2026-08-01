import { useState, useEffect } from "react";
import LinkRow from "../components/analytics/LinkRow.jsx";
import StatCard from "../components/analytics/StatCard.jsx";
import ViewTimelineDrawer from "../components/analytics/ViewTimelineDrawer.jsx";
import {
  SearchIcon,
  PlusIcon,
  LinkIcon,
  BarChartIcon,
} from "../icons/index.jsx";
import { formatClicks } from "../utils/analytics.js";

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * Props:
 *   links        — array from your API: [{ id, short, orig, clicks, custom, active, createdAt }]
 *   isLoading    — boolean
 *   onCreateNew  — callback to navigate to / open ShortUrl page
 *   onLogout     — callback
 *   user         — { name, email }
 */
export default function Analytics({
  links: initialLinks = [],
  isLoading = false,
  onCreateNew,
  onLogout,
  user = { name: "User", email: "" },
}) {
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | custom | active
  const [selectedLinkForTimeline, setSelectedLinkForTimeline] = useState(null);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const handleDelete = (id) => {
    setLinks((prev) => prev.filter((l) => l._id !== id));
  };


  const filtered = links.filter((l) => {
    const matchesSearch =
      l.shortUrl.toLowerCase().includes(search.toLowerCase()) ||
      l.fullUrl.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "custom" && l.custom) ||
      (filter === "active" && l.active);
    return matchesSearch && matchesFilter;
  });

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const activeCount = links.filter((l) => l.active).length;
  const customCount = links.filter((l) => l.custom).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <p className="text-sm font-medium tracking-widest uppercase text-gray-700">
            ✦ Snip
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your links</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Hey {user.name.split(" ")[0]}, here's everything you've shortened.
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
          >
            <PlusIcon />
            Create new
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            label="Total links"
            value={links.length}
            icon={<LinkIcon />}
          />
          <StatCard
            label="Total clicks"
            value={formatClicks(totalClicks)}
            icon={<BarChartIcon />}
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon={
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search links…"
              className="w-full h-10 pl-9 pr-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {["all", "custom", "active"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium capitalize transition-all cursor-pointer ${
                  filter === f
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Links list */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-white border border-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
            <p className="text-3xl mb-3">🔗</p>
            <p className="text-sm font-medium text-gray-700">
              {search || filter !== "all"
                ? "No links match your search"
                : "No links yet"}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-5">
              {search || filter !== "all"
                ? "Try a different search or filter"
                : "Create your first short link to get started"}
            </p>
            {!search && filter === "all" && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 active:scale-95 transition-all cursor-pointer"
              >
                <PlusIcon />
                Create a link
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((link) => (
              <LinkRow
                key={link._id}
                link={link}
                onDelete={handleDelete}
                onViewTimeline={(l) => setSelectedLinkForTimeline(l)}
              />
            ))}
          </div>
        )}

        {/* Bottom summary */}
        {filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Showing {filtered.length} of {links.length} link
            {links.length !== 1 ? "s" : ""}
            {customCount > 0 && ` · ${customCount} custom`}
          </p>
        )}
      </div>

      {/* Right Slide-over View Timeline Drawer */}
      <ViewTimelineDrawer
        link={selectedLinkForTimeline}
        onClose={() => setSelectedLinkForTimeline(null)}
      />
    </div>
  );
}
