import { useState, useEffect, useCallback } from "react";
import LinkRow from "../components/analytics/LinkRow.jsx";
import StatCard from "../components/analytics/StatCard.jsx";
import ViewTimelineDrawer from "../components/analytics/ViewTimelineDrawer.jsx";
import JobTrackerCard from "../components/analytics/JobTrackerCard.jsx";
import JobDetailsDrawer from "../components/analytics/JobDetailsDrawer.jsx";
import CreateTrackedItemModal from "../components/analytics/CreateTrackedItemModal.jsx";
import TestTab from "../components/analytics/TestTab.jsx";
import AutomateApplyTab from "../components/analytics/AutomateApplyTab.jsx";
import AccountPanel from "../components/analytics/AccountPanel.jsx";
import AppSidebar, {
  loadSidebarOpen,
  saveSidebarOpen,
} from "../components/layout/AppSidebar.jsx";
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

const SECTION_META = {
  account: {
    title: "Account",
    subtitle: "Your profile and session details.",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of links, clicks, and job activity.",
  },
  "all-links": {
    title: "All links",
    subtitle: "Manage and search every short link you own.",
  },
  "test-lab": {
    title: "Testing Lab",
    subtitle: "Email SMTP tests, resume editing, and JD tailoring.",
  },
  "jobs-applications": {
    title: "Job applications",
    subtitle: "Track applications, status, and engagement.",
  },
  "jobs-automations": {
    title: "Job automations",
    subtitle: "Parse posts, tailor resumes, and auto-send applications.",
  },
  general: {
    title: "General",
    subtitle: "Projects, custom trackers, and workspace extras.",
  },
};

