/**
 * Server AI for /generate sample reports — Groq → Gemini → NVIDIA.
 */
import { buildGenerateReportPrompt } from "./generateReportPrompt.js";
import { generateWithFallback, getKeys, hasAnyKey } from "./aiProviders.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sendJsonRes(res, body, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function runGenerateReport(body) {
  const keys = getKeys();
  if (!hasAnyKey(keys)) {
    return {
      status: 503,
      body: {
        error: "AI not configured on server. Add GROQ_API_KEY to Vercel/Netlify and redeploy.",
        code: "not_configured",
      },
    };
  }

  const industry = String(body.industry || "").trim();
  if (!industry) {
    return { status: 400, body: { error: "industry is required" } };
  }

  const baseYear = Number(body.baseYear) || 2025;
  const forecastEndYear = Number(body.forecastEndYear) || 2031;
  const geographies =
    Array.isArray(body.geographies) && body.geographies.length
      ? body.geographies
      : ["North America", "Europe", "Asia-Pacific"];
  const dimensions =
    Array.isArray(body.dimensions) && body.dimensions.length
      ? body.dimensions
      : ["Product Type", "Ingredient / Component", "Form", "Distribution Channel"];
  const audience = body.audience || "Enterprises";

  const prompt = buildGenerateReportPrompt({
    industry,
    baseYear,
    forecastEndYear,
    geographies,
    dimensions,
    audience,
  });

  const result = await generateWithFallback(prompt, keys, {
    maxTokens: 4096,
    temperature: 0.2,
  });

  return {
    status: 200,
    body: {
      report: result.data,
      provider: result.provider,
      usedFallback: result.usedFallback,
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function handleGenerateReportRequest(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  try {
    const { status, body: payload } = await runGenerateReport(body);
    return jsonResponse(payload, status);
  } catch (err) {
    const message = err?.message || "Report generation failed";
    const isQuota = message.includes("rate limit") || message.includes("quota");
    return jsonResponse(
      { error: message, code: isQuota ? "quota_exceeded" : "provider_error" },
      isQuota ? 429 : 500,
    );
  }
}

function readReqBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body != null && req.body !== "") {
      resolve(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
      return;
    }
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Vercel Node.js */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJsonRes(res, { error: "Method not allowed" }, 405);
    return;
  }

  try {
    const raw = await readReqBody(req);
    const body = raw ? JSON.parse(raw) : {};
    const { status, body: payload } = await runGenerateReport(body);
    sendJsonRes(res, payload, status);
  } catch (err) {
    const message = err?.message || "Report generation failed";
    const isQuota = message.includes("rate limit") || message.includes("quota");
    sendJsonRes(
      res,
      { error: message, code: isQuota ? "quota_exceeded" : "provider_error" },
      isQuota ? 429 : 500,
    );
  }
}
