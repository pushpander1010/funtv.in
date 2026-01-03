const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs").promises;

const app = express();

// Vercel serverless: do NOT rely on PORT in production.
// Locally, you can still run with PORT.
const PORT = process.env.PORT || 3000;

// ---------------------------
// State
// ---------------------------
let channels = [];
let validatedChannels = [];
let channelAlternatives = new Map();
let validationInProgress = false;
let sourceStats = {};
let channelsLoaded = false;

// ---------------------------
// Middleware
// ---------------------------
app.use(cors());
app.use(express.json());

// Always resolve an absolute path to /public
const PUBLIC_DIR = path.join(__dirname, "public");

// Hard-serve CSS/JS with correct content-type + no-cache (prevents Vercel routing quirks)
function noCache(res) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

// Explicit static file routes (these eliminate “CSS request returns HTML” problems)
app.get("/style.css", (req, res) => {
  noCache(res);
  res.type("text/css");
  res.sendFile(path.join(PUBLIC_DIR, "style.css"));
});

app.get("/app.js", (req, res) => {
  noCache(res);
  res.type("application/javascript");
  res.sendFile(path.join(PUBLIC_DIR, "app.js"));
});

// Serve all other static files (images, manifest, etc.)
app.use(
  express.static(PUBLIC_DIR, {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      // Optional: keep no-cache for html/css/js while debugging
      if (filePath.endsWith(".html") || filePath.endsWith(".css") || filePath.endsWith(".js")) {
        noCache(res);
      }
    }
  })
);

// Favicon fallbacks (optional but keeps your logs clean)
app.get("/favicon.ico", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "favicon.ico")));
app.get("/apple-touch-icon.png", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "favicon.ico")));
app.get("/favicon-32x32.png", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "favicon.ico")));
app.get("/favicon-16x16.png", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "favicon.ico")));

// ---------------------------
// Cache load/save
// ---------------------------
async function loadChannelsFromCache() {
  try {
    const cachePath = path.join(__dirname, "channels-cache.json");
    const cacheData = await fs.readFile(cachePath, "utf8");
    const cached = JSON.parse(cacheData);

    channels = cached.channels || [];
    validatedChannels = cached.validatedChannels || [];
    channelAlternatives = new Map(cached.channelAlternatives || []);
    sourceStats = cached.sourceStats || {};

    console.log(`Loaded ${channels.length} channels from cache`);
    channelsLoaded = true;
    return true;
  } catch (error) {
    console.log("No cache file found, will load from sources");
    return false;
  }
}

async function saveChannelsToCache() {
  try {
    const cachePath = path.join(__dirname, "channels-cache.json");
    const cacheData = {
      timestamp: new Date().toISOString(),
      channels,
      validatedChannels,
      channelAlternatives: Array.from(channelAlternatives.entries()),
      sourceStats
    };

    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    console.log(`Saved ${channels.length} channels to cache`);
  } catch (error) {
    console.error("Error saving channels to cache:", error.message);
  }
}