export default function Analytics({
  links: initialLinks = [],
  isLoading = false,
  onCreateNew,
  onCreateLongLink,
  onLogout,
  onUserUpdate,
  onLinksRefresh,
  user = { name: "User", email: "" },
}) {
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedLinkForTimeline, setSelectedLinkForTimeline] = useState(null);

  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(() => loadSidebarOpen());
  const [categories, setCategories] = useState([]);
  const [trackedItems, setTrackedItems] = useState([]);
  const [selectedTrackedItemDetails, setSelectedTrackedItemDetails] = useState(null);
  const [isCreateTrackedModalOpen, setIsCreateTrackedModalOpen] = useState(false);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

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

  // Keep click/open stats fresh while viewing applications
  useEffect(() => {
    if (activeSection !== "jobs-applications") return undefined;
    if (typeof onLinksRefresh === "function") onLinksRefresh();
    const timer = setInterval(() => {
      if (typeof onLinksRefresh === "function") onLinksRefresh();
      fetchCategoryData();
    }, 12000);
    const onFocus = () => {
      if (typeof onLinksRefresh === "function") onLinksRefresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [activeSection, onLinksRefresh, fetchCategoryData]);

  const handleAutomateRefresh = useCallback(() => {
    fetchCategoryData();
    if (typeof onLinksRefresh === "function") onLinksRefresh();
  }, [fetchCategoryData, onLinksRefresh]);

  const handleSidebarOpenChange = (next) => {
    setSidebarOpen(next);
    saveSidebarOpen(next);
  };

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
          setActiveSection("general");
        })
        .catch((err) => console.error("Failed to create category:", err));
    }
  };

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

  const jobApplications = trackedItems.filter((item) => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      item.title.toLowerCase().includes(searchLower) ||
      (item.companyOrPlatform &&
        item.companyOrPlatform.toLowerCase().includes(searchLower)) ||
      (item.description && item.description.toLowerCase().includes(searchLower));
    const itemCat = (item.category || "").toLowerCase();
    return (
      matchesSearch &&
      (itemCat.includes("job") || itemCat === "jobs" || !itemCat.includes("project"))
    );
  });

  const generalItems = trackedItems.filter((item) => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      item.title.toLowerCase().includes(searchLower) ||
      (item.companyOrPlatform &&
        item.companyOrPlatform.toLowerCase().includes(searchLower)) ||
      (item.description && item.description.toLowerCase().includes(searchLower));
    const itemCat = (item.category || "").toLowerCase();
    return matchesSearch && itemCat.includes("project");
  });

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const activeCount = links.filter((l) => l.active).length;
  const meta = SECTION_META[activeSection] || SECTION_META.dashboard;
  const firstName = (user.name || user.email?.split("@")[0] || "User").split(" ")[0];

  const renderLinksList = () => (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search short links…"
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
            {search || filter !== "all" ? "No links match your search" : "No links yet"}
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

      {filteredLinks.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-6">
          Showing {filteredLinks.length} of {links.length} link
          {links.length !== 1 ? "s" : ""}
        </p>
      )}
    </>
  );

  const renderTrackedList = (items, emptyLabel, createLabel, defaultCategory) => (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${emptyLabel}…`}
            className="w-full h-10 pl-9 pr-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
          />
        </div>
        <button
          onClick={() => setIsCreateTrackedModalOpen(true)}
          className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-all cursor-pointer shrink-0"
        >
          <PlusIcon />
          {createLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <p className="text-3xl mb-3">{defaultCategory === "jobs" ? "💼" : "🚀"}</p>
          <p className="text-sm font-semibold text-gray-800">No {emptyLabel} yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-5 max-w-sm mx-auto">
            {defaultCategory === "jobs"
              ? "Track job applications, email open status, resume views, and portfolio visits."
              : "Track project engagement across demo links, documentation, and repos."}
          </p>
          <button
            onClick={() => setIsCreateTrackedModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 cursor-pointer"
          >
            <PlusIcon />
            {createLabel}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
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

      {items.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-6">
          Showing all {items.length} {emptyLabel}
          {items.length !== 1 ? "" : ""} · Permanently saved until deleted
        </p>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="sticky top-0 h-screen shrink-0">
        <AppSidebar
          activeSection={activeSection}
          onSelect={setActiveSection}
          open={sidebarOpen}
          onOpenChange={handleSidebarOpenChange}
          userEmail={user.email}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{meta.title}</p>
              <p className="text-[11px] text-gray-400 truncate hidden sm:block">
                {meta.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(activeSection === "dashboard" || activeSection === "all-links") && (
                <>
                  <button
                    onClick={onCreateLongLink}
                    className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white border border-gray-200 text-gray-800 text-xs font-semibold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                  >
                    <PlusIcon />
                    Long link
                  </button>
                  <button
                    onClick={onCreateNew}
                    className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <PlusIcon />
                    Short link
                  </button>
                </>
              )}
              <button
                onClick={onLogout}
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto">
          {activeSection === "account" && (
            <AccountPanel
              user={user}
              onUserUpdate={onUserUpdate}
              onLogout={onLogout}
            />
          )}

          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hey {firstName}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Track your links, job applications, and automations in one place.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "all-links",
                    label: "All links",
                    value: links.length,
                    hint: "Open your short links",
                  },
                  {
                    id: "jobs-applications",
                    label: "Applications",
                    value: jobApplications.length,
                    hint: "Tracked job applications",
                  },
                  {
                    id: "jobs-automations",
                    label: "Automations",
                    value: "Go",
                    hint: "Email apply automation",
                  },
                ].map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveSection(card.id)}
                    className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === "all-links" && renderLinksList()}

          {activeSection === "test-lab" && <TestTab />}

          {activeSection === "jobs-applications" &&
            renderTrackedList(
              jobApplications,
              "job applications",
              "Add Job",
              "jobs",
            )}

          {activeSection === "jobs-automations" && (
            <AutomateApplyTab
              onJobTracked={handleAutomateRefresh}
              user={user}
            />
          )}

          {activeSection === "general" && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Workspace extras</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Projects and custom categories live here.
                  </p>
                </div>
                <button
                  onClick={handleAddCategoryPrompt}
                  className="h-9 px-3.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  + New category
                </button>
              </div>
              {categories.filter((c) => c.type === "custom").length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter((c) => c.type === "custom")
                    .map((cat) => (
                      <span
                        key={cat._id || cat.slug}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700"
                      >
                        <span>{cat.icon || "📁"}</span>
                        {cat.name}
                      </span>
                    ))}
                </div>
              )}
              {renderTrackedList(
                generalItems,
                "project entries",
                "Add Project",
                "projects",
              )}
            </div>
          )}
        </main>
      </div>

      <ViewTimelineDrawer
        link={selectedLinkForTimeline}
        onClose={() => setSelectedLinkForTimeline(null)}
      />

      <JobDetailsDrawer
        item={selectedTrackedItemDetails}
        allLinks={links}
        onClose={() => setSelectedTrackedItemDetails(null)}
      />

      <CreateTrackedItemModal
        open={isCreateTrackedModalOpen}
        onClose={() => setIsCreateTrackedModalOpen(false)}
        onSuccess={fetchCategoryData}
        defaultCategory={
          activeSection === "general" ? "projects" : "jobs"
        }
      />
    </div>
  );
}
