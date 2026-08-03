import { useEffect, useState } from "react";
import { updateProfile } from "../../api/auth.api.js";

const emptyProfile = {
  name: "",
  bio: "",
  phone: "",
  location: "",
  website: "",
  github: "",
  linkedin: "",
  twitter: "",
  portfolio: "",
  youtube: "",
  customLinks: [],
};

const LINK_FIELDS = [
  { key: "website", label: "Website", placeholder: "https://your-site.com" },
  { key: "portfolio", label: "Portfolio", placeholder: "https://abdullah-usman.tech" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/username" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@username" },
];

export default function AccountPanel({ user, onUserUpdate, onLogout }) {
  const [form, setForm] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      bio: user?.bio || "",
      phone: user?.phone || "",
      location: user?.location || "",
      website: user?.website || "",
      github: user?.github || "",
      linkedin: user?.linkedin || "",
      twitter: user?.twitter || "",
      portfolio: user?.portfolio || "",
      youtube: user?.youtube || "",
      customLinks: Array.isArray(user?.customLinks)
        ? user.customLinks.map((item) => ({
            label: item.label || "",
            url: item.url || "",
            id: item._id || `${item.label}-${item.url}`,
          }))
        : [],
    });
  }, [user]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const addCustomLink = () => {
    setForm((prev) => ({
      ...prev,
      customLinks: [
        ...prev.customLinks,
        { id: `new-${Date.now()}`, label: "", url: "" },
      ],
    }));
  };

  const updateCustomLink = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      customLinks: prev.customLinks.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
    setMessage(null);
  };

  const removeCustomLink = (index) => {
    setForm((prev) => ({
      ...prev,
      customLinks: prev.customLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...form,
        customLinks: form.customLinks
          .map(({ label, url }) => ({ label: label.trim(), url: url.trim() }))
          .filter((item) => item.label && item.url),
      };
      const res = await updateProfile(payload);
      onUserUpdate?.(res.user);
      setMessage({ type: "success", text: res.message || "Profile saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.message || "Failed to save profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Account</h2>
            <p className="text-xs text-gray-500 mt-1">
              Edit your profile and public links. These can be reused across resumes and applications.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-4 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {message && (
          <div
            className={`px-3.5 py-2.5 rounded-xl border text-xs ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Display name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Abdullah Usman"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-100 text-sm text-gray-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="+92 300 0000000"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              placeholder="Lahore, Pakistan"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Bio</label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
            placeholder="Short intro about you, roles, and focus areas…"
            className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Social & professional links</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            GitHub, LinkedIn, Twitter, portfolio, YouTube, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LINK_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type="url"
                value={form[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Other links</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add any extra links (Behance, Medium, Calendly, etc.).
            </p>
          </div>
          <button
            type="button"
            onClick={addCustomLink}
            className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            + Add link
          </button>
        </div>

        {form.customLinks.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No custom links yet.</p>
        ) : (
          <div className="space-y-2">
            {form.customLinks.map((item, index) => (
              <div
                key={item.id || index}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2"
              >
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateCustomLink(index, "label", e.target.value)}
                  placeholder="Label (e.g. Behance)"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400"
                />
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => updateCustomLink(index, "url", e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none focus:bg-white focus:border-gray-400"
                />
                <button
                  type="button"
                  onClick={() => removeCustomLink(index)}
                  className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex justify-between items-center gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-900">Session</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Sign out of this device anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </form>
  );
}
