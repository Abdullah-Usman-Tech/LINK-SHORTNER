import { useState } from "react";
import { signUp } from "../api/auth.api";

const EyeIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckIcon = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
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

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
];

export default function SignUp({ onNavigateSignIn, onSignUpSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSubmit = () => {
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (!passwordRules.every((r) => r.test(password))) {
      setError("Password doesn't meet the requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    signUp({ email: email.trim(), password })
      .then((res) => {
        onSignUpSuccess?.(res);
      })
      .catch((err) => {
        setError(err?.message || "Something went wrong. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  const passwordStrength = passwordRules.filter((r) => r.test(password)).length;
  const strengthColors = ["bg-red-400", "bg-amber-400", "bg-emerald-400"];
  const strengthLabels = ["Weak", "Fair", "Strong"];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-3">
            ✦ <span className="text-gray-700">Snip</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign up with email and password
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="you@example.com"
                className="h-11 px-3.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 pr-10 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {password && (
                <div className="mt-1">
                  <div className="flex gap-1 mb-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i < passwordStrength
                            ? strengthColors[passwordStrength - 1]
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Strength:{" "}
                    <span
                      className={`font-medium ${
                        passwordStrength === 3
                          ? "text-emerald-600"
                          : passwordStrength === 2
                            ? "text-amber-600"
                            : "text-red-500"
                      }`}
                    >
                      {strengthLabels[passwordStrength - 1] || "Too weak"}
                    </span>
                  </p>
                </div>
              )}

              {(passwordFocused || password) && (
                <div className="flex flex-col gap-1 mt-1">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        rule.test(password) ? "text-emerald-600" : "text-gray-400"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center w-3.5 h-3.5 rounded-full border transition-all ${
                          rule.test(password)
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {rule.test(password) && <CheckIcon size={8} />}
                      </span>
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  className={`w-full h-11 px-3.5 pr-10 rounded-lg border bg-gray-50 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-gray-100 transition-all ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-300 focus:border-red-400"
                      : "border-gray-200 focus:border-gray-400 focus:bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-1 h-11 rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Already have an account?{" "}
          <button
            onClick={onNavigateSignIn}
            className="text-gray-700 font-medium hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
