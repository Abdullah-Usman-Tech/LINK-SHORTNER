import { useState } from "react";
import AutomateEmailApplyPanel from "./AutomateEmailApplyPanel.jsx";

const SUB_TABS = [
  {
    id: "email-apply",
    label: "Automate Email Apply",
    icon: "📧",
    description: "Parse post → tailor resume → draft/send application email",
    ready: true,
  },
  {
    id: "easy-apply",
    label: "Automate Easy Apply",
    icon: "⚡",
    description: "Coming soon — LinkedIn Easy Apply automation",
    ready: false,
  },
  {
    id: "form-apply",
    label: "Automate Form Apply",
    icon: "📝",
    description: "Coming soon — career-site form fill automation",
    ready: false,
  },
];

export default function AutomateApplyTab({ onJobTracked, user }) {
  const [activeSubTab, setActiveSubTab] = useState("email-apply");
  const activeMeta = SUB_TABS.find((t) => t.id === activeSubTab) || SUB_TABS[0];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-bold tracking-tight">Automate Apply</h2>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-xl">
              One place for application automations. Start with email apply — more apply modes
              will land as their own sub-tabs here.
            </p>
          </div>
          <div className="text-[11px] font-mono bg-white/10 border border-white/10 rounded-xl px-3.5 py-2">
            {activeMeta.icon} {activeMeta.label}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto no-scrollbar">
        {SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "border-gray-900 text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60"
              }`}
              title={tab.description}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {!tab.ready && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeSubTab === "email-apply" && (
        <AutomateEmailApplyPanel onJobTracked={onJobTracked} user={user} />
      )}

      {activeSubTab !== "email-apply" && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <p className="text-3xl mb-3">{activeMeta.icon}</p>
          <p className="text-sm font-semibold text-gray-800">{activeMeta.label}</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{activeMeta.description}</p>
        </div>
      )}
    </div>
  );
}
