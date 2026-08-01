import { useState, useRef, useEffect } from "react";

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDownIcon = () => (
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
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const BookmarkIcon = () => (
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
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export default function LongUrlDropdown({
  longUrls = [],
  onSelect,
  selectedUrl = "",
  isLoading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter long links by searching BOTH name and url (case insensitive)
  const filteredLinks = longUrls.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const matchName = item.name ? item.name.toLowerCase().includes(q) : false;
    const matchUrl = item.url ? item.url.toLowerCase().includes(q) : false;
    return matchName || matchUrl;
  });

  const activeItem = longUrls.find((l) => l.url === selectedUrl);

  return (
    <div className="relative w-full mb-3" ref={dropdownRef}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <BookmarkIcon />
          Reuse Saved Long Link
        </label>
        {activeItem && (
          <button
            type="button"
            onClick={() => onSelect({ name: "", url: "" })}
            className="text-[11px] text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 px-3.5 rounded-lg border bg-white text-xs text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
          activeItem
            ? "border-violet-300 ring-2 ring-violet-50 bg-violet-50/20 font-medium text-gray-900"
            : "border-gray-200 text-gray-500 hover:border-gray-300"
        }`}
      >
        <span className="truncate flex-1 font-mono">
          {activeItem ? (
            <span className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold text-[10px]">
                {activeItem.name}
              </span>
              <span className="truncate text-gray-600">{activeItem.url}</span>
            </span>
          ) : (
            `Select from ${longUrls.length} saved long link${
              longUrls.length !== 1 ? "s" : ""
            }…`
          )}
        </span>
        <span className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/60">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or URL…"
                autoFocus
                className="w-full h-8 pl-8 pr-3 rounded-md border border-gray-200 bg-white text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
              />
            </div>
          </div>

          {/* List Options */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-gray-400 animate-pulse">
                Loading saved long links…
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                {query ? "No long links match your search" : "No saved long links yet"}
              </div>
            ) : (
              filteredLinks.map((item) => {
                const isSelected = item.url === selectedUrl;
                return (
                  <button
                    key={item._id || item.url}
                    type="button"
                    onClick={() => {
                      onSelect({ name: item.name, url: item.url });
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer flex flex-col gap-0.5 ${
                      isSelected
                        ? "bg-violet-50 text-violet-900 font-medium"
                        : "hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold font-mono text-gray-900 truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">
                        Reuse link
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-400 truncate" title={item.url}>
                      {item.url}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
