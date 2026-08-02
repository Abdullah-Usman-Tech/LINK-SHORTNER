import { useState, useEffect } from "react";
import { verifySmtp, sendTestEmail } from "../../api/shortUrl.api.js";

export default function EmailTestPanel() {
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.titan.email",
    port: "465",
    user: "hello@abdullah-usman.tech",
    pass: "A12345678@a",
  });
  const [showConfigEdit, setShowConfigEdit] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState({
    loading: false,
    verified: null,
    message: "Not verified yet. Click to test connection.",
  });
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Automated Test Email via Titan SMTP");
  const [body, setBody] = useState(
    `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <h2 style="color: #111827; margin-top: 0;">Hello from Abdullah Usman Tech! 🚀</h2>
  <p style="color: #4b5563; font-size: 14px;">This is a test email sent from the Automation Sandbox using <b>Titan SMTP</b>.</p>
  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
  <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">Sender: hello@abdullah-usman.tech</p>
</div>`,
  );
  const [isHtml, setIsHtml] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const handleVerifySmtp = async (customConfig = smtpConfig) => {
    setSmtpStatus({
      loading: true,
      verified: null,
      message: `Connecting to ${customConfig.host}:${customConfig.port}...`,
    });
    try {
      const res = await verifySmtp(customConfig);
      setSmtpStatus({
        loading: false,
        verified: true,
        message: res.message || `Connected to ${customConfig.host}:${customConfig.port}`,
      });
    } catch (err) {
      const errData = err.response?.data;
      setSmtpStatus({
        loading: false,
        verified: false,
        message: errData?.message || err.message || "Failed to authenticate with SMTP server",
        details: errData,
      });
    }
  };

  useEffect(() => {
    handleVerifySmtp();
  }, []);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!to || !to.trim()) {
      alert("Please enter a recipient email address.");
      return;
    }

    setSending(true);
    setEmailResult(null);

    const logItem = {
      id: Date.now(),
      to,
      subject,
      timestamp: new Date().toLocaleTimeString(),
      status: "sending",
    };

    try {
      const res = await sendTestEmail({
        to: to.trim(),
        subject,
        body,
        isHtml,
        smtpOverrides: smtpConfig,
      });

      setEmailResult({
        success: true,
        message: res.message || `Successfully sent email to ${to}`,
        details: res.details,
      });

      logItem.status = "success";
      logItem.response = res.details?.response || "Sent";
      setLogs((prev) => [logItem, ...prev]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error sending email";
      setEmailResult({ success: false, message: errorMsg });
      logItem.status = "error";
      logItem.error = errorMsg;
      setLogs((prev) => [logItem, ...prev]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>✉️</span> Send Test Email
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Send live emails via{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">
                  {smtpConfig.host}:{smtpConfig.port}
                </code>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsHtml(!isHtml)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors cursor-pointer ${
                isHtml
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              Format: {isHtml ? "HTML" : "Plain Text"}
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Recipient Email (<code className="text-indigo-600 font-mono">To</code>) *
              </label>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Enter recipient email address (e.g. recipient@gmail.com)"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Line *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line for test email"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Message Body ({isHtml ? "HTML Markup supported" : "Plain Text"}) *
              </label>
              <textarea
                rows={6}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your email content here..."
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 font-mono text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-400">
                From: <span className="font-semibold text-gray-600">{smtpConfig.user}</span>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 h-10 px-6 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                {sending ? "Sending Mail..." : "🚀 Send Test Email"}
              </button>
            </div>
          </form>

          {emailResult && (
            <div
              className={`mt-5 p-4 rounded-xl border text-xs leading-relaxed ${
                emailResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="font-bold mb-1">
                {emailResult.success ? "✅ Email Sent Successfully!" : "❌ Failed to Send Email"}
              </div>
              <p>{emailResult.message}</p>
              {emailResult.details && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 font-mono text-[11px] opacity-90">
                  <p>Message ID: {emailResult.details.messageId}</p>
                  <p>Response: {emailResult.details.response}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              ⚙️ SMTP Server Status
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfigEdit(!showConfigEdit)}
                className="text-[11px] text-gray-500 hover:text-gray-900 font-medium cursor-pointer"
              >
                {showConfigEdit ? "Done" : "Edit Details"}
              </button>
              <button
                onClick={() => handleVerifySmtp()}
                disabled={smtpStatus.loading}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
              >
                {smtpStatus.loading ? "Testing..." : "Test Link"}
              </button>
            </div>
          </div>

          {showConfigEdit ? (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">SMTP Host</label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-gray-300 bg-white font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Port</label>
                  <select
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                    className="w-full h-8 px-2 rounded border border-gray-300 bg-white text-xs"
                  >
                    <option value="465">465 (SSL)</option>
                    <option value="587">587 (TLS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Password</label>
                  <input
                    type="password"
                    value={smtpConfig.pass}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                    className="w-full h-8 px-2 rounded border border-gray-300 bg-white text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">User Email</label>
                <input
                  type="email"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-gray-300 bg-white font-mono text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  handleVerifySmtp(smtpConfig);
                  setShowConfigEdit(false);
                }}
                className="w-full h-8 rounded bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
              >
                Save & Re-test Connection
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Host</span>
                <span className="font-mono font-medium text-gray-800">{smtpConfig.host}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Port</span>
                <span className="font-mono font-medium text-gray-800">
                  {smtpConfig.port} ({smtpConfig.port === "465" ? "SSL" : "TLS"})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">User</span>
                <span className="font-mono text-[11px] font-medium text-gray-800 truncate max-w-[150px]">
                  {smtpConfig.user}
                </span>
              </div>
            </div>
          )}

          <div
            className={`mt-4 p-3 rounded-xl text-xs font-medium ${
              smtpStatus.verified === true
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : smtpStatus.verified === false
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  smtpStatus.verified === true
                    ? "bg-emerald-500"
                    : smtpStatus.verified === false
                      ? "bg-rose-500"
                      : "bg-amber-500 animate-pulse"
                }`}
              />
              <span className="font-bold">
                {smtpStatus.verified === true
                  ? "Authenticated"
                  : smtpStatus.verified === false
                    ? "Authentication Failed"
                    : "Connecting..."}
              </span>
            </div>
            <p className="text-[11px] leading-normal opacity-90">{smtpStatus.message}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
            📋 Session Dispatch Logs
          </h3>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No test emails sent in this session yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-gray-900 truncate max-w-[140px]">{log.to}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-gray-600 text-[11px] truncate">{log.subject}</p>
                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold uppercase tracking-wider ${
                        log.status === "success" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {log.status}
                    </span>
                    {log.response && (
                      <span className="text-gray-400 truncate max-w-[150px]">{log.response}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
