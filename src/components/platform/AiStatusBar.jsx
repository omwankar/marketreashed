import { RefreshCw, Sparkles, Wifi } from "lucide-react";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";

export function AiStatusBar() {
  const { intel, loading, refreshing, refresh, apiConfigured, isLive } = usePlatformIntelligence();
  const summary = intel.executiveSummary || "";

  return (
    <div className="plt-status-bar" role="status" aria-live="polite">
      <div className="plt-status-bar__inner">
        <div className="plt-status-bar__left">
          <span className="plt-status-live">
            <Wifi className="h-3 w-3 shrink-0" aria-hidden />
            {loading ? "Syncing" : "Live"}
          </span>
          <span className="plt-status-bar__mode">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden />
            {isLive ? "AI intelligence active" : "Demo intelligence mode"}
            {apiConfigured && isLive && <span className="text-slate-500">· Gemini</span>}
          </span>
          {!apiConfigured && (
            <span className="plt-status-bar__hint">Add VITE_GEMINI_API_KEY to .env</span>
          )}
        </div>

        <div className="plt-status-bar__center plt-hide-mobile">
          <p className="plt-status-bar__ticker">
            {loading ? "Generating executive brief…" : summary}
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          className="plt-status-bar__refresh"
          aria-label="Refresh AI intelligence"
        >
          <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
