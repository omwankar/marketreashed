/**
 * Hierarchical market segmentation: Main Category → Segment → Sub-segment.
 */

export function isChannelDimension(dimension) {
  return /distribution|channel|route to market|sales channel/i.test(String(dimension || ""));
}

function ensureByPrefix(dimension) {
  const d = String(dimension || "").trim();
  if (!d) return "By Category";
  return /^by\s/i.test(d) ? d : `By ${d}`;
}

function retailOnOffTradeHierarchy(subs, lead, fast) {
  const onTrade =
    subs.find((s) => /foodservice|on-trade|on trade|horeca|food service/i.test(s)) || "On-trade";
  const offCandidates = subs.filter((s) => {
    const n = s.toLowerCase();
    return s !== onTrade && !/foodservice|on-trade|on trade/i.test(n);
  });
  const offTradeSubs =
    offCandidates.length >= 3
      ? offCandidates
      : [
          "Supermarkets/Hypermarkets",
          "Convenience Stores",
          "Specialist Retailers",
          "Online Retail",
          "Other Off-trade Channels",
        ];
  const segmentNames = ["On-trade", "Off-trade"];
  return {
    segments: [
      { name: /trade|foodservice/i.test(onTrade) ? onTrade : "On-trade" },
      { name: "Off-trade", subSegments: offTradeSubs },
    ],
    lead: segmentNames.includes(lead) ? lead : "Off-trade",
    fast: segmentNames.includes(fast) ? fast : "On-trade",
  };
}

function b2bChannelHierarchy(subs, lead, fast) {
  const defaults = ["Direct / enterprise sales", "Channel partners & resellers", "E-commerce & marketplaces", "OEM / embedded", "Other"];
  const names = subs.length >= 3 ? subs : defaults;
  return {
    segments: names.map((name) => ({ name })),
    lead: names.includes(lead) ? lead : names[0],
    fast: names.includes(fast) ? fast : names[Math.min(1, names.length - 1)],
  };
}

function financeChannelHierarchy(subs, lead, fast) {
  const defaults = ["Branch network", "Mobile & web banking", "ATM network", "Partners & agents", "Embedded finance / APIs"];
  const names = subs.length >= 3 ? subs : defaults;
  return {
    segments: names.map((name) => ({ name })),
    lead: names.includes(lead) ? lead : names[0],
    fast: names.includes(fast) ? fast : names[1] || names[0],
  };
}

function healthcareChannelHierarchy(subs, lead, fast) {
  const defaults = ["Hospital systems", "Outpatient / ambulatory", "Retail pharmacy", "Home care", "Direct-to-consumer / telehealth"];
  const names = subs.length >= 3 ? subs : defaults;
  return {
    segments: names.map((name) => ({ name })),
    lead: names.includes(lead) ? lead : names[0],
    fast: names.includes(fast) ? fast : names[names.length - 1],
  };
}

/**
 * @param {{ dimension: string, subs?: string[], segments?: { name: string, subSegments?: string[] }[], lead: string, fast: string }} row
 * @param {{ domainId?: string }} [context]
 */
export function normalizeRowToHierarchy(row, context = {}) {
  const dimension = ensureByPrefix(row.dimension);
  const domainId = context.domainId || "";

  if (Array.isArray(row.segments) && row.segments.length) {
    const segments = row.segments.map((s) => ({
      name: s.name,
      ...(s.subSegments?.length ? { subSegments: [...s.subSegments] } : {}),
    }));
    const flat = flattenSegmentLeaves(segments);
    return {
      dimension,
      segments,
      lead: flat.includes(row.lead) || segments.some((s) => s.name === row.lead) ? row.lead : segments[0].name,
      fast: flat.includes(row.fast) || segments.some((s) => s.name === row.fast) ? row.fast : (segments[1]?.name || segments[0].name),
    };
  }

  const subs = Array.isArray(row.subs) ? row.subs : [];

  if (isChannelDimension(dimension)) {
    let built;
    if (domainId === "fnb" || domainId === "fmcg") {
      built = retailOnOffTradeHierarchy(subs, row.lead, row.fast);
    } else if (domainId === "consumer") {
      built = retailOnOffTradeHierarchy(subs, row.lead, row.fast);
    } else if (domainId === "finance") {
      built = financeChannelHierarchy(subs, row.lead, row.fast);
    } else if (domainId === "healthcare") {
      built = healthcareChannelHierarchy(subs, row.lead, row.fast);
    } else {
      built = b2bChannelHierarchy(subs, row.lead, row.fast);
    }
    return { dimension, ...built };
  }

  const segments = subs.map((name) => ({ name }));
  return {
    dimension,
    segments,
    lead: subs.includes(row.lead) ? row.lead : subs[0] || "Other",
    fast: subs.includes(row.fast) ? row.fast : subs[1] || subs[0] || "Other",
  };
}

export function flattenSegmentLeaves(segments) {
  const leaves = [];
  for (const seg of segments) {
    if (seg.subSegments?.length) {
      leaves.push(...seg.subSegments);
    } else {
      leaves.push(seg.name);
    }
  }
  return leaves;
}

export function buildSegmentationTableRows(hierarchies) {
  const rows = [];
  for (const h of hierarchies) {
    const category = h.dimension;
    for (const seg of h.segments) {
      if (seg.subSegments?.length) {
        for (const sub of seg.subSegments) {
          rows.push({ category, segment: seg.name, subSegment: sub });
        }
      } else {
        rows.push({ category, segment: seg.name, subSegment: "—" });
      }
    }
  }
  return rows;
}

export function scopeEntriesFromHierarchy(hierarchy) {
  return hierarchy.segments.map((seg) => {
    if (seg.subSegments?.length) {
      return `${seg.name} (${seg.subSegments.join(", ")})`;
    }
    return seg.name;
  });
}
