import { useState, useEffect, useCallback } from "react";
import LinkRow from "../components/analytics/LinkRow.jsx";
import StatCard from "../components/analytics/StatCard.jsx";
import ViewTimelineDrawer from "../components/analytics/ViewTimelineDrawer.jsx";
import CategoryTabs from "../components/analytics/CategoryTabs.jsx";
import JobTrackerCard from "../components/analytics/JobTrackerCard.jsx";
import JobDetailsDrawer from "../components/analytics/JobDetailsDrawer.jsx";
import CreateTrackedItemModal from "../components/analytics/CreateTrackedItemModal.jsx";
import TestTab from "../components/analytics/TestTab.jsx";
import AutomateApplyTab from "../components/analytics/AutomateApplyTab.jsx";
import {
  SearchIcon,
  PlusIcon,
  LinkIcon,
  BarChartIcon,
} from "../icons/index.jsx";
import { formatClicks } from "../utils/analytics.js";
import {
  getCategories,
  createCategory,
  getTrackedItems,
  updateTrackedItemStatus,
  deleteTrackedItem,
} from "../api/shortUrl.api.js";

// ── Main Component ────────────────────────────────────────────────────────────

export default function Analytics({
  links: initialLinks = [],
  isLoading = false,
  onCreateNew,
  onCreateLongLink,
  onLogout,
  user = { name: "User", email: "" },
}) {
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | custom | active
  const [selectedLinkForTimeline, setSelectedLinkForTimeline] = useState(null);

  // Categories & Tracked Items State
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [trackedItems, setTrackedItems] = useState([]);
  const [selectedTrackedItemDetails, setSelectedTrackedItemDetails] = useState(null);
  const [isCreateTrackedModalOpen, setIsCreateTrackedModalOpen] = useState(false);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  // Load categories and tracked items
  const fetchCategoryData = useCallback(() => {
    getCategories()
      .then((cats) => setCategories(cats || []))
      .catch((err) => console.error("Failed to fetch categories:", err));

    getTrackedItems()
      .then((items) => setTrackedItems(items || []))
      .catch((err) => console.error("Failed to fetch tracked items:", err));
  }, []);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  const handleDeleteLink = (id) => {
    setLinks((prev) => prev.filter((l) => l._id !== id));
  };

  const handleDeleteTrackedItem = (id) => {
    deleteTrackedItem(id)
      .then(() => {
        setTrackedItems((prev) => prev.filter((item) => item._id !== id));
      })
      .catch((err) => console.error("Failed to delete tracked item:", err));
  };

  const handleStatusChange = (id, newStatus) => {
    updateTrackedItemStatus(id, newStatus)
      .then((updated) => {
        setTrackedItems((prev) =>
          prev.map((item) => (item._id === id ? updated : item)),
        );
      })
      .catch((err) => console.error("Failed to update status:", err));
  };

  const handleAddCategoryPrompt = () => {
    const name = prompt("Enter new category name (e.g. Social Media, Marketing):");
    if (name && name.trim()) {
      createCategory(name.trim())
        .then((newCat) => {
          setCategories((prev) => [...prev, newCat]);
          setActiveCategory(newCat.slug);
        })
        .catch((err) => console.error("Failed to create category:", err));
    }
  };

  // Filter links for All Links tab
  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      l.shortUrl.toLowerCase().includes(search.toLowerCase()) ||
      l.fullUrl.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "custom" && l.custom) ||
      (filter === "active" && l.active);
    return matchesSearch && matchesFilter;
  });

  // Filter tracked items for active category tab
  const filteredTrackedItems = trackedItems.filter((item) => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      item.title.toLowerCase().includes(searchLower) ||
      (item.companyOrPlatform && item.companyOrPlatform.toLowerCase().includes(searchLower)) ||
      (item.description && item.description.toLowerCase().includes(searchLower));

    const itemCat = (item.category || "").toLowerCase();

    if (activeCategory === "jobs") {
      // Include all job applications (matches any category with 'job' or default entries)
      return (
        matchesSearch &&
        (itemCat.includes("job") ||
          itemCat === "jobs" ||
          itemCat === "jobs application" ||
          !itemCat.includes("project"))
      );
    }
    if (activeCategory === "projects") {
      return matchesSearch && itemCat.includes("project");
    }
    if (activeCategory !== "all") {
      return (
        matchesSearch &&
        (itemCat === activeCategory.toLowerCase() ||
          itemCat.includes(activeCategory.toLowerCase()))
      );
    }
    return matchesSearch;
  });

  // Calculate tab item counts for badges
  const categoryCounts = {
    all: links.length,
    jobs: trackedItems.filter((i) => {
      const cat = (i.category || "").toLowerCase();
      return cat.includes("job") || !cat.includes("project");
    }).length,
    projects: trackedItems.filter((i) => (i.category || "").toLowerCase().includes("project")).length,
  };

  categories.forEach((cat) => {
    if (cat.slug && !categoryCounts[cat.slug]) {
      categoryCounts[cat.slug] = trackedItems.filter(
        (i) => (i.category || "").toLowerCase() === cat.slug.toLowerCase(),
      ).length;
    }
  });

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const activeCount = links.filter((l) => l.active).length;

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
            <h1 className="text-2xl font-bold text-gray-900">Your dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Hey {user.name.split(" ")[0]}, track your links, job applications, and projects in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              onClick={onCreateLongLink}
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-all duration-150 cursor-pointer shadow-xs"
            >
              <PlusIcon />
              Create long link
            </button>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <PlusIcon />
              Create short link
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            label="Total short links"
            value={links.length}
            icon={<LinkIcon />}
          />
          <StatCard
            label="Total clicks"
            value={formatClicks(totalClicks)}
            icon={<BarChartIcon />}
          />
          <StatCard
            label="Active links"
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

        {/* Category Tabs */}
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={(slug) => setActiveCategory(slug)}
          onAddCategory={handleAddCategoryPrompt}
          counts={categoryCounts}
        />

        {/* TAB CONTENT: AUTOMATE APPLY */}
        {activeCategory === "automate-apply" ? (
          <AutomateApplyTab onJobTracked={fetchCategoryData} />
        ) : activeCategory === "test-lab" ? (
          <TestTab />
        ) : (
          <>
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
                  placeholder={
                    activeCategory === "all"
                      ? "Search short links…"
                      : `Search ${activeCategory} entries…`
                  }
                  className="w-full h-10 pl-9 pr-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>

              {activeCategory === "all" ? (
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
              ) : (
                <button
                  onClick={() => setIsCreateTrackedModalOpen(true)}
                  className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-all cursor-pointer shrink-0"
                >
                  <PlusIcon />
                  Add Tracked {activeCategory === "jobs" ? "Job" : "Entry"}
                </button>
              )}
            </div>

            {/* TAB CONTENT: ALL LINKS TAB */}
            {activeCategory === "all" && (
              <>
                {isLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-28 bg-white border border-gray-200 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredLinks.length === 0 ? (
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
                    {filteredLinks.map((link) => (
                      <LinkRow
                        key={link._id}
                        link={link}
                        onDelete={handleDeleteLink}
                        onViewTimeline={(l) => setSelectedLinkForTimeline(l)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB CONTENT: CATEGORY TRACKED ITEMS TAB (Jobs / Projects / Custom) */}
            {activeCategory !== "all" && (
              <>
                {filteredTrackedItems.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                    <p className="text-3xl mb-3">
                      {activeCategory === "jobs" ? "💼" : activeCategory === "projects" ? "🚀" : "📁"}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      No {activeCategory} entries tracked yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1 mb-5 max-w-sm mx-auto">
                      {activeCategory === "jobs"
                        ? "Track job applications, email open status, resume views, and portfolio visits."
                        : "Track project engagement across demo links, documentation, and repos."}
                    </p>
                    <button
                      onClick={() => setIsCreateTrackedModalOpen(true)}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 cursor-pointer"
                    >
                      <PlusIcon />
                      Create {activeCategory === "jobs" ? "Job Application" : "Project"} Entry
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredTrackedItems.map((item) => (
                      <JobTrackerCard
                        key={item._id}
                        item={item}
                        allLinks={links}
                        onOpenDetails={(i) => setSelectedTrackedItemDetails(i)}
                        onDelete={handleDeleteTrackedItem}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Bottom summary */}
        {filteredLinks.length > 0 && activeCategory === "all" && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Showing {filteredLinks.length} of {links.length} link
            {links.length !== 1 ? "s" : ""}
          </p>
        )}
        {filteredTrackedItems.length > 0 && activeCategory !== "all" && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Showing all {filteredTrackedItems.length}{" "}
            {activeCategory === "jobs" ? "job application" : activeCategory} entry
            {filteredTrackedItems.length !== 1 ? "ies" : "y"} · Permanently saved in database until deleted
          </p>
        )}
      </div>

      {/* Right Slide-over View Timeline Drawer for Short Links */}
      <ViewTimelineDrawer
        link={selectedLinkForTimeline}
        onClose={() => setSelectedLinkForTimeline(null)}
      />

      {/* Right Slide-over Details Drawer for Job Applications & Tracked Items */}
      <JobDetailsDrawer
        item={selectedTrackedItemDetails}
        allLinks={links}
        onClose={() => setSelectedTrackedItemDetails(null)}
      />

      {/* Create Tracked Item Modal */}
      <CreateTrackedItemModal
        open={isCreateTrackedModalOpen}
        onClose={() => setIsCreateTrackedModalOpen(false)}
        onSuccess={fetchCategoryData}
        defaultCategory={activeCategory}
      />
    </div>
  );
}
