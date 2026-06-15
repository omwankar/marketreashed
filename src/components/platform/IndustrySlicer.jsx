import { Link } from "react-router-dom";
import { ChevronDown, Info } from "lucide-react";
import { usePlatformIntelligence } from "../../context/PlatformIntelligenceContext.jsx";
import { RADAR_INDUSTRIES } from "../../data/radarIndustries.js";
import { customIndustryContact } from "../../constants/contactLinks.js";

export function IndustrySlicer() {
  const { industryId, setIndustryId, loading, refreshing } = usePlatformIntelligence();
  const active = RADAR_INDUSTRIES.find((i) => i.id === industryId) || RADAR_INDUSTRIES[0];

  return (
    <div className="plt-industry-slicer" role="region" aria-label="Industry filter">
      <label className="plt-industry-slicer__label" htmlFor="radar-industry-select">
        Industry
      </label>
      <div className="plt-industry-slicer__row">
        <span className="plt-industry-slicer__icon" aria-hidden>
          {active.icon}
        </span>
        <div className="plt-industry-slicer__select-wrap">
          <select
            id="radar-industry-select"
            className="plt-industry-slicer__select"
            value={industryId}
            disabled={loading || refreshing}
            onChange={(e) => setIndustryId(e.target.value)}
          >
            {RADAR_INDUSTRIES.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.label}
              </option>
            ))}
          </select>
          <ChevronDown className="plt-industry-slicer__chevron h-4 w-4" aria-hidden />
        </div>
      </div>
      <p className="plt-industry-slicer__desc">{active.desc}</p>
      {(loading || refreshing) && (
        <p className="plt-industry-slicer__sync">Syncing {active.label} intelligence…</p>
      )}
      <p className="plt-industry-slicer__note">
        <Info className="h-3 w-3 shrink-0" aria-hidden />
        Need a custom vertical?{" "}
        <Link to={customIndustryContact()} className="plt-intel-link">
          Contact us
        </Link>{" "}
        for tailored Radar coverage.
      </p>
    </div>
  );
}
