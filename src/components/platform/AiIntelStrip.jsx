import { RefreshCw, Sparkles, Wifi } from "lucide-react";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";

export function AiIntelStrip() {
  const { intel, loading, refreshing, refresh, apiConfigured, isLive, providerLabel, isStale } =
    usePlatformIntelligence();

  if (!apiConfigured) {
    return (
      <div className="plt-intel-strip plt-intel-strip--warn" role="status">
        <p>
          <strong>Connect AI:</strong> Add your NVIDIA API key to <code className="plt-code">.env</code>:
          <br />
          <code className="plt-code">VITE_NVIDIA_API_KEY=nvapi-your-key-here</code>
          <br />
          Get a free key at{" "}
          <a href="https://build.nvidia.com/" target="_blank" rel="noopener noreferrer" className="plt-intel-link">
            build.nvidia.com
          </a>
          . Then <strong>restart</strong> <code className="plt-code">npm run dev</code>.
          <br />
          Or use <code className="plt-code">VITE_GEMINI_API_KEY</code> (tried first when both are set)
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
                  ? intel.provider === "nvidia" && intel.usedFallback
                    ? "NVIDIA fallback (Gemini unavailable)"
                    : `${providerLabel || "AI"} active`
                  : intel.source === "error"
                    ? "Sync failed — retry"
                    : "Ready"}
        </span>
        <p className="plt-intel-strip__summary">
          {loading
            ? "Running 2 fast AI requests (text + charts)…"
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
        <p className="plt-intel-strip__error">{intel.error}</p>
      )}
    </div>
  );
}
