import { useState } from "react";
import { createLongUrl } from "../../api/shortUrl.api";
import { isValidUrl } from "../../utils/validation";

export default function CreateLongUrlForm({ onSuccess }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!url.trim() || !isValidUrl(url.trim())) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setLoading(true);

    createLongUrl(url.trim(), name.trim())
      .then((saved) => {
        setSuccessMsg(`Saved long link successfully as "${saved.name}"!`);
        setUrl("");
        setName("");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1200);
      })
      .catch((err) => {
        console.error("Failed to create long link:", err);
        setError("Failed to create long link. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Target Long URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          placeholder="https://your-very-long-target-url.com/destination"
          required
          className="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm font-mono text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Long Link Name / Label <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Portfolio (Leave blank to auto-generate random-xxxx)"
          className="w-full h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-sm font-mono text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
        />
        <p className="mt-1 text-[11px] text-gray-400">
          If left empty, name will automatically be assigned as <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">random-XXXX</code>.
        </p>
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {successMsg && (
        <p className="text-xs text-emerald-600 font-medium p-2 bg-emerald-50 rounded-lg border border-emerald-200">
          ✓ {successMsg}
        </p>
      )}

      <div className="pt-2 flex justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center gap-2 hover:bg-gray-700 active:scale-95 transition-all duration-150 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            "Save Long Link"
          )}
        </button>
      </div>
    </form>
  );
}