// ---------------------------
// Sources
// ---------------------------
const STREAMING_SOURCES = [
  { name: "IPTV-org Main", url: "https://iptv-org.github.io/iptv/index.m3u", type: "iptv", priority: 1 },
  { name: "IPTV-org Countries", url: "https://iptv-org.github.io/iptv/countries/us.m3u", type: "iptv", priority: 2 },
  { name: "IPTV-org News", url: "https://iptv-org.github.io/iptv/categories/news.m3u", type: "iptv", priority: 3 },
  { name: "IPTV-org Sports", url: "https://iptv-org.github.io/iptv/categories/sports.m3u", type: "iptv", priority: 4 },
  { name: "IPTV-org Entertainment", url: "https://iptv-org.github.io/iptv/categories/entertainment.m3u", type: "iptv", priority: 5 },
  { name: "IPTV-org Movies", url: "https://iptv-org.github.io/iptv/categories/movies.m3u", type: "iptv", priority: 6 },

  { name: "Free-TV Main", url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8", type: "iptv", priority: 7 },
  { name: "IPTV-org UK", url: "https://iptv-org.github.io/iptv/countries/uk.m3u", type: "iptv", priority: 8 },
  { name: "IPTV-org IN", url: "https://iptv-org.github.io/iptv/countries/in.m3u", type: "iptv", priority: 9 },
  { name: "IPTV-org CA", url: "https://iptv-org.github.io/iptv/countries/ca.m3u", type: "iptv", priority: 10 },
  { name: "IPTV-org AU", url: "https://iptv-org.github.io/iptv/countries/au.m3u", type: "iptv", priority: 11 },

  { name: "YouTube TV Collection", url: "https://raw.githubusercontent.com/benmoose39/YouTube_to_m3u/main/youtube.m3u", type: "webtv", priority: 17 },

  { name: "Radio Browser Top", url: "https://de1.api.radio-browser.info/m3u/stations/topvote/200", type: "radio", priority: 20 },
  { name: "Radio Browser Popular", url: "https://de1.api.radio-browser.info/m3u/stations/topclick/200", type: "radio", priority: 21 },
  { name: "Radio Browser Recent", url: "https://de1.api.radio-browser.info/m3u/stations/lastchange/200", type: "radio", priority: 22 }
];

// ---------------------------
// M3U parsing
// ---------------------------
function parseM3U(content, sourceName, sourceType) {
  const lines = content.split("\n");
  const result = [];
  let current = {};

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || "").trim();

    if (line.startsWith("#EXTINF:")) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);

      let category = "General";
      if (groupMatch && groupMatch[1]) {
        category = groupMatch[1];
      } else {
        switch (sourceType) {
          case "radio":
            category = "Radio";
            break;
          case "webtv":
            category = "Web TV";
            break;
          default:
            category = "Live TV";
            break;
        }
      }

      current = {
        name: nameMatch ? nameMatch[1].trim() : "Unknown Channel",
        logo: logoMatch ? logoMatch[1] : "",
        category,
        source: sourceName,
        type: sourceType
      };
    } else if (line && !line.startsWith("#") && current.name) {
      if (line.startsWith("http")) {
        current.url = line;
        current.id = `${sourceName}_${result.length}`;
        result.push({ ...current });
      }
      current = {};
    }
  }

  return result;
}

