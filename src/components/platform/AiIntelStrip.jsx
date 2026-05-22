import { RefreshCw, Sparkles, Wifi } from "lucide-react";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";

export function AiIntelStrip() {
  const { intel, loading, refreshing, refresh, apiConfigured, isLive, providerLabel, isStale } =
    usePlatformIntelligence();

  if (!apiConfigured) {
    return (
      <div className="plt-intel-strip plt-intel-strip--warn" role="status">
        <p>
          <strong>AI not configured on server.</strong> In <strong>Vercel → Project → Settings → Environment Variables</strong>, add:
          <br />
          <code className="plt-code">GROQ_API_KEY</code> (recommended, fastest),{" "}
          <code className="plt-code">VITE_GEMINI_API_KEY</code>, and/or <code className="plt-code">VITE_NVIDIA_API_KEY</code>
          <br />
          Enable for <strong>Production</strong>, then <strong>Redeploy</strong>. Local: add to <code className="plt-code">.env</code> and restart <code className="plt-code">npm run dev</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="plt-intel-strip" role="status" aria-live="polite">
      <div className="plt-intel-strip__row">
        <span className="plt-status-live">
          <Wifi className="h-3 w-3" aria-hidden />
          {loading || refreshing ? "Syncing" : "Live"}
        </span>
        <span className="plt-intel-strip__mode">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" aria-hidden />
          {loading
            ? `Generating via ${providerLabel || "AI"}…`
            : refreshing
              ? "Updating intelligence in background…"
              : isStale
                ? "Showing cached intelligence · updating…"
                : isLive
                  ? intel.usedFallback
                    ? `${providerLabel || "AI"} (fallback)`
                    : `${providerLabel || "AI"} active`
                  : intel.source === "error"
                    ? "Sync failed — retry"
                    : "Ready"}
        </span>
        <p className="plt-intel-strip__summary">
          {loading
            ? "Generating intelligence (single optimized request)…"
            : refreshing
              ? "Refreshing latest data…"
              : intel.executiveSummary || "Click Refresh to generate a new intelligence snapshot."}
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          className="plt-status-bar__refresh"
          aria-label="Refresh AI intelligence"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>
      {intel.source === "error" && intel.error && (
        <div className="plt-intel-strip__error">
          <p>{intel.error}</p>
          {(intel.error.includes("quota") || intel.errorCode === "quota_exceeded") && (
            <p className="plt-intel-strip__error-hint">
              Gemini free tier is exhausted. Enable billing at{" "}
              <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="plt-intel-link">
                Google AI Studio
              </a>
              , or remove <code className="plt-code">VITE_GEMINI_API_KEY</code> on Vercel so only NVIDIA runs.
              Cached data is shown when available — avoid clicking Refresh repeatedly.
            </p>
          )}
          {intel.error.includes("timed out") && (
            <p className="plt-intel-strip__error-hint">
              NVIDIA model was slow. We now try a faster model first. Wait a minute and Refresh once.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
