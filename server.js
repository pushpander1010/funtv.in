const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static site files from project root
app.use(express.static(__dirname));

// -----------------------
// EDIT YOUR CHANNELS HERE
// -----------------------
const CHANNELS = [
  {
    id: "nasa-tv",
    name: "NASA TV (Public)",
    category: "news",
    logo: "https://www.nasa.gov/sites/default/files/thumbnails/image/nasa-logo-web-rgb.png",
    sources: [
      { source: "public", priority: 1, url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8" }
    ]
  }
];

// ---------- Helpers ----------
const norm = (s) => String(s || "general").trim().toLowerCase();

function pickBestSource(ch) {
  const sorted = [...(ch.sources || [])].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  return sorted.find(s => s.url && String(s.url).trim() !== "") || null;
}

// ---------- API ----------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get("/api/categories", (req, res) => {
  const cats = Array.from(new Set(CHANNELS.map(c => norm(c.category)))).sort();
  res.json(cats);
});

app.get("/api/sources", (req, res) => {
  // Minimal stats so UI doesn't break
  res.json({
    sources: [
      { key: "public", name: "Public/Official Streams", stats: { status: "success" } },
      { key: "backup", name: "Backup Mirrors", stats: { status: "unknown" } }
    ]
  });
});

app.get("/api/validation-status", (req, res) => {
  // Keep it simple: treat all as available (your UI just needs fields)
  res.json({
    validationInProgress: false,
    totalChannels: CHANNELS.length,
    validatedCount: CHANNELS.length
  });
});

app.get("/api/channels", (req, res) => {
  const category = req.query.category || "all";
  const search = (req.query.search || "").trim().toLowerCase();

  let list = CHANNELS.filter(ch => {
    const okCat = category === "all" ? true : norm(ch.category) === norm(category);
    const okSearch = !search ? true : String(ch.name || "").toLowerCase().includes(search);
    return okCat && okSearch;
  });

  const out = list.map(ch => {
    const best = pickBestSource(ch);
    return {
      id: ch.id,
      name: ch.name,
      category: norm(ch.category),
      logo: ch.logo || "",
      url: best?.url || "",
      source: best?.source || ""
    };
  });

  res.json({ channels: out });
});

app.get("/api/channel/:id/alternatives", (req, res) => {
  const ch = CHANNELS.find(c => c.id === req.params.id);
  if (!ch) return res.status(404).json({ alternatives: [] });

  const sorted = [...(ch.sources || [])].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  const alternatives = sorted
    .filter(s => s.url && String(s.url).trim() !== "")
    .map(s => ({
      id: ch.id,
      name: ch.name,
      category: norm(ch.category),
      logo: ch.logo || "",
      url: s.url,
      source: s.source
    }));

  res.json({ alternatives });
});

// ---------- Site fallback ----------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Local dev only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log("Server running on", PORT));
}

// Vercel serverless export
module.exports = app;
