import { RefreshCw, Sparkles, Wifi } from "lucide-react";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";

export function AiIntelStrip() {
  const { intel, loading, refreshing, refresh, apiConfigured, apiMissing, setupHint, isLive, providerLabel, isStale } =
    usePlatformIntelligence();

  if (!apiConfigured) {
    return (
      <div className="plt-intel-strip plt-intel-strip--warn" role="status">
        {apiMissing ? (
          <p>
            <strong>Server API is not running on your host.</strong> Local <code className="plt-code">.env</code> does
            not fix production — keys must be on <strong>Netlify</strong> or <strong>Vercel</strong>, then{" "}
            <strong>redeploy</strong>.
            <br />
            Netlify: Site settings → Environment variables → add <code className="plt-code">GROQ_API_KEY</code>, then
            Deploys → Trigger deploy.
            <br />
            Vercel: Project → Settings → Environment Variables → same keys → Redeploy.
            <br />
            Test: open <code className="plt-code">/api/platform-intelligence</code> — you must see JSON, not the
            homepage.
            {setupHint && (
              <>
                <br />
                <span className="plt-intel-strip__error-hint">{setupHint}</span>
              </>
            )}
          </p>
        ) : import.meta.env.DEV ? (
          <p>
            <strong>Local .env not loaded into dev API.</strong> In project root <code className="plt-code">.env</code> add:
            <br />
            <code className="plt-code">GROQ_API_KEY=gsk_your-key</code> (recommended)
            <br />
            Optional: <code className="plt-code">VITE_GEMINI_API_KEY</code>, <code className="plt-code">VITE_NVIDIA_API_KEY</code>
            <br />
            Then <strong>stop</strong> and restart <code className="plt-code">npm run dev</code>. Test:{" "}
            <a href="/api/platform-intelligence" target="_blank" rel="noreferrer" className="plt-intel-link">
              /api/platform-intelligence
            </a>{" "}
            should show <code className="plt-code">"configured":true</code>.
            {setupHint && (
              <>
                <br />
                <span className="plt-intel-strip__error-hint">{setupHint}</span>
              </>
            )}
          </p>
        ) : (
          <p>
            <strong>Keys in Vercel UI ≠ keys on live server.</strong> You must{" "}
            <strong>Redeploy</strong> after adding env vars (Deployments → ⋮ → Redeploy).
            <br />
            Open{" "}
            <a href="/api/platform-intelligence" target="_blank" rel="noreferrer" className="plt-intel-link">
              /api/platform-intelligence
            </a>
            : need <code className="plt-code">"configured":true</code> and{" "}
            <code className="plt-code">"keysPresent":{"{"}groq:true,...{"}"}</code>.
            <br />
            Confirm <code className="plt-code">insightaxisintelligence.com</code> is on the{" "}
            <strong>same</strong> Vercel project where you added keys (marketreashed).
            {setupHint && (
              <>
                <br />
                <span className="plt-intel-strip__error-hint">{setupHint}</span>
              </>
            )}
          </p>
        )}
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
