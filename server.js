// server.js - COMPLETE REPLACEMENT
// FunTV multi-source backend (safe, newbie-friendly)
// Notes:
// - Put your real stream URLs inside CHANNELS[].sources[].url
// - Keep sources legal/public or your own licensed sources.

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

// --- Vercel / local ---
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Serve static files (index.html, style.css, app.js, etc.)
app.use(express.static(path.join(__dirname), { extensions: ["html"] }));

/**
 * ============================
 * 1) CHANNEL DATA (EDIT HERE)
 * ============================
 * Each channel has multiple sources (fallback order by priority).
 *
 * IMPORTANT:
 * - Don't paste random "pirated IPTV" links here.
 * - Use public / official / licensed streams.
 */
const CHANNELS = [
  {
    id: "nasa-tv",
    name: "NASA TV (Public)",
    category: "news",
    logo: "https://www.nasa.gov/sites/default/files/thumbnails/image/nasa-logo-web-rgb.png",
    sources: [
      { source: "public", priority: 1, url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8" },
      // Add more official mirrors if you have them:
      // { source: "mirror", priority: 2, url: "https://..." },
    ],
  },
  {
    id: "dw-english",
    name: "DW English (Public)",
    category: "news",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Deutsche_Welle_Logo.svg",
    sources: [
      // Replace with a DW public stream you control/are allowed to use, if available in your region.
      // Keeping placeholder by default:
      { source: "placeholder", priority: 1, url: "" },
    ],
  },
  {
    id: "sample-music",
    name: "Sample Music Channel",
    category: "music",
    logo: "",
    sources: [
      { source: "placeholder", priority: 1, url: "" },
      { source: "backup", priority: 2, url: "" },
    ],
  },
];

/**
 * ============================
 * 2) SOURCE REGISTRY (LABELS)
 * ============================
 * This is what /api/sources returns.
 * Add any source names you use above (sources[].source).
 */
const SOURCE_REGISTRY = [
  { key: "public", name: "Public/Official Streams" },
  { key: "mirror", name: "Official Mirrors" },
  { key: "backup", name: "Backup Mirrors" },
  { key: "placeholder", name: "Not Configured Yet" },
];

// --- In-memory validation cache ---
const VALIDATION_TTL_MS = 1000 * 60 * 30; // 30 minutes
const validationCache = new Map(); // url -> { ok, ts, reason }
let validationInProgress = false;
let lastValidationSummary = {
  totalChannels: CHANNELS.length,
  validatedCount: 0,
  checkedSources: 0,
  lastRun: null,
};

// Basic URL check (best-effort)
async function validateUrl(url) {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return { ok: false, reason: "empty_url" };
  }

  const cached = validationCache.get(url);
  if (cached && Date.now() - cached.ts < VALIDATION_TTL_MS) return cached;

  try {
    // Use GET with small timeout (many HLS endpoints don't like HEAD)
    const res = await axios.get(url, {
      timeout: 6000,
      maxRedirects: 3,
      responseType: "text",
      validateStatus: () => true,
      headers: {
        "User-Agent": "FunTV-Validator/1.0",
        "Accept": "*/*",
      },
    });

    const ok = res.status >= 200 && res.status < 400;
    const result = { ok, ts: Date.now(), reason: ok ? "ok" : `http_${res.status}` };
    validationCache.set(url, result);
    return result;
  } catch (e) {
    const result = { ok: false, ts: Date.now(), reason: "timeout_or_network" };
    validationCache.set(url, result);
    return result;
  }
}

// Validate a limited number of sources (to avoid Vercel timeout)
async function validateSomeSources(limit = 80) {
  if (validationInProgress) return;
  validationInProgress = true;

  try {
    let checked = 0;
    let validatedChannels = 0;

    for (const ch of CHANNELS) {
      // Determine if the channel has at least one valid source
      let channelOk = false;

      // Sort by priority (lowest first)
      const sortedSources = [...(ch.sources || [])].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

      for (const s of sortedSources) {
        if (checked >= limit) break;
        checked += 1;

        const r = await validateUrl(s.url);
        if (r.ok) {
          channelOk = true;
          // Cache channel-level result via url cache only; channel is "verified" if any source ok
          break;
        }
      }

      if (channelOk) validatedChannels += 1;
      if (checked >= limit) break;
    }

    lastValidationSummary = {
      totalChannels: CHANNELS.length,
      validatedCount: validatedChannels,
      checkedSources: checked,
      lastRun: new Date().toISOString(),
    };
  } finally {
    validationInProgress = false;
  }
}

// Kick off validation shortly after cold start (non-blocking)
setTimeout(() => {
  validateSomeSources(80).catch(() => {});
}, 500);

/**
 * ============================
 * 3) HELPERS
 * ============================
 */
