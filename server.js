const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   GLOBAL STATE
================================ */
let channels = [];
let validatedChannels = [];
let channelAlternatives = new Map();
let validationInProgress = false;
let sourceStats = {};
let channelsLoaded = false;

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");

/* Force correct static serving */
app.use(express.static(PUBLIC_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

/* ===============================
   SOURCES (BIG LIST)
================================ */
const STREAMING_SOURCES = [
  // IPTV-ORG
  { name: "IPTV Main", url: "https://iptv-org.github.io/iptv/index.m3u", type: "iptv" },
  { name: "IPTV India", url: "https://iptv-org.github.io/iptv/countries/in.m3u", type: "iptv" },
  { name: "IPTV USA", url: "https://iptv-org.github.io/iptv/countries/us.m3u", type: "iptv" },
  { name: "IPTV UK", url: "https://iptv-org.github.io/iptv/countries/gb.m3u", type: "iptv" },
  { name: "IPTV Canada", url: "https://iptv-org.github.io/iptv/countries/ca.m3u", type: "iptv" },
  { name: "IPTV Sports", url: "https://iptv-org.github.io/iptv/categories/sports.m3u", type: "iptv" },
  { name: "IPTV Movies", url: "https://iptv-org.github.io/iptv/categories/movies.m3u", type: "iptv" },
  { name: "IPTV News", url: "https://iptv-org.github.io/iptv/categories/news.m3u", type: "iptv" },

  // Free-TV
  { name: "Free-TV", url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8", type: "iptv" },

  // YouTube streams
  { name: "YouTube IPTV", url: "https://raw.githubusercontent.com/benmoose39/YouTube_to_m3u/main/youtube.m3u", type: "webtv" },

  // RADIO
  { name: "Radio Top", url: "https://de1.api.radio-browser.info/m3u/stations/topvote/300", type: "radio" },
  { name: "Radio Popular", url: "https://de1.api.radio-browser.info/m3u/stations/topclick/300", type: "radio" },
  { name: "Radio Recent", url: "https://de1.api.radio-browser.info/m3u/stations/lastchange/300", type: "radio" }
];

/* ===============================
   M3U PARSER
================================ */
function parseM3U(content, sourceName, sourceType) {
  const lines = content.split("\n");
  const parsed = [];
  let current = {};

  for (const lineRaw of lines) {
    const line = lineRaw.trim();

    if (line.startsWith("#EXTINF")) {
      const name = line.split(",").pop()?.trim() || "Unknown";
      const logo = (line.match(/tvg-logo="([^"]+)"/) || [])[1] || "";
      const group = (line.match(/group-title="([^"]+)"/) || [])[1] || "General";

      current = { name, logo, category: group, source: sourceName, type: sourceType };
    } else if (line.startsWith("http")) {
      current.url = line;
      current.id = `${sourceName}_${parsed.length}`;
      parsed.push({ ...current });
      current = {};
    }
  }
  return parsed;
}

/* ===============================
   LOAD CHANNELS
================================ */
async function loadChannels() {
  console.log("Loading sources...");
  channels = [];
  sourceStats = {};
  channelAlternatives.clear();

  for (const src of STREAMING_SOURCES) {
    try {
      const res = await axios.get(src.url, { timeout: 30000 });
      const parsed = parseM3U(res.data, src.name, src.type);
      channels.push(...parsed);
      sourceStats[src.name] = { status: "success", count: parsed.length };
      console.log(`✓ ${src.name}: ${parsed.length}`);
    } catch (e) {
      sourceStats[src.name] = { status: "failed", error: e.message };
      console.warn(`✗ ${src.name}`);
    }
  }

  // Group duplicates
  const map = new Map();
  channels.forEach(ch => {
    const key = ch.name.toLowerCase().replace(/[^\w]/g, "");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ch);
  });

  const unique = [];
  map.forEach(list => {
    unique.push(list[0]);
    if (list.length > 1) {
      channelAlternatives.set(list[0].id, list.slice(1));
    }
  });

  channels = unique;
  channelsLoaded = true;
  console.log(`Total unique channels: ${channels.length}`);
}

/* ===============================
   API ROUTES
================================ */
app.get("/api/channels", async (req, res) => {
  if (!channelsLoaded) await loadChannels();

  let result = channels;

  if (req.query.category) {
    result = result.filter(c => c.category === req.query.category);
  }
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    result = result.filter(c => c.name.toLowerCase().includes(q));
  }

  res.json({ channels: result });
});

app.get("/api/categories", async (req, res) => {
  if (!channelsLoaded) await loadChannels();
  const cats = [...new Set(channels.map(c => c.category))].sort();
  res.json(cats);
});

app.get("/api/channel/:id/alternatives", (req, res) => {
  const alts = channelAlternatives.get(req.params.id) || [];
  res.json({ alternatives: alts });
});

app.get("/api/sources", (req, res) => {
  res.json({ sources: sourceStats });
});

/* ===============================
   START
================================ */
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
