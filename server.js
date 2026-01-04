const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

const app = express();

// Vercel serverless: do NOT rely on PORT in production.
// Locally, you can still run with PORT.
const PORT = process.env.PORT || 3000;

// ---------------------------
// State
// ---------------------------
let channels = [];
let channelAlternatives = new Map();
let sourceStats = {};
let channelsLoaded = false;
const insecureStreamMap = new Map();
let channelTagCache = new WeakMap();

const COUNTRY_NAMES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Cote d'Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
  "Hong Kong",
  "Macau",
  "Puerto Rico"
];

const EXTRA_COUNTRY_TOKENS = [
  "usa",
  "us",
  "u.s.",
  "u.s.a.",
  "uk",
  "u.k.",
  "uae",
  "u.a.e.",
  "ksa",
  "england",
  "scotland",
  "wales",
  "northern ireland",
  "trinidad",
  "czechia"
];

const COUNTRY_NAME_SET = new Set([...COUNTRY_NAMES.map((name) => name.toLowerCase()), ...EXTRA_COUNTRY_TOKENS]);

function resetChannelTagCache() {
  channelTagCache = new WeakMap();
}

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase();
}

function isCountryToken(value) {
  const normalized = normalizeToken(value);
  if (!normalized) return false;
  return COUNTRY_NAME_SET.has(normalized);
}

function getChannelTagBuckets(channel) {
  if (channelTagCache.has(channel)) {
    return channelTagCache.get(channel);
  }

  const raw = String(channel?.category || "");
  const tokens = raw
    .split(";")
    .map((token) => token.trim())
    .filter(Boolean);

  const seenCategories = new Set();
  const seenCountries = new Set();
  const categories = [];
  const countries = [];

  tokens.forEach((token) => {
    const normalized = token.toLowerCase();
    if (isCountryToken(token)) {
      if (!seenCountries.has(normalized)) {
        countries.push(token);
        seenCountries.add(normalized);
      }
    } else if (!seenCategories.has(normalized)) {
      categories.push(token);
      seenCategories.add(normalized);
    }
  });

  const buckets = { categories, countries };
  channelTagCache.set(channel, buckets);
  return buckets;
}

function collectFilterOptions(list) {
  const categoryMap = new Map();
  const countryMap = new Map();

  list.forEach((channel) => {
    const { categories, countries } = getChannelTagBuckets(channel);
    categories.forEach((category) => {
      const normalized = category.toLowerCase();
      if (!categoryMap.has(normalized)) categoryMap.set(normalized, category);
    });
    countries.forEach((country) => {
      const normalized = country.toLowerCase();
      if (!countryMap.has(normalized)) countryMap.set(normalized, country);
    });
  });

  return {
    categories: Array.from(categoryMap.values()).sort((a, b) => a.localeCompare(b)),
    countries: Array.from(countryMap.values()).sort((a, b) => a.localeCompare(b))
  };
}

// ---------------------------
// Middleware
// ---------------------------
app.use(cors());
app.use(express.json());

// In this repo, static files live at the project root (index.html, style.css, app.js, etc.)
// Do NOT point to a non-existent /public folder, or Vercel will return 404/HTML for CSS/JS.
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

// Serve all other static files (images, manifest, sitemap, robots, etc.)
app.use(
  express.static(PUBLIC_DIR, {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html") || filePath.endsWith(".css") || filePath.endsWith(".js")) {
        noCache(res);
      }
    }
  })
);

