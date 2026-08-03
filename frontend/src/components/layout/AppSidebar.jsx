import { useEffect, useState } from "react";

const Icon = ({ children }) => (
  <span className="inline-flex h-5 w-5 items-center justify-center shrink-0 text-current">
    {children}
  </span>
);

const AccountIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </Icon>
);

const DashboardIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  </Icon>
);

const LinksIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  </Icon>
);

const LabIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 3v7.5L5.4 18a2 2 0 0 0 1.6 3h10a2 2 0 0 0 1.6-3L14 10.5V3" />
      <path d="M8.5 14h7" />
    </svg>
  </Icon>
);

const JobsIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 13h20" />
    </svg>
  </Icon>
);

const ApplicationsIcon = () => (
  <Icon>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  </Icon>
);

const AutomationsIcon = () => (
  <Icon>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="m4.93 4.93 2.83 2.83" />
      <path d="m16.24 16.24 2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="m4.93 19.07 2.83-2.83" />
      <path d="m16.24 7.76 2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </Icon>
);

const GeneralIcon = () => (
  <Icon>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  </Icon>
);

const ChevronIcon = ({ open }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PanelToggleIcon = ({ collapsed }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {collapsed ? (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
        <path d="m14 10 3 2-3 2" />
      </>
    ) : (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
        <path d="m16 10-3 2 3 2" />
      </>
    )}
  </svg>
);

export const NAV_ITEMS = [
  { id: "account", label: "Account", icon: AccountIcon },
  { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
  { id: "all-links", label: "All links", icon: LinksIcon },
  { id: "test-lab", label: "Testing Lab", icon: LabIcon },
  {
    id: "jobs",
    label: "Jobs",
    icon: JobsIcon,
    children: [
      { id: "jobs-applications", label: "Applications", icon: ApplicationsIcon },
      { id: "jobs-automations", label: "Automations", icon: AutomationsIcon },
    ],
  },
  { id: "general", label: "General", icon: GeneralIcon },
];

const SIDEBAR_KEY = "snip.sidebar.open.v1";

export default function AppSidebar({
  activeSection,
  onSelect,
  open,
  onOpenChange,
  userEmail = "",
}) {
  const [jobsOpen, setJobsOpen] = useState(
    activeSection?.startsWith("jobs") ?? true,
  );

  useEffect(() => {
    if (activeSection?.startsWith("jobs")) setJobsOpen(true);
  }, [activeSection]);

  const collapsed = !open;

  const itemClass = (active) =>
    `w-full flex items-center gap-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
    } ${
      active
        ? "bg-gray-900 text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  const childClass = (active) =>
    `w-full flex items-center gap-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
      collapsed ? "justify-center px-2 py-2" : "pl-10 pr-3 py-2"
    } ${
      active
        ? "bg-gray-900 text-white"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    }`;

  return (
    <aside
      className={`relative z-30 flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-out ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      <div
        className={`flex items-center border-b border-gray-100 ${
          collapsed ? "justify-center px-2 py-4" : "justify-between px-4 py-4"
        }`}
      >
        {!collapsed && (
          <p className="text-sm font-medium tracking-widest uppercase text-gray-700">
            ✦ Snip
          </p>
        )}
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelToggleIcon collapsed={collapsed} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const childActive = hasChildren
            ? item.children.some((c) => c.id === activeSection)
            : false;
          const isJobsParentActive = item.id === "jobs" && activeSection?.startsWith("jobs");
          const isActive = activeSection === item.id;

          if (!hasChildren) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={itemClass(isActive)}
                title={item.label}
              >
                <ItemIcon />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          }

          return (
            <div key={item.id} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  if (collapsed) {
                    onOpenChange(true);
                    setJobsOpen(true);
                    onSelect(item.children[0].id);
                    return;
                  }
                  setJobsOpen((v) => !v);
                }}
                className={`w-full flex items-center gap-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                } ${
                  childActive
                    ? "bg-gray-100 text-gray-900"
                    : isJobsParentActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title={item.label}
              >
                <ItemIcon />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    <ChevronIcon open={jobsOpen} />
                  </>
                )}
              </button>

              {(jobsOpen || collapsed) && (
                <div className={`space-y-1 ${collapsed ? "" : ""}`}>
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = activeSection === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelect(child.id)}
                        className={childClass(childActive)}
                        title={child.label}
                      >
                        <ChildIcon />
                        {!collapsed && <span className="truncate">{child.label}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && userEmail && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
            Signed in
          </p>
          <p className="text-xs text-gray-700 mt-1 truncate">{userEmail}</p>
        </div>
      )}
    </aside>
  );
}

export function loadSidebarOpen() {
  try {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === null) return true;
    return saved === "1";
  } catch {
    return true;
  }
}

export function saveSidebarOpen(open) {
  try {
    localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}
