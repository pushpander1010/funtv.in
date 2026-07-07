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

// YouTube full movies (legal public domain/classic films)
STREAMING_SOURCES.push(
  { name: "YouTube Classic Movies", url: "https://raw.githubusercontent.com/nicholasgasior/yt-m3u/main/movies.m3u", type: "webtv", priority: 41 }
);

// ---------------------------
// Pluto TV API (reliable legal source)
// ---------------------------
async function fetchPlutoTVChannels() {
  try {
    console.log("Fetching Pluto TV channels...");
    const response = await axios.get(
      "https://service-channels.pluto.tv/v2/guide/channels?start=now&stop=now+24h",
      { timeout: 30000, headers: { "User-Agent": "funtv.in/1.0" } }
    );
    const plutoChannels = [];
    for (const ch of (response.data || [])) {
      const stream = ch.stitched?.live?.timeline?.[0]?.playback?.sources?.[0]?.url
        || ch.stitched?.live?.timeline?.[0]?.playback?.manifest?.url
        || "";
      if (!stream) continue;
      plutoChannels.push({
        id: `pluto_${ch._id}`,
        name: ch.name || "Pluto TV Channel",
        logo: ch.images?.find(i => i.type === "logo")?.url || ch.images?.[0]?.url || "",
        category: ch.category || "Entertainment",
        source: "Pluto TV",
        type: "pluto",
        url: stream,
      });
    }
    console.log(`Pluto TV: ${plutoChannels.length} channels`);
    return plutoChannels;
  } catch (err) {
    console.warn("Pluto TV fetch failed:", err.message);
    return [];
  }
}

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

  // Fetch Pluto TV channels (reliable legal source)
  const plutoChannels = await fetchPlutoTVChannels();
  allChannels.push(...plutoChannels);
  if (plutoChannels.length > 0) {
    sourceStats["Pluto TV"] = { channels: plutoChannels.length, status: "success", type: "pluto", attempts: 1 };
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
  const { category, country, search, allowInsecure, channelId } = req.query;

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

  let finalChannels = channelsWithAlternatives.slice(0, 100);

  if (channelId) {
    const normalizedId = channelId.toString();
    const alreadyIncluded = finalChannels.some((channel) => String(channel.id) === normalizedId);
    if (!alreadyIncluded) {
      const target = filtered.find((channel) => String(channel.id) === normalizedId);
      if (target) {
        const preparedTarget = prepareChannelForBrowser(target, allow);
        finalChannels.unshift({
          ...preparedTarget,
          alternativesCount: channelAlternatives.has(target.id) ? channelAlternatives.get(target.id).length : 0
        });
      }
    }
  }

  res.json({
    channels: finalChannels,
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

// ---------------------------
// SEO Landing Pages
// ---------------------------
const CATEGORY_CONTENT = {
  news: { title: "News", desc: "Stay updated with live news channels from around the world. Stream breaking news, politics, business, and world events 24/7.", related: ["sports", "entertainment", "documentary"] },
  sports: { title: "Sports", desc: "Watch live sports channels — football, cricket, basketball, tennis, and more. Stream matches and sports news from global broadcasters.", related: ["news", "entertainment", "music"] },
  entertainment: { title: "Entertainment", desc: "Enjoy entertainment TV channels — reality shows, dramas, comedy, talk shows, and lifestyle content from around the world.", related: ["movies", "news", "music"] },
  movies: { title: "Movies", desc: "Stream free movies on demand — action, comedy, drama, horror, and classic films. Curated from Pluto TV, Tubi, and other legal free sources.", related: ["entertainment", "documentary", "kids"] },
  music: { title: "Music", desc: "Listen to live music TV and radio stations — pop, rock, classical, hip-hop, Bollywood, and more from global broadcasters.", related: ["entertainment", "radio", "kids"] },
  kids: { title: "Kids", desc: "Safe kids TV channels — cartoons, educational shows, and family-friendly entertainment for children of all ages.", related: ["entertainment", "movies", "music"] },
  documentary: { title: "Documentary", desc: "Watch documentary channels — nature, science, history, technology, and true crime. Educational content from around the world.", related: ["news", "movies", "kids"] },
  radio: { title: "Radio", desc: "Listen to global radio stations — live FM/AM broadcasts, internet radio, and podcasts from 200+ countries.", related: ["music", "news", "entertainment"] },
};

function generateCategoryPage(slug) {
  const cat = CATEGORY_CONTENT[slug] || { title: slug.charAt(0).toUpperCase() + slug.slice(1), desc: `Watch ${slug} TV channels for free on funtv.in.`, related: [] };
  const relatedLinks = cat.related.map(r => `<a href="/category/${r}" class="related-link">${CATEGORY_CONTENT[r]?.title || r}</a>`).join("\n");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Watch ${cat.title} TV Channels Free Online | funtv.in</title>
<meta name="description" content="${cat.desc} Stream ${cat.title.toLowerCase()} channels for free — no registration, no ads. funtv.in aggregates free legal streams.">
<meta name="robots" content="index,follow"><link rel="canonical" href="https://funtv.in/category/${slug}">
<meta property="og:title" content="Watch ${cat.title} TV Channels Free Online | funtv.in">
<meta property="og:description" content="${cat.desc}"><meta property="og:type" content="website"><meta property="og:url" content="https://funtv.in/category/${slug}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Watch ${cat.title} TV Free | funtv.in"><meta name="twitter:description" content="${cat.desc}">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://funtv.in"},{"@type":"ListItem","position":2,"name":"${cat.title}","item":"https://funtv.in/category/${slug}"}]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"How do I watch ${cat.title.toLowerCase()} channels on funtv.in?","acceptedAnswer":{"@type":"Answer","text":"Visit funtv.in, select '${cat.title}' from the category filter, and click any channel to start watching. No account needed."}},{"@type":"Question","name":"Are ${cat.title.toLowerCase()} channels on funtv.in free?","acceptedAnswer":{"@type":"Answer","text":"Yes, all channels on funtv.in are completely free. We aggregate from legal public sources."}},{"@type":"Question","name":"Can I watch ${cat.title.toLowerCase()} channels on mobile?","acceptedAnswer":{"@type":"Answer","text":"Yes, funtv.in works on all devices — smartphones, tablets, laptops, and desktops."}}]}</script>
</head><body><div class="container" style="max-width:800px;margin:0 auto;padding:2rem 1rem;">
<nav style="margin-bottom:1rem;"><a href="/" style="color:#3b82f6;text-decoration:none;">Home</a> <span style="color:#666;">›</span> <span style="color:#e0e7ff;">${cat.title}</span></nav>
<h1 style="font-size:2rem;color:#fff;margin-bottom:1rem;">Watch ${cat.title} TV Channels Free Online</h1>
<p style="color:rgba(255,255,255,0.8);line-height:1.8;margin-bottom:1.5rem;">${cat.desc}</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin-bottom:1.5rem;">funtv.in aggregates free ${cat.title.toLowerCase()} channels from legal public sources including IPTV playlists, Pluto TV, Tubi, and radio streams. All content is free to watch — no registration, no subscription, no hidden fees. Just pick a channel and start streaming.</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin-bottom:2rem;">Our smart aggregation technology pulls from multiple sources to give you the widest selection of ${cat.title.toLowerCase()} channels available. If one stream goes down, we automatically try alternative sources so you can keep watching without interruption.</p>
<a href="/?category=${cat.title}" style="display:inline-block;padding:0.75rem 2rem;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:2rem;">▶ Watch ${cat.title} Channels Now</a>
<h2 style="color:#e0e7ff;font-size:1.3rem;margin:2rem 0 1rem;">Related Categories</h2>
<div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:2rem;">${relatedLinks}</div>
<a href="/" style="display:inline-block;padding:0.75rem 2rem;background:rgba(255,255,255,0.1);color:#e0e7ff;border:1px solid rgba(255,255,255,0.2);border-radius:8px;text-decoration:none;">← Back to All Channels</a>
</div></body></html>`;
}

const COUNTRY_CONTENT = {
  india: { title: "India", desc: "Watch Indian TV channels for free — Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, and more. News, entertainment, sports, and regional channels." },
  "united-states": { title: "United States", desc: "Watch US TV channels for free — CNN, Fox, NBC, ESPN, and more. American news, sports, entertainment, and local channels." },
  "united-kingdom": { title: "United Kingdom", desc: "Watch UK TV channels for free — BBC, ITV, Sky News, Channel 4, and more. British news, entertainment, and sports." },
  canada: { title: "Canada", desc: "Watch Canadian TV channels for free — CBC, CTV, Global News, and more. Canadian news, sports, and entertainment." },
  australia: { title: "Australia", desc: "Watch Australian TV channels for free — ABC, SBS, Channel 7, 9News, and more. Australian news, sports, and entertainment." },
  germany: { title: "Germany", desc: "Watch German TV channels for free — ARD, ZDF, Deutsche Welle, and more. German news, entertainment, and sports." },
  france: { title: "France", desc: "Watch French TV channels for free — France 24, TV5 Monde, BFM TV, and more. French news, entertainment, and culture." },
  japan: { title: "Japan", desc: "Watch Japanese TV channels for free — NHK World, Tokyo MX, and more. Japanese news, anime, and entertainment." },
  brazil: { title: "Brazil", desc: "Watch Brazilian TV channels for free — TV Globo, Band News, and more. Brazilian news, sports, and entertainment." },
  "south-africa": { title: "South Africa", desc: "Watch South African TV channels for free — SABC, eNCA, and more. South African news, sports, and entertainment." },
  "united-arab-emirates": { title: "UAE", desc: "Watch UAE TV channels for free — Dubai One, MBC, Al Arabiya, and more. Middle Eastern news, entertainment, and sports." },
  "saudi-arabia": { title: "Saudi Arabia", desc: "Watch Saudi TV channels for free — Saudi TV, Al Arabiya, and more. Saudi news, entertainment, and sports." },
  pakistan: { title: "Pakistan", desc: "Watch Pakistani TV channels for free — Geo News, ARY, Hum TV, and more. Pakistani news, dramas, and entertainment." },
  bangladesh: { title: "Bangladesh", desc: "Watch Bangladeshi TV channels for free — BTV, Channel i, ATN Bangla, and more. Bangladeshi news and entertainment." },
  "sri-lanka": { title: "Sri Lanka", desc: "Watch Sri Lankan TV channels for free — ITN, Sirasa TV, and more. Sri Lankan news, entertainment, and sports." },
  nepal: { title: "Nepal", desc: "Watch Nepali TV channels for free — Nepal TV, Kantipur TV, and more. Nepali news, entertainment, and culture." },
};

function generateCountryPage(slug) {
  const c = COUNTRY_CONTENT[slug] || { title: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), desc: `Watch ${slug} TV channels for free on funtv.in.` };
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Watch ${c.title} TV Channels Free Online | funtv.in</title>
<meta name="description" content="${c.desc} Stream ${c.title} TV channels for free — no registration required. funtv.in aggregates free legal streams from multiple sources.">
<meta name="robots" content="index,follow"><link rel="canonical" href="https://funtv.in/country/${slug}">
<meta property="og:title" content="Watch ${c.title} TV Channels Free Online | funtv.in">
<meta property="og:description" content="${c.desc}"><meta property="og:type" content="website"><meta property="og:url" content="https://funtv.in/country/${slug}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Watch ${c.title} TV Free | funtv.in"><meta name="twitter:description" content="${c.desc}">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://funtv.in"},{"@type":"ListItem","position":2,"name":"${c.title}","item":"https://funtv.in/country/${slug}"}]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"How do I watch ${c.title} TV channels on funtv.in?","acceptedAnswer":{"@type":"Answer","text":"Visit funtv.in, select '${c.title}' from the country filter, and click any channel to start streaming. No account needed."}},{"@type":"Question","name":"Are ${c.title} channels on funtv.in free?","acceptedAnswer":{"@type":"Answer","text":"Yes, all channels are completely free. We aggregate from legal public IPTV sources, Pluto TV, and radio streams."}},{"@type":"Question","name":"What ${c.title} channels are available?","acceptedAnswer":{"@type":"Answer","text":"We aggregate news, sports, entertainment, movies, music, and kids channels from ${c.title}. Use the category filter to find specific types of content."}}]}</script>
</head><body><div class="container" style="max-width:800px;margin:0 auto;padding:2rem 1rem;">
<nav style="margin-bottom:1rem;"><a href="/" style="color:#3b82f6;text-decoration:none;">Home</a> <span style="color:#666;">›</span> <span style="color:#e0e7ff;">${c.title}</span></nav>
<h1 style="font-size:2rem;color:#fff;margin-bottom:1rem;">Watch ${c.title} TV Channels Free Online</h1>
<p style="color:rgba(255,255,255,0.8);line-height:1.8;margin-bottom:1.5rem;">${c.desc}</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin-bottom:1.5rem;">funtv.in aggregates free ${c.title} TV channels from legal public IPTV sources, Pluto TV, and other streaming platforms. Whether you want to watch news, sports, entertainment, or movies from ${c.title}, we have you covered — all for free, with no registration required.</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin-bottom:2rem;">Our platform uses smart aggregation to pull from multiple sources, so even if one stream goes down, alternatives are available. Watch on any device — phone, tablet, laptop, or desktop.</p>
<a href="/?country=${c.title}" style="display:inline-block;padding:0.75rem 2rem;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:2rem;">▶ Watch ${c.title} Channels Now</a>
<a href="/" style="display:inline-block;padding:0.75rem 2rem;background:rgba(255,255,255,0.1);color:#e0e7ff;border:1px solid rgba(255,255,255,0.2);border-radius:8px;text-decoration:none;margin-left:1rem;">← Back to All Channels</a>
</div></body></html>`;
}

app.get("/category/:name", (req, res) => {
  const slug = req.params.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  res.send(generateCategoryPage(slug));
});

app.get("/country/:name", (req, res) => {
  const slug = req.params.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  res.send(generateCountryPage(slug));
});

app.get("/about", (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>About funtv.in — Free Live TV Streaming Platform</title>
<meta name="description" content="Learn about funtv.in, the free live TV streaming platform aggregating 15,000+ channels, movies, and radio from legal public sources worldwide.">
<meta name="robots" content="index,follow"><link rel="canonical" href="https://funtv.in/about">
<meta property="og:title" content="About funtv.in — Free Live TV Streaming"><meta property="og:description" content="Learn about funtv.in — free live TV from legal public sources."><meta property="og:type" content="website">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"AboutPage","name":"About funtv.in","description":"Free live TV streaming platform","url":"https://funtv.in/about"}</script>
</head><body><div class="container" style="max-width:800px;margin:0 auto;padding:2rem 1rem;">
<nav style="margin-bottom:1rem;"><a href="/" style="color:#3b82f6;text-decoration:none;">Home</a> <span style="color:#666;">›</span> <span style="color:#e0e7ff;">About</span></nav>
<h1 style="font-size:2rem;color:#fff;margin-bottom:1.5rem;">About funtv.in</h1>
<div style="color:rgba(255,255,255,0.8);line-height:1.9;">
<p style="margin-bottom:1.5rem;">funtv.in is a free live TV streaming platform that aggregates channels, movies, and radio stations from legal public sources worldwide. Our mission is to make free entertainment accessible to everyone, everywhere — without registration, subscriptions, or hidden fees.</p>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">How It Works</h2>
<p style="margin-bottom:1.5rem;">We use smart aggregation technology to pull free streams from multiple sources including IPTV playlists, Pluto TV, Tubi, Samsung TV+, Plex Live TV, and global radio stations. When a stream goes down, our system automatically tries alternative sources so you can keep watching without interruption.</p>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">Our Sources</h2>
<p style="margin-bottom:1rem;">All content on funtv.in comes from legal, publicly available sources:</p>
<ul style="padding-left:1.5rem;margin-bottom:1.5rem;"><li style="margin-bottom:0.5rem;"><strong>IPTV-org</strong> — Community-curated free IPTV playlists from around the world</li><li style="margin-bottom:0.5rem;"><strong>Pluto TV</strong> — Free ad-supported streaming with 250+ live channels and on-demand movies</li><li style="margin-bottom:0.5rem;"><strong>Tubi</strong> — Free ad-supported movie and TV show library</li><li style="margin-bottom:0.5rem;"><strong>Radio Browser</strong> — Global radio station aggregator with 30,000+ stations</li><li style="margin-bottom:0.5rem;"><strong>YouTube</strong> — Full-length classic and public domain movies</li></ul>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">Privacy</h2>
<p style="margin-bottom:1.5rem;">We don't store any user data, don't require accounts, and don't track your viewing habits. Your IP address is never logged or shared. We believe privacy is a right, not a feature.</p>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">Contact</h2>
<p>If you have questions, suggestions, or want to report a broken stream, reach out via email or use the report button on any channel card.</p>
</div>
<a href="/" style="display:inline-block;margin-top:2rem;padding:0.75rem 2rem;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">← Back to Home</a>
</div></body></html>`);
});

app.get("/how-to-watch", (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>How to Watch Free TV Online — funtv.in Guide</title>
<meta name="description" content="Step-by-step guide to watching free live TV channels, movies, and radio on funtv.in. Works on phone, tablet, laptop, and desktop.">
<meta name="robots" content="index,follow"><link rel="canonical" href="https://funtv.in/how-to-watch">
<meta property="og:title" content="How to Watch Free TV Online — funtv.in Guide"><meta property="og:description" content="Step-by-step guide to watching free TV on funtv.in."><meta property="og:type" content="website">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"HowTo","name":"How to Watch Free TV on funtv.in","description":"Step-by-step guide to streaming free TV channels","step":[{"@type":"HowToStep","position":1,"name":"Visit funtv.in","text":"Open funtv.in in any web browser on your device."},{"@type":"HowToStep","position":2,"name":"Browse or Search","text":"Use the search bar or category/country filters to find channels."},{"@type":"HowToStep","position":3,"name":"Click a Channel","text":"Click any channel card to open the video player and start streaming."}]}</script>
</head><body><div class="container" style="max-width:800px;margin:0 auto;padding:2rem 1rem;">
<nav style="margin-bottom:1rem;"><a href="/" style="color:#3b82f6;text-decoration:none;">Home</a> <span style="color:#666;">›</span> <span style="color:#e0e7ff;">How to Watch</span></nav>
<h1 style="font-size:2rem;color:#fff;margin-bottom:1.5rem;">How to Watch Free TV Online on funtv.in</h1>
<div style="color:rgba(255,255,255,0.8);line-height:1.9;">
<p style="margin-bottom:1.5rem;">funtv.in makes it easy to watch free live TV channels, movies, and radio from around the world. No downloads, no registration, no subscriptions. Here's how to get started:</p>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">Step 1: Visit funtv.in</h2>
<p style="margin-bottom:1.5rem;">Open your web browser (Chrome, Safari, Firefox, Edge) and go to <strong>funtv.in</strong>. The site works on all devices — smartphones, tablets, laptops, and desktops.</p>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">Step 2: Browse Channels</h2>
<p style="margin-bottom:1.5rem;">Use the <strong>search bar</strong> to find specific channels by name, or use the <strong>category filter</strong> (News, Sports, Entertainment, Movies, etc.) and <strong>country filter</strong> (India, US, UK, etc.) to narrow down your options.</p>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">Step 3: Start Watching</h2>
<p style="margin-bottom:1.5rem;">Click any channel card to open the video player. The stream will start playing automatically. If the primary stream doesn't work, our smart fallback system will try alternative sources automatically.</p>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">Tips for Best Experience</h2>
<ul style="padding-left:1.5rem;margin-bottom:1.5rem;"><li style="margin-bottom:0.5rem;">Use a stable internet connection (5 Mbps recommended for HD)</li><li style="margin-bottom:0.5rem;">Close other streaming apps to free up bandwidth</li><li style="margin-bottom:0.5rem;">Try different channels if one stream is slow — different sources have different speeds</li><li style="margin-bottom:0.5rem;">On mobile, rotate to landscape mode for a better viewing experience</li><li style="margin-bottom:0.5rem;">Use the refresh button if channels fail to load</li></ul>
<h2 style="color:#e0e7ff;font-size:1.4rem;margin:2rem 0 1rem;">Supported Devices</h2>
<p style="margin-bottom:1.5rem;">funtv.in works on any device with a modern web browser: iPhone, Android phones, iPads, Android tablets, Windows/Mac laptops, and desktop computers. No app download needed.</p>
</div>
<a href="/" style="display:inline-block;margin-top:2rem;padding:0.75rem 2rem;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">← Start Watching Now</a>
</div></body></html>`);
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