// ---------------------------
// Cache load/save
// ---------------------------
async function loadChannelsFromCache() {
  try {
    const cachePath = path.join(__dirname, "channels-cache.json");
    const cacheData = await fs.readFile(cachePath, "utf8");
    const cached = JSON.parse(cacheData);

    channels = cached.channels || [];
    resetChannelTagCache();
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
// Sources (expanded)
// ---------------------------
const STREAMING_SOURCES = [
  // IPTV-ORG (broad, generally stable)
  { name: "IPTV-org Main", url: "https://iptv-org.github.io/iptv/index.m3u", type: "iptv", priority: 1 },
  { name: "IPTV-org News", url: "https://iptv-org.github.io/iptv/categories/news.m3u", type: "iptv", priority: 2 },
  { name: "IPTV-org Sports", url: "https://iptv-org.github.io/iptv/categories/sports.m3u", type: "iptv", priority: 3 },
  { name: "IPTV-org Movies", url: "https://iptv-org.github.io/iptv/categories/movies.m3u", type: "iptv", priority: 4 },
  { name: "IPTV-org Entertainment", url: "https://iptv-org.github.io/iptv/categories/entertainment.m3u", type: "iptv", priority: 5 },
  { name: "IPTV-org Music", url: "https://iptv-org.github.io/iptv/categories/music.m3u", type: "iptv", priority: 6 },
  { name: "IPTV-org Kids", url: "https://iptv-org.github.io/iptv/categories/kids.m3u", type: "iptv", priority: 7 },
  { name: "IPTV-org Documentary", url: "https://iptv-org.github.io/iptv/categories/documentary.m3u", type: "iptv", priority: 8 },
  { name: "IPTV-org Lifestyle", url: "https://iptv-org.github.io/iptv/categories/lifestyle.m3u", type: "iptv", priority: 9 },
  { name: "IPTV-org Classic", url: "https://iptv-org.github.io/iptv/categories/classic.m3u", type: "iptv", priority: 10 },

  // Countries / regions that typically add lots of variety
  { name: "IPTV-org US", url: "https://iptv-org.github.io/iptv/countries/us.m3u", type: "iptv", priority: 11 },
  { name: "IPTV-org IN", url: "https://iptv-org.github.io/iptv/countries/in.m3u", type: "iptv", priority: 12 },
  { name: "IPTV-org UK", url: "https://iptv-org.github.io/iptv/countries/gb.m3u", type: "iptv", priority: 13 },
  { name: "IPTV-org CA", url: "https://iptv-org.github.io/iptv/countries/ca.m3u", type: "iptv", priority: 14 },
  { name: "IPTV-org AU", url: "https://iptv-org.github.io/iptv/countries/au.m3u", type: "iptv", priority: 15 },
  { name: "IPTV-org AE", url: "https://iptv-org.github.io/iptv/countries/ae.m3u", type: "iptv", priority: 16 },
  { name: "IPTV-org SA", url: "https://iptv-org.github.io/iptv/countries/sa.m3u", type: "iptv", priority: 17 },
  { name: "IPTV-org DE", url: "https://iptv-org.github.io/iptv/countries/de.m3u", type: "iptv", priority: 18 },
  { name: "IPTV-org FR", url: "https://iptv-org.github.io/iptv/countries/fr.m3u", type: "iptv", priority: 19 },
  { name: "IPTV-org ES", url: "https://iptv-org.github.io/iptv/countries/es.m3u", type: "iptv", priority: 20 },

  // Language packs (helps with Hindi/English discovery)
  { name: "IPTV-org Hindi", url: "https://iptv-org.github.io/iptv/languages/hin.m3u", type: "iptv", priority: 21 },
  { name: "IPTV-org English", url: "https://iptv-org.github.io/iptv/languages/eng.m3u", type: "iptv", priority: 22 },

  // Extra community playlist
  { name: "Free-TV Main", url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8", type: "iptv", priority: 30 },

  // Web TV
  { name: "YouTube TV Collection", url: "https://raw.githubusercontent.com/benmoose39/YouTube_to_m3u/main/youtube.m3u", type: "webtv", priority: 40 },

  // Radio
  { name: "Radio Browser Top", url: "https://de1.api.radio-browser.info/m3u/stations/topvote/200", type: "radio", priority: 50 },
  { name: "Radio Browser Popular", url: "https://de1.api.radio-browser.info/m3u/stations/topclick/200", type: "radio", priority: 51 },
  { name: "Radio Browser Recent", url: "https://de1.api.radio-browser.info/m3u/stations/lastchange/200", type: "radio", priority: 52 }
];

// ---------------------------
// Helpers
// ---------------------------
function isHttpsRequest(req) {
  const xfProto = (req.headers["x-forwarded-proto"] || "").toString().toLowerCase();
  if (xfProto) return xfProto.includes("https");
  return req.secure === true || (req.protocol || "").toString().toLowerCase() === "https";
}

function isSecureUrl(url) {
  return typeof url === "string" && url.toLowerCase().startsWith("https://");
}

function sanitizeChannelForBrowser(channel) {
  if (!channel) return channel;

  const sanitized = { ...channel };
  if (sanitized.logo && !isSecureUrl(sanitized.logo)) {
    sanitized.logo = "";
  }

  if (sanitized.thumbnail && !isSecureUrl(sanitized.thumbnail)) {
    sanitized.thumbnail = "";
  }

  if (sanitized.poster && !isSecureUrl(sanitized.poster)) {
    sanitized.poster = "";
  }

  if (sanitized.background && !isSecureUrl(sanitized.background)) {
    sanitized.background = "";
  }

  return sanitized;
}

function registerProxyStream(originalUrl) {
  if (!originalUrl || isSecureUrl(originalUrl)) return originalUrl;
  const token = crypto.createHash("sha256").update(originalUrl).digest("hex");
  if (!insecureStreamMap.has(token)) {
    insecureStreamMap.set(token, { url: originalUrl, createdAt: Date.now() });
  } else {
    insecureStreamMap.get(token).lastAccessed = Date.now();
  }
  return `/api/stream/${token}`;
}

function prepareChannelForBrowser(channel, allowInsecure) {
  if (!channel) return null;
  const sanitized = sanitizeChannelForBrowser(channel);

  if (!allowInsecure && sanitized.url && !isSecureUrl(sanitized.url)) {
    sanitized.url = registerProxyStream(channel.url);
    sanitized.isProxyStream = true;
  } else {
    sanitized.isProxyStream = false;
  }

  return sanitized;
}

function resolveRelativeUrl(baseUrl, maybeRelative) {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

const PLAYLIST_CONTENT_TYPES = [
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
  "audio/mpegurl",
  "audio/x-mpegurl",
  "application/mpegurl",
  "text/plain"
];

function isHlsPlaylist(contentType = "", originalUrl = "") {
  const lowered = contentType.toLowerCase();
  if (PLAYLIST_CONTENT_TYPES.some((type) => lowered.includes(type))) return true;
  return originalUrl.toLowerCase().includes(".m3u8");
}

function rewritePlaylist(content, baseUrl) {
  const lines = content.split(/\r?\n/);
  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;

    const absolute = resolveRelativeUrl(baseUrl, trimmed);
    if (!absolute) return line;

    return registerProxyStream(absolute);
  });

  return rewritten.join("\n");
}

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
// Load channels (cache first)
// ---------------------------
async function loadChannels() {
  try {
    const cacheLoaded = await loadChannelsFromCache();

    if (!cacheLoaded) {
      channels = await loadChannelsFromSources();
      resetChannelTagCache();
      await saveChannelsToCache();
    }

    channelsLoaded = true;
    console.log("Channels loaded successfully");
  } catch (error) {
    console.error("Error loading channels:", error.message);
    await loadChannelsFromCache();
  }
}

// ---------------------------
// API routes
// ---------------------------
app.get("/api/channels", (req, res) => {
  const { category, country, search, allowInsecure } = req.query;

  // Default behavior: when the site is opened over HTTPS, return only HTTPS streams.
  // This prevents browser mixed-content warnings and hard-blocked playback.
  const allow = allowInsecure === "true" || allowInsecure === "1" || !isHttpsRequest(req);

  let filtered = [...channels];

  if (category && category !== "all") {
    const normalizedCategory = category.toLowerCase();
    filtered = filtered.filter((ch) => {
      const { categories } = getChannelTagBuckets(ch);
      return categories.some((cat) => cat.toLowerCase() === normalizedCategory);
    });
  }

  if (country && country !== "all") {
    const normalizedCountry = country.toLowerCase();
    filtered = filtered.filter((ch) => {
      const { countries } = getChannelTagBuckets(ch);
      return countries.some((token) => token.toLowerCase() === normalizedCountry);
    });
  }

  if (search) {
    filtered = filtered.filter((ch) => ch.name && ch.name.toLowerCase().includes(String(search).toLowerCase()));
  }

  let proxiedStreams = 0;
  const channelsWithAlternatives = filtered.map((channel) => {
    const prepared = prepareChannelForBrowser(channel, allow);
    if (prepared?.isProxyStream) proxiedStreams += 1;
    return {
      ...prepared,
      alternativesCount: channelAlternatives.has(channel.id) ? channelAlternatives.get(channel.id).length : 0
    };
  });

  res.json({
    channels: channelsWithAlternatives.slice(0, 100),
    total: filtered.length,
    blockedInsecure: allow ? 0 : 0,
    proxiedStreams,
    totalChannels: channels.length,
    alternativesAvailable: channelAlternatives.size
  });
});

app.get("/api/channel/:id/alternatives", (req, res) => {
  const channelId = parseInt(req.params.id, 10);
  const { allowInsecure } = req.query;
  const allow = allowInsecure === "true" || allowInsecure === "1" || !isHttpsRequest(req);

  const rawAlternatives = channelAlternatives.get(channelId) || [];
  const alternatives = rawAlternatives
    .map((alt) => prepareChannelForBrowser(alt, allow))
    .filter(Boolean);

  res.json({
    channelId,
    alternatives: alternatives.map((alt, index) => ({ ...alt, alternativeIndex: index }))
  });
});

app.get("/api/stream/:token", async (req, res) => {
  const { token } = req.params;
  const record = insecureStreamMap.get(token);

  if (!record || !record.url || isSecureUrl(record.url)) {
    return res.status(404).json({ error: "stream_not_found" });
  }

  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "video/*,application/*;q=0.9,*/*;q=0.8"
    };

    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const upstream = await axios({
      method: "get",
      url: record.url,
      responseType: "stream",
      timeout: 25000,
      headers,
      maxRedirects: 5,
      validateStatus: () => true
    });

    const contentType = upstream.headers["content-type"] || "";
    const treatAsPlaylist = isHlsPlaylist(contentType, record.url);
    const statusCode = upstream.status || 200;

    if (treatAsPlaylist) {
      const chunks = [];
      upstream.data.on("data", (chunk) => chunks.push(chunk));
      upstream.data.on("error", (err) => {
        console.error("Proxy playlist stream error:", err.message);
        if (!res.headersSent) res.status(502).json({ error: "proxy_stream_error" });
      });
      upstream.data.on("end", () => {
        try {
          const body = Buffer.concat(chunks).toString("utf8");
          const rewritten = rewritePlaylist(body, record.url);
          res.status(statusCode);
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("Content-Type", contentType || "application/vnd.apple.mpegurl");
          res.send(rewritten);
        } catch (err) {
          console.error("Playlist rewrite error:", err.message);
          if (!res.headersSent) res.status(500).json({ error: "playlist_rewrite_failed" });
        }
      });
    } else {
      res.status(statusCode);
      res.setHeader("Cache-Control", "no-store");

      const passthroughHeaders = ["content-type", "content-length", "accept-ranges", "content-range"];
      passthroughHeaders.forEach((header) => {
        if (upstream.headers[header]) {
          res.setHeader(header, upstream.headers[header]);
        }
      });

      upstream.data.pipe(res);
      upstream.data.on("error", (err) => {
        console.error("Proxy stream pipeline error:", err.message);
        res.destroy(err);
      });
    }
  } catch (error) {
    console.error("Proxy stream error:", error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: "proxy_stream_failed" });
    }
  }
});

app.get("/api/categories", (req, res) => {
  const filters = collectFilterOptions(channels);
  res.json(filters);
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
      total: channels.length
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
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  return res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// ---------------------------
// Init
// ---------------------------
loadChannels();

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
