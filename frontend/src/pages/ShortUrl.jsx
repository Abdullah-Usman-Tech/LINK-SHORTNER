import { useState, useCallback } from "react";
import { createCustomUrl, createShortUrl } from "../api/shortUrl.api";
import CopyButton from "../components/shared/CopyButton.jsx";
import { isValidUrl, isValidAlias } from "../utils/validation.js";

const CopyIcon = () => (
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
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

function HistoryItem({ item }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-gray-100 text-xs">
      <span className="font-mono font-medium text-gray-800 shrink-0">
        {item.shortUrl}
      </span>
      {item.custom && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-200 shrink-0">
          custom
        </span>
      )}
      <span className="text-gray-300 shrink-0">
        <ArrowRightIcon />
      </span>
      <span
        className="font-mono text-gray-400 truncate flex-1"
        title={item.fullUrl}
      >
        {item.fullUrl}
      </span>
      <CopyButton textToCopy={item.shortUrl} size="sm" />
    </div>
  );
}

export default function ShortUrl({ onSuccess }) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aliasError, setAliasError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleShorten = useCallback(() => {
    setError("");
    setAliasError("");

    if (!url.trim() || !isValidUrl(url.trim())) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    const trimmedAlias = alias.trim();

    if (trimmedAlias && !isValidAlias(trimmedAlias)) {
      setAliasError("Only letters, numbers, - and _ allowed (2–30 chars)");
      return;
    }

    setLoading(true);

    const apiCall = trimmedAlias
      ? createCustomUrl(url.trim(), trimmedAlias)
      : createShortUrl(url.trim());

    apiCall
      .then((res) => {
        const entry = {
          shortUrl: res,
          fullUrl: url.trim(),
          custom: !!trimmedAlias,
        };
        setResult(entry);
        setHistory((prev) => [entry, ...prev].slice(0, 5));
        setUrl("");
        setAlias("");
        // if (onSuccess) setTimeout(onSuccess, 1500);
      })
      .catch((err) => {
        if (trimmedAlias) {
          setAliasError(
            err?.message?.includes("taken")
              ? "This alias is already taken. Try another."
              : "Failed to create custom URL. Please try again.",
          );
        } else {
          setError("Failed to create short URL. Please try again.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url, alias, onSuccess]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleShorten();
  };

  const containerClass = onSuccess
    ? "w-full"
    : "min-h-screen bg-gray-50 flex items-start justify-center pt-20 px-4";
  const innerClass = onSuccess ? "w-full" : "w-full max-w-lg";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        {!onSuccess && (
          <>
            {/* Header */}
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-6">
              ✦ <span className="text-gray-700">Snip</span> — URL Shortener
            </p>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-1.5">
              Long URLs,
              <br />
              made tiny.
            </h1>
            <p className="text-sm text-gray-500 mb-7">
              Paste any URL and get a short link instantly.
            </p>
          </>
        )}

        {/* URL Input Row */}
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="https://your-very-long-url.com/goes/here"
            className="flex-1 h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm font-mono text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
          />
          <button
            onClick={handleShorten}
            disabled={loading}
            className="h-11 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold shrink-0 flex items-center gap-2 hover:bg-gray-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Shortening
              </>
            ) : (
              "Shorten"
            )}
          </button>
        </div>

        {/* URL error */}
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        {/* Custom Alias Row */}
        <div
          className={`mt-2.5 flex items-center gap-0 rounded-lg border bg-white overflow-hidden transition-all focus-within:ring-2 focus-within:ring-gray-100 ${
            aliasError
              ? "border-red-300 focus-within:border-red-400"
              : "border-gray-200 focus-within:border-gray-400"
          }`}
        >
          <span className="pl-3.5 pr-1.5 text-sm font-mono text-gray-400 shrink-0 select-none">
            snip.io/
          </span>
          <input
            type="text"
            value={alias}
            onChange={(e) => {
              setAlias(e.target.value.replace(/\s/g, ""));
              setAliasError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="custom-alias  (optional)"
            maxLength={30}
            className="flex-1 h-10 pr-3.5 bg-transparent text-sm font-mono text-gray-800 placeholder-gray-300 outline-none"
          />
          {alias && (
            <button
              onClick={() => {
                setAlias("");
                setAliasError("");
              }}
              className="pr-3 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
              aria-label="Clear alias"
            >
              ✕
            </button>
          )}
        </div>

        {aliasError ? (
          <p className="mt-1.5 text-xs text-red-500">{aliasError}</p>
        ) : (
          <p className="mt-1.5 text-xs text-gray-400">
            Leave blank to auto-generate · letters, numbers, - and _ only
          </p>
        )}

        {/* Result Card */}
        {result && (
          <div className="mt-4 border border-gray-200 rounded-xl bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                Your short link
              </p>
              {result.custom && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                  Custom alias
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 truncate select-all">
                {`${result.shortUrl}`}
              </div>
              <CopyButton textToCopy={`${result.shortUrl}`} />
            </div>
            <p className="mt-2.5 text-xs font-mono text-gray-400 truncate">
              ↳ {result.fullUrl}
            </p>
          </div>
        )}

        {/* History */}
        {!onSuccess && history.length > 0 && (
          <>
            <hr className="my-6 border-gray-200" />
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2.5">
                Recent links
              </p>
              <div className="flex flex-col gap-1.5">
                {history.map((item, i) => (
                  <HistoryItem key={i} item={item} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
