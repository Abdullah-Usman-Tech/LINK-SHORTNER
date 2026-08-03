import { PlusIcon } from "../../icons/index.jsx";

export default function CategoryTabs({
  categories = [],
  activeCategory = "all",
  onSelectCategory,
  onAddCategory,
  counts = {},
}) {
  const defaultCategories = [
    { name: "All Links", slug: "all", icon: "🔗", type: "all" },
    { name: "Job Applications", slug: "jobs", icon: "💼", type: "jobs" },
    { name: "My Projects", slug: "projects", icon: "🚀", type: "projects" },
    { name: "Automate Apply", slug: "automate-apply", icon: "🤖", type: "automate-apply" },
    { name: "Test Lab", slug: "test-lab", icon: "🧪", type: "test-lab" },
  ];

  const mergedCategories = [...defaultCategories];

  // Merge custom categories from DB if not already present
  categories.forEach((cat) => {
    if (!mergedCategories.some((c) => c.slug === cat.slug)) {
      mergedCategories.push({
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        icon: cat.icon || "📁",
        type: cat.type || "custom",
      });
    }
  });

  return (
    <div className="flex items-center justify-between border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar pt-2">
      <div className="flex items-center gap-1 sm:gap-2">
        {mergedCategories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const count = counts[cat.slug] !== undefined ? counts[cat.slug] : null;

          return (
            <button
              key={cat.slug}
              onClick={() => onSelectCategory(cat.slug)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-gray-900 text-gray-900 bg-white shadow-xs"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60"
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.name}</span>
              {count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onAddCategory}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer shrink-0 mb-1"
        title="Add a custom category tab"
      >
        <PlusIcon />
        <span>New Tab</span>
      </button>
    </div>
  );
}