function normalizeCategory(cat) {
  return String(cat || "general").trim().toLowerCase();
}

function channelMatchesQuery(ch, category, search) {
  const okCat = !category || category === "all" ? true : normalizeCategory(ch.category) === normalizeCategory(category);
  const q = (search || "").trim().toLowerCase();
  const okSearch = !q ? true : String(ch.name || "").toLowerCase().includes(q);
  return okCat && okSearch;
}

function pickBestSource(ch) {
  const sources = [...(ch.sources || [])].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  // return first non-empty url; "verified" logic is separate
  return sources.find(s => s.url && String(s.url).trim() !== "") || null;
}

async function isChannelVerified(ch) {
  // Verified if ANY source validates ok
  const sources = [...(ch.sources || [])].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  for (const s of sources) {
    const r = await validateUrl(s.url);
    if (r.ok) return true;
  }
  return false;
}

/**
 * ============================
 * 4) API ROUTES
 * ============================
 */

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Categories
app.get("/api/categories", async (req, res) => {
  const validated = String(req.query.validated || "false") === "true";

  let list = CHANNELS;
  if (validated) {
    // Filter by verified channels
    const verified = [];
    for (const ch of CHANNELS) {
      if (await isChannelVerified(ch)) verified.push(ch);
    }
    list = verified;
  }

  const cats = Array.from(new Set(list.map(c => normalizeCategory(c.category)))).sort();
  res.json(cats);
});

// Sources + stats (for your header “x/y sources active”)
app.get("/api/sources", async (req, res) => {
  // A "source" is considered active if at least one URL under that source validates OK.
  const stats = {};
  for (const s of SOURCE_REGISTRY) {
    stats[s.key] = { status: "unknown", okCount: 0, checked: 0 };
  }

  // Check a limited number of urls across all channels for speed
  const urlsToCheck = [];
  for (const ch of CHANNELS) {
    for (const src of ch.sources || []) {
      if (src.url && String(src.url).trim() !== "") {
        urlsToCheck.push({ key: src.source, url: src.url });
      }
    }
  }

  const maxChecks = Math.min(urlsToCheck.length, 60);
  for (let i = 0; i < maxChecks; i++) {
    const { key, url } = urlsToCheck[i];
    if (!stats[key]) stats[key] = { status: "unknown", okCount: 0, checked: 0 };
    const r = await validateUrl(url);
    stats[key].checked += 1;
    if (r.ok) stats[key].okCount += 1;
  }

  const sources = SOURCE_REGISTRY.map(s => {
    const st = stats[s.key] || { okCount: 0, checked: 0 };
    const status = st.okCount > 0 ? "success" : (st.checked > 0 ? "fail" : "unknown");
    return { key: s.key, name: s.name, stats: { status, okCount: st.okCount, checked: st.checked } };
  });

  res.json({ sources });
});

// Validation status (your UI polls this)
app.get("/api/validation-status", (req, res) => {
  res.json({
    validationInProgress,
    totalChannels: lastValidationSummary.totalChannels,
    validatedCount: lastValidationSummary.validatedCount,
    checkedSources: lastValidationSummary.checkedSources,
    lastRun: lastValidationSummary.lastRun,
  });
});

// Channels list
app.get("/api/channels", async (req, res) => {
  const category = req.query.category || "all";
  const search = req.query.search || "";
  const validatedOnly = String(req.query.validated || "false") === "true";

  // Filter server-side
  let list = CHANNELS.filter(ch => channelMatchesQuery(ch, category, search));

  if (validatedOnly) {
    const verified = [];
    for (const ch of list) {
      if (await isChannelVerified(ch)) verified.push(ch);
    }
    list = verified;
  }

  // Transform for frontend (single url + source label)
  const output = list.map(ch => {
    const best = pickBestSource(ch);
    return {
      id: ch.id,
      name: ch.name,
      category: normalizeCategory(ch.category),
      logo: ch.logo || "",
      url: best?.url || "",
      source: best?.source || "",
    };
  });

  res.json({ channels: output });
});

// Alternatives for a channel (used by your app.js fallback)
app.get("/api/channel/:id/alternatives", (req, res) => {
  const id = req.params.id;
  const ch = CHANNELS.find(c => c.id === id);
  if (!ch) return res.status(404).json({ alternatives: [] });

  const sorted = [...(ch.sources || [])].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  // Return all non-empty URLs as alternatives (frontend will try in order)
  const alternatives = sorted
    .filter(s => s.url && String(s.url).trim() !== "")
    .map(s => ({
      id: ch.id,
      name: ch.name,
      category: normalizeCategory(ch.category),
      logo: ch.logo || "",
      url: s.url,
      source: s.source,
    }));

  res.json({ alternatives });
});

// Fallback: serve index.html for non-api routes (SPA-ish)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`FunTV server running on port ${PORT}`);
});
