import { useState } from "react";
import { createShortUrl, createTrackedItem } from "../../api/shortUrl.api";
import { isValidUrl } from "../../utils/validation";

export default function CreateTrackedItemModal({
  open,
  onClose,
  onSuccess,
  defaultCategory = "Jobs",
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [title, setTitle] = useState("");
  const [companyOrPlatform, setCompanyOrPlatform] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [status, setStatus] = useState("Applied");

  // Tracked target URLs inputs
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [emailUrl, setEmailUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title (e.g. Job Title or Project Name)");
      return;
    }

    setLoading(true);

    try {
      const trackedLinks = [];

      // Generate short link for Resume URL if provided
      if (resumeUrl.trim()) {
        if (!isValidUrl(resumeUrl.trim())) {
          setError("Resume URL must be a valid http:// or https:// link");
          setLoading(false);
          return;
        }
        const shortUrl = await createShortUrl(resumeUrl.trim());
        trackedLinks.push({
          label: "Resume Tracker Link",
          type: "resume",
          shortUrl,
          fullUrl: resumeUrl.trim(),
        });
      }

      // Generate short link for Portfolio URL if provided
      if (portfolioUrl.trim()) {
        if (!isValidUrl(portfolioUrl.trim())) {
          setError("Portfolio URL must be a valid http:// or https:// link");
          setLoading(false);
          return;
        }
        const shortUrl = await createShortUrl(portfolioUrl.trim());
        trackedLinks.push({
          label: "Portfolio Tracker Link",
          type: "portfolio",
          shortUrl,
          fullUrl: portfolioUrl.trim(),
        });
      }

      // Generate short link for Email Tracker URL if provided
      if (emailUrl.trim()) {
        if (!isValidUrl(emailUrl.trim())) {
          setError("Email Tracker URL must be a valid http:// or https:// link");
          setLoading(false);
          return;
        }
        const shortUrl = await createShortUrl(emailUrl.trim());
        trackedLinks.push({
          label: "Email Open Tracker Link",
          type: "email",
          shortUrl,
          fullUrl: emailUrl.trim(),
        });
      }

      // Save Tracked Item document to MongoDB
      await createTrackedItem({
        title: title.trim(),
        companyOrPlatform: companyOrPlatform.trim(),
        category,
        description: description.trim(),
        sourceUrl: sourceUrl.trim(),
        status,
        trackedLinks,
      });

      // Clear & Close
      setTitle("");
      setCompanyOrPlatform("");
      setDescription("");
      setSourceUrl("");
      setResumeUrl("");
      setPortfolioUrl("");
      setEmailUrl("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create tracked item:", err);
      setError(err?.response?.data?.message || "Failed to create entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-gray-900">
            Create Tracked {category === "jobs" ? "Job Application" : "Project / Campaign"} Entry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Category Tab
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-800 outline-none"
            >
              <option value="jobs">💼 Job Applications</option>
              <option value="projects">🚀 My Projects</option>
              <option value="custom">📁 Custom Tracker</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {category === "projects" ? "Project Name" : "Job Title"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === "projects"
                  ? "e.g. AI URL Shortener"
                  : "e.g. Senior Fullstack Developer"
              }
              required
              className="w-full h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {category === "projects" ? "Platform / Client" : "Company Name"}
            </label>
            <input
              type="text"
              value={companyOrPlatform}
              onChange={(e) => setCompanyOrPlatform(e.target.value)}
              placeholder="e.g. Google / Stripe / GitHub"
              className="w-full h-9 px-3.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 outline-none focus:border-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Source Link (LinkedIn / Job Post / Repo)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://linkedin.com/jobs/..."
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-800 outline-none"
              >
                <option value="Applied">Applied</option>
                <option value="Email Sent">Email Sent</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Offered">Offered</option>
                <option value="Active">Active</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add application notes or details..."
              className="w-full p-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 outline-none focus:border-gray-400"
            />
          </div>

          {/* Trackable Links Inputs */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span>Attach Trackable Links (Auto-generates Short Tracking Links)</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                📄 Resume Target URL
              </label>
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/your-resume.pdf"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 font-mono text-xs text-gray-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                🌐 Portfolio Target URL
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://abdullah-usman.tech/portfolio"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 font-mono text-xs text-gray-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                📧 Email Open Tracker URL
              </label>
              <input
                type="url"
                value={emailUrl}
                onChange={(e) => setEmailUrl(e.target.value)}
                placeholder="https://your-domain.com/email-open-tracker"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 font-mono text-xs text-gray-800 outline-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Tracked Entry…
                </>
              ) : (
                "Save & Generate Tracked Entry"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