// ---------------------------
// Load channels from sources
// ---------------------------
async function loadChannelsFromSources() {
  console.log("Loading channels from multiple streaming sources...");
  let allChannels = [];
  sourceStats = {};
  channelAlternatives.clear();

  async function fetchWithRetry(source, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fetching ${source.type.toUpperCase()} from ${source.name}... (attempt ${attempt}/${maxRetries})`);

        const response = await axios.get(source.url, {
          timeout: 30000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "text/plain, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache"
          }
        });

        const sourceChannels = parseM3U(response.data, source.name, source.type);
        allChannels.push(...sourceChannels);

        sourceStats[source.name] = { channels: sourceChannels.length, status: "success", type: source.type, attempts: attempt };
        console.log(`✓ ${source.name}: ${sourceChannels.length} channels`);
        return true;
      } catch (error) {
        console.warn(`✗ ${source.name} attempt ${attempt}/${maxRetries}: ${error.message}`);
        if (attempt === maxRetries) {
          sourceStats[source.name] = { channels: 0, status: "failed", error: error.message, type: source.type, attempts: attempt };
          return false;
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  const concurrencyLimit = 5;
  for (let i = 0; i < STREAMING_SOURCES.length; i += concurrencyLimit) {
    const batch = STREAMING_SOURCES.slice(i, i + concurrencyLimit);
    await Promise.all(batch.map((source) => fetchWithRetry(source)));
  }

  // Group alternatives
  const channelGroups = new Map();
  for (const channel of allChannels) {
    const normalizedName = (channel.name || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!channelGroups.has(normalizedName)) channelGroups.set(normalizedName, []);
    channelGroups.get(normalizedName).push(channel);
  }

  const uniqueChannels = [];
  for (const [, alternatives] of channelGroups) {
    if (alternatives.length > 0) {
      const primary = alternatives[0];
      primary.id = uniqueChannels.length;
      uniqueChannels.push(primary);

      if (alternatives.length > 1) {
        channelAlternatives.set(primary.id, alternatives.slice(1));
      }
    }
  }

  console.log(`Total channels loaded: ${allChannels.length}`);
  console.log(`Unique channels after grouping: ${uniqueChannels.length}`);
  return uniqueChannels;
}

// ---------------------------
// Stream validation
// ---------------------------
async function validateStream(url, channelType = "iptv", timeout = 12000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response;
    try {
      response = await axios.head(url, {
        timeout,
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: channelType === "radio" ? "audio/*" : "video/*,application/*"
        },
        maxRedirects: 5
      });
    } catch {
      response = await axios.get(url, {
        timeout: Math.floor(timeout / 2),
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Range: "bytes=0-2048"
        },
        maxRedirects: 5
      });
    }

    clearTimeout(timeoutId);

    const contentType = response.headers["content-type"] || "";
    const contentLength = response.headers["content-length"];
    const isValidStatus = response.status === 200 || response.status === 206;

    let hasValidContentType = false;
    if (channelType === "radio") {
      hasValidContentType =
        contentType.includes("audio/") ||
        contentType.includes("application/ogg") ||
        url.includes(".mp3") ||
        url.includes(".aac") ||
        url.includes("radio");
    } else {
      hasValidContentType =
        contentType.includes("video/") ||
        contentType.includes("application/vnd.apple.mpegurl") ||
        contentType.includes("application/x-mpegURL") ||
        contentType.includes("application/dash+xml") ||
        contentType.includes("application/octet-stream") ||
        url.includes(".m3u8") ||
        url.includes(".ts") ||
        url.includes("playlist");
    }

    const hasReasonableSize = !contentLength || parseInt(contentLength, 10) > 100;
    return isValidStatus && (hasValidContentType || hasReasonableSize);
  } catch {
    return false;
  }
}

function getSourceBreakdown() {
  const breakdown = {};
  validatedChannels.forEach((channel) => {
    breakdown[channel.source] = (breakdown[channel.source] || 0) + 1;
  });
  return breakdown;
}

async function validateChannels() {
  if (validationInProgress) return;
  validationInProgress = true;
  validatedChannels = [];

  console.log(`Starting validation of ${channels.length} channels...`);

  const sortedChannels = [...channels].sort((a, b) => {
    const aPriority = STREAMING_SOURCES.find((s) => s.name === a.source)?.priority || 999;
    const bPriority = STREAMING_SOURCES.find((s) => s.name === b.source)?.priority || 999;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (a.type || "").localeCompare(b.type || "");
  });

  const batchSize = 25;
  const maxChannels = 800;
  const toValidate = sortedChannels.slice(0, maxChannels);

  for (let i = 0; i < toValidate.length; i += batchSize) {
    const batch = toValidate.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (channel) => {
        const ok = await validateStream(channel.url, channel.type);
        return ok ? channel : null;
      })
    );

    const valid = results.filter(Boolean);
    validatedChannels.push(...valid);

    console.log(
      `Validated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toValidate.length / batchSize)}: ${valid.length}/${batch.length} working`
    );

    await new Promise((r) => setTimeout(r, 50));
  }

  console.log(`Validation complete: ${validatedChannels.length} working channels found`);
  console.log("Source breakdown:", getSourceBreakdown());
  validationInProgress = false;
}

// ---------------------------
// Load channels (cache first)
// ---------------------------
async function loadChannels() {
  try {
    const cacheLoaded = await loadChannelsFromCache();

    if (!cacheLoaded) {
      channels = await loadChannelsFromSources();
      await saveChannelsToCache();
    }

    channelsLoaded = true;
    console.log("Channels loaded successfully");
  } catch (error) {
    console.error("Error loading channels:", error.message);
    await loadChannelsFromCache();
  }
}

// In serverless, timeouts are unreliable; still keep it, but do not depend on it.
function startValidationAfterDeployment() {
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL;
  const delay = isProduction ? 120000 : 30000;

  console.log(`Validation scheduled in ${delay / 1000}s`);
  setTimeout(async () => {
    try {
      if (channelsLoaded && validatedChannels.length === 0 && !validationInProgress) {
        console.log("Starting channel validation (post-deployment)...");
        await validateChannels();
      }
    } catch (e) {
      console.error("Error starting validation:", e.message);
    }
  }, delay);
}

// ---------------------------
// API routes
// ---------------------------
app.get("/api/channels", (req, res) => {
  const { category, search, validated } = req.query;

  const sourceChannels = validated === "true" && validatedChannels.length > 0 ? validatedChannels : channels;
  let filtered = [...sourceChannels];

  if (category && category !== "all") {
    filtered = filtered.filter((ch) => ch.category && ch.category.toLowerCase().includes(String(category).toLowerCase()));
  }

  if (search) {
    filtered = filtered.filter((ch) => ch.name && ch.name.toLowerCase().includes(String(search).toLowerCase()));
  }

  const channelsWithAlternatives = filtered.map((channel) => ({
    ...channel,
    alternativesCount: channelAlternatives.has(channel.id) ? channelAlternatives.get(channel.id).length : 0
  }));

  res.json({
    channels: channelsWithAlternatives.slice(0, 100),
    total: filtered.length,
    validatedCount: validatedChannels.length,
    totalChannels: channels.length,
    validationInProgress,
    alternativesAvailable: channelAlternatives.size
  });
});

app.get("/api/channel/:id/alternatives", (req, res) => {
  const channelId = parseInt(req.params.id, 10);
  const alternatives = channelAlternatives.get(channelId) || [];
  res.json({
    channelId,
    alternatives: alternatives.map((alt, index) => ({ ...alt, alternativeIndex: index }))
  });
});

app.get("/api/categories", (req, res) => {
  const { validated } = req.query;
  const sourceChannels = validated === "true" && validatedChannels.length > 0 ? validatedChannels : channels;
  const categories = [...new Set(sourceChannels.map((ch) => ch.category))].sort();
  res.json(categories);
});

app.get("/api/health", (req, res) => {
  const totalSources = STREAMING_SOURCES.length;
  const failedSources = Object.values(sourceStats).filter((stat) => stat.status === "failed").length;
  const successfulSources = Object.values(sourceStats).filter((stat) => stat.status === "success").length;

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
    channels: {
      total: channels.length,
      validated: validatedChannels.length,
      validationInProgress
    },
    sources: {
      total: totalSources,
      successful: successfulSources,
      failed: failedSources,
      successRate: totalSources > 0 ? Math.round((successfulSources / totalSources) * 100) : 0
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get("/api/validation-status", (req, res) => {
  res.json({
    validatedCount: validatedChannels.length,
    totalChannels: channels.length,
    validationInProgress,
    sourceStats,
    sourceBreakdown: getSourceBreakdown()
  });
});

app.post("/api/validation/start", async (req, res) => {
  try {
    if (validationInProgress) {
      return res.json({
        status: "already_running",
        message: "Validation is already in progress",
        validatedCount: validatedChannels.length,
        totalChannels: channels.length
      });
    }

    if (validatedChannels.length > 0) {
      return res.json({
        status: "already_validated",
        message: "Channels are already validated",
        validatedCount: validatedChannels.length,
        totalChannels: channels.length
      });
    }

    validateChannels();
    res.json({
      status: "started",
      message: "Validation started successfully",
      validatedCount: validatedChannels.length,
      totalChannels: channels.length
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/api/sources", (req, res) => {
  res.json({
    sources: STREAMING_SOURCES.map((source) => ({
      name: source.name,
      type: source.type,
      priority: source.priority,
      stats: sourceStats[source.name] || { channels: 0, status: "pending", type: source.type }
    }))
  });
});

// ---------------------------
// Page routes
// ---------------------------
// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// Catch-all: any non-API route returns index.html (important for Vercel + SPA)
app.get("*", (req, res) => {
  // Do not swallow API routes
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  return res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// ---------------------------
// Init
// ---------------------------
loadChannels().then(() => {
  // Best effort; do not depend on this in Vercel
  startValidationAfterDeployment();
});

// ---------------------------
// Local dev only
// ---------------------------
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`StreamVerse running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

// Vercel serverless export
module.exports = app;
