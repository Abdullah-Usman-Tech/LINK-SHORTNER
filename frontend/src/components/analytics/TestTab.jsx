import { useState } from "react";
import EmailTestPanel from "./EmailTestPanel.jsx";
import ResumeHandler from "./ResumeHandler.jsx";
import TailoredResumeTab from "./TailoredResumeTab.jsx";

const SUB_TABS = [
  {
    id: "email",
    label: "Email Test",
    icon: "✉️",
    description: "SMTP checks and live test email dispatch",
  },
  {
    id: "resume",
    label: "My Resume",
    icon: "📄",
    description: "Edit your base resume and download PDF",
  },
  {
    id: "tailored",
    label: "Modified Resume wrt Job",
    icon: "🎯",
    description: "JD + resume → LLM-tailored version",
  },
];

export default function TestTab() {
  const [activeSubTab, setActiveSubTab] = useState("email");
  const activeMeta = SUB_TABS.find((t) => t.id === activeSubTab) || SUB_TABS[0];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧪</span>
              <h2 className="text-xl font-bold tracking-tight">Test Lab</h2>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-xl">
              Email automation, resume editing, and JD-based resume rewriting — switch sub-tabs below.
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
            </button>
          );
        })}
      </div>

      {activeSubTab === "email" && <EmailTestPanel />}
      {activeSubTab === "resume" && <ResumeHandler />}
      {activeSubTab === "tailored" && <TailoredResumeTab />}
    </div>
  );
}
