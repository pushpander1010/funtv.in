const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

// Force redeployment - updated 2025-01-03

const app = express();
const PORT = process.env.PORT || 3000;

// Channel data storage
let channels = [];
let validatedChannels = [];
let channelAlternatives = new Map();
let validationInProgress = false;
let sourceStats = {};
let channelsLoaded = false;
let serverReady = false; // Flag to track if server is fully deployed

// Load channels from cached JSON file
async function loadChannelsFromCache() {
  try {
    const cachePath = path.join(__dirname, 'channels-cache.json');
    const cacheData = await fs.readFile(cachePath, 'utf8');
    const cached = JSON.parse(cacheData);

    channels = cached.channels || [];
    validatedChannels = cached.validatedChannels || [];
    channelAlternatives = new Map(cached.channelAlternatives || []);
    sourceStats = cached.sourceStats || {};

    console.log(`Loaded ${channels.length} channels from cache`);
    channelsLoaded = true;
    return true;
  } catch (error) {
    console.log('No cache file found, will load from sources');
    return false;
  }
}

// Save channels to cache file
async function saveChannelsToCache() {
  try {
    const cachePath = path.join(__dirname, 'channels-cache.json');
    const cacheData = {
      timestamp: new Date().toISOString(),
      channels: channels,
      validatedChannels: validatedChannels,
      channelAlternatives: Array.from(channelAlternatives.entries()),
      sourceStats: sourceStats
    };

    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    console.log(`Saved ${channels.length} channels to cache`);
  } catch (error) {
    console.error('Error saving channels to cache:', error.message);
  }
}

app.use(cors());
app.use(express.json());

// Add cache control for static files to prevent caching issues
app.use('/style.css', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/app.js', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.static('public'));

// Handle favicon requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/apple-touch-icon.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/favicon-32x32.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/favicon-16x16.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Comprehensive streaming sources for maximum availability and fault tolerance
const STREAMING_SOURCES = [
  // Primary IPTV Sources (Highly Reliable)
  {
    name: 'IPTV-org Main',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    type: 'iptv',
    priority: 1
  },
  {
    name: 'IPTV-org Countries',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    type: 'iptv',
    priority: 2
  },
  {
    name: 'IPTV-org News',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    type: 'iptv',
    priority: 3
  },
  {
    name: 'IPTV-org Sports',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    type: 'iptv',
    priority: 4
  },
  {
    name: 'IPTV-org Entertainment',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    type: 'iptv',
    priority: 5
  },
  {
    name: 'IPTV-org Movies',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    type: 'iptv',
    priority: 6
  },

  // Alternative IPTV Sources (Backup Sources)
  {
    name: 'Free-TV Main',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    type: 'iptv',
    priority: 7
  },
  {
    name: 'IPTV-org UK',
    url: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
    type: 'iptv',
    priority: 8
  },
  {
    name: 'IPTV-org IN',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    type: 'iptv',
    priority: 9
  },
  {
    name: 'IPTV-org CA',
    url: 'https://iptv-org.github.io/iptv/countries/ca.m3u',
    type: 'iptv',
    priority: 10
  },
  {
    name: 'IPTV-org AU',
    url: 'https://iptv-org.github.io/iptv/countries/au.m3u',
    type: 'iptv',
    priority: 11
  },

  // Additional Reliable Sources
  {
    name: 'IPTV-org DE',
    url: 'https://iptv-org.github.io/iptv/countries/de.m3u',
    type: 'iptv',
    priority: 12
  },
  {
    name: 'IPTV-org FR',
    url: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
    type: 'iptv',
    priority: 13
  },
  {
    name: 'IPTV-org IT',
    url: 'https://iptv-org.github.io/iptv/countries/it.m3u',
    type: 'iptv',
    priority: 14
  },
  {
    name: 'IPTV-org ES',
    url: 'https://iptv-org.github.io/iptv/countries/es.m3u',
    type: 'iptv',
    priority: 15
  },
  {
    name: 'IPTV-org BR',
    url: 'https://iptv-org.github.io/iptv/countries/br.m3u',
    type: 'iptv',
    priority: 16
  },

  // Web TV Sources (YouTube-based)
  {
    name: 'YouTube TV Collection',
    url: 'https://raw.githubusercontent.com/benmoose39/YouTube_to_m3u/main/youtube.m3u',
    type: 'webtv',
    priority: 17
  },
  {
    name: 'YouTube Live Sports',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/sports.m3u8',
    type: 'webtv',
    priority: 18
  },
  {
    name: 'YouTube News',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/news.m3u8',
    type: 'webtv',
    priority: 19
  },

  // Radio Sources (Highly Reliable)
  {
    name: 'Radio Browser Top',
    url: 'https://de1.api.radio-browser.info/m3u/stations/topvote/200',
    type: 'radio',
    priority: 20
  },
  {
    name: 'Radio Browser Popular',
    url: 'https://de1.api.radio-browser.info/m3u/stations/topclick/200',
    type: 'radio',
    priority: 21
  },
  {
    name: 'Radio Browser Recent',
    url: 'https://de1.api.radio-browser.info/m3u/stations/lastchange/200',
    type: 'radio',
    priority: 22
  },

  // Additional Free Streaming Sources
  {
    name: 'IPTV-org Music',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    type: 'iptv',
    priority: 23
  },
  {
    name: 'IPTV-org Kids',
    url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    type: 'iptv',
    priority: 24
  },
  {
    name: 'IPTV-org Documentary',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    type: 'iptv',
    priority: 25
  },
  {
    name: 'IPTV-org Science',
    url: 'https://iptv-org.github.io/iptv/categories/science.m3u',
    type: 'iptv',
    priority: 26
  },
  {
    name: 'IPTV-org Lifestyle',
    url: 'https://iptv-org.github.io/iptv/categories/lifestyle.m3u',
    type: 'iptv',
    priority: 27
  },

  // Regional Sources for Better Coverage
  {
    name: 'IPTV-org AR',
    url: 'https://iptv-org.github.io/iptv/countries/ar.m3u',
    type: 'iptv',
    priority: 28
  },
  {
    name: 'IPTV-org MX',
    url: 'https://iptv-org.github.io/iptv/countries/mx.m3u',
    type: 'iptv',
    priority: 29
  },
  {
    name: 'IPTV-org JP',
    url: 'https://iptv-org.github.io/iptv/countries/jp.m3u',
    type: 'iptv',
    priority: 30
  },
  {
    name: 'IPTV-org KR',
    url: 'https://iptv-org.github.io/iptv/countries/kr.m3u',
    type: 'iptv',
    priority: 31
  },
  {
    name: 'IPTV-org RU',
    url: 'https://iptv-org.github.io/iptv/countries/ru.m3u',
    type: 'iptv',
    priority: 32
  },

  // Additional Backup Sources
  {
    name: 'IPTV-org CN',
    url: 'https://iptv-org.github.io/iptv/countries/cn.m3u',
    type: 'iptv',
    priority: 33
  },
  {
    name: 'IPTV-org TR',
    url: 'https://iptv-org.github.io/iptv/countries/tr.m3u',
    type: 'iptv',
    priority: 34
  },
  {
    name: 'IPTV-org NL',
    url: 'https://iptv-org.github.io/iptv/countries/nl.m3u',
    type: 'iptv',
    priority: 35
  },
  {
    name: 'IPTV-org SE',
    url: 'https://iptv-org.github.io/iptv/countries/se.m3u',
    type: 'iptv',
    priority: 36
  },
  {
    name: 'IPTV-org NO',
    url: 'https://iptv-org.github.io/iptv/countries/no.m3u',
    type: 'iptv',
    priority: 37
  },

  // More Category Sources
  {
    name: 'IPTV-org Auto',
    url: 'https://iptv-org.github.io/iptv/categories/auto.m3u',
    type: 'iptv',
    priority: 38
  },
  {
    name: 'IPTV-org Business',
    url: 'https://iptv-org.github.io/iptv/categories/business.m3u',
    type: 'iptv',
    priority: 39
  },
  {
    name: 'IPTV-org Cooking',
    url: 'https://iptv-org.github.io/iptv/categories/cooking.m3u',
    type: 'iptv',
    priority: 40
  },
  {
    name: 'IPTV-org Education',
    url: 'https://iptv-org.github.io/iptv/categories/education.m3u',
    type: 'iptv',
    priority: 41
  },
  {
    name: 'IPTV-org Family',
    url: 'https://iptv-org.github.io/iptv/categories/family.m3u',
    type: 'iptv',
    priority: 42
  },
  {
    name: 'IPTV-org Fashion',
    url: 'https://iptv-org.github.io/iptv/categories/fashion.m3u',
    type: 'iptv',
    priority: 43
  },
  {
    name: 'IPTV-org Food',
    url: 'https://iptv-org.github.io/iptv/categories/food.m3u',
    type: 'iptv',
    priority: 44
  },
  {
    name: 'IPTV-org Gaming',
    url: 'https://iptv-org.github.io/iptv/categories/gaming.m3u',
    type: 'iptv',
    priority: 45
  },
  {
    name: 'IPTV-org Health',
    url: 'https://iptv-org.github.io/iptv/categories/health.m3u',
    type: 'iptv',
    priority: 46
  },
  {
    name: 'IPTV-org History',
    url: 'https://iptv-org.github.io/iptv/categories/history.m3u',
    type: 'iptv',
    priority: 47
  },
  {
    name: 'IPTV-org Hobby',
    url: 'https://iptv-org.github.io/iptv/categories/hobby.m3u',
    type: 'iptv',
    priority: 48
  },
  {
    name: 'IPTV-org Legislative',
    url: 'https://iptv-org.github.io/iptv/categories/legislative.m3u',
    type: 'iptv',
    priority: 49
  },
  {
    name: 'IPTV-org Local',
    url: 'https://iptv-org.github.io/iptv/categories/local.m3u',
    type: 'iptv',
    priority: 50
  },
  {
    name: 'IPTV-org Nature',
    url: 'https://iptv-org.github.io/iptv/categories/nature.m3u',
    type: 'iptv',
    priority: 51
  },
  {
    name: 'IPTV-org Religious',
    url: 'https://iptv-org.github.io/iptv/categories/religious.m3u',
    type: 'iptv',
    priority: 52
  },
  {
    name: 'IPTV-org Shop',
    url: 'https://iptv-org.github.io/iptv/categories/shop.m3u',
    type: 'iptv',
    priority: 53
  },
  {
    name: 'IPTV-org Travel',
    url: 'https://iptv-org.github.io/iptv/categories/travel.m3u',
    type: 'iptv',
    priority: 54
  },
  {
    name: 'IPTV-org Weather',
    url: 'https://iptv-org.github.io/iptv/categories/weather.m3u',
    type: 'iptv',
    priority: 55
  },

  // Additional Reliable Sources (High Priority Backups)
  {
    name: 'IPTV-org XX',
    url: 'https://iptv-org.github.io/iptv/countries/xx.m3u',
    type: 'iptv',
    priority: 56
  },
  {
    name: 'IPTV-org BE',
    url: 'https://iptv-org.github.io/iptv/countries/be.m3u',
    type: 'iptv',
    priority: 57
  },
  {
    name: 'IPTV-org CH',
    url: 'https://iptv-org.github.io/iptv/countries/ch.m3u',
    type: 'iptv',
    priority: 58
  },
  {
    name: 'IPTV-org DK',
    url: 'https://iptv-org.github.io/iptv/countries/dk.m3u',
    type: 'iptv',
    priority: 59
  },
  {
    name: 'IPTV-org FI',
    url: 'https://iptv-org.github.io/iptv/countries/fi.m3u',
    type: 'iptv',
    priority: 60
  },
  {
    name: 'IPTV-org GR',
    url: 'https://iptv-org.github.io/iptv/countries/gr.m3u',
    type: 'iptv',
    priority: 61
  },
  {
    name: 'IPTV-org HU',
    url: 'https://iptv-org.github.io/iptv/countries/hu.m3u',
    type: 'iptv',
    priority: 62
  },
  {
    name: 'IPTV-org IE',
    url: 'https://iptv-org.github.io/iptv/countries/ie.m3u',
    type: 'iptv',
    priority: 63
  },
  {
    name: 'IPTV-org IL',
    url: 'https://iptv-org.github.io/iptv/countries/il.m3u',
    type: 'iptv',
    priority: 64
  },
  {
    name: 'IPTV-org MY',
    url: 'https://iptv-org.github.io/iptv/countries/my.m3u',
    type: 'iptv',
    priority: 65
  },
  {
    name: 'IPTV-org NZ',
    url: 'https://iptv-org.github.io/iptv/countries/nz.m3u',
    type: 'iptv',
    priority: 66
  },
  {
    name: 'IPTV-org PH',
    url: 'https://iptv-org.github.io/iptv/countries/ph.m3u',
    type: 'iptv',
    priority: 67
  },
  {
    name: 'IPTV-org PL',
    url: 'https://iptv-org.github.io/iptv/countries/pl.m3u',
    type: 'iptv',
    priority: 68
  },
  {
    name: 'IPTV-org PT',
    url: 'https://iptv-org.github.io/iptv/countries/pt.m3u',
    type: 'iptv',
    priority: 69
  },
  {
    name: 'IPTV-org RO',
    url: 'https://iptv-org.github.io/iptv/countries/ro.m3u',
    type: 'iptv',
    priority: 70
  },
  {
    name: 'IPTV-org RS',
    url: 'https://iptv-org.github.io/iptv/countries/rs.m3u',
    type: 'iptv',
    priority: 71
  },
  {
    name: 'IPTV-org SG',
    url: 'https://iptv-org.github.io/iptv/countries/sg.m3u',
    type: 'iptv',
    priority: 72
  },
  {
    name: 'IPTV-org TH',
    url: 'https://iptv-org.github.io/iptv/countries/th.m3u',
    type: 'iptv',
    priority: 73
  },
  {
    name: 'IPTV-org TW',
    url: 'https://iptv-org.github.io/iptv/countries/tw.m3u',
    type: 'iptv',
    priority: 74
  },
  {
    name: 'IPTV-org UA',
    url: 'https://iptv-org.github.io/iptv/countries/ua.m3u',
    type: 'iptv',
    priority: 75
  },
  {
    name: 'IPTV-org VN',
    url: 'https://iptv-org.github.io/iptv/countries/vn.m3u',
    type: 'iptv',
    priority: 76
  },
  {
    name: 'IPTV-org ZA',
    url: 'https://iptv-org.github.io/iptv/countries/za.m3u',
    type: 'iptv',
    priority: 77
  },

  // More Category Sources for Comprehensive Coverage
  {
    name: 'IPTV-org Animation',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    type: 'iptv',
    priority: 78
  },
  {
    name: 'IPTV-org Comedy',
    url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u',
    type: 'iptv',
    priority: 79
  },
  {
    name: 'IPTV-org Crime',
    url: 'https://iptv-org.github.io/iptv/categories/crime.m3u',
    type: 'iptv',
    priority: 80
  },
  {
    name: 'IPTV-org Drama',
    url: 'https://iptv-org.github.io/iptv/categories/drama.m3u',
    type: 'iptv',
    priority: 81
  },
  {
    name: 'IPTV-org Mystery',
    url: 'https://iptv-org.github.io/iptv/categories/mystery.m3u',
    type: 'iptv',
    priority: 82
  },
  {
    name: 'IPTV-org Romance',
    url: 'https://iptv-org.github.io/iptv/categories/romance.m3u',
    type: 'iptv',
    priority: 83
  },
  {
    name: 'IPTV-org Sci-Fi',
    url: 'https://iptv-org.github.io/iptv/categories/sci-fi.m3u',
    type: 'iptv',
    priority: 84
  },
  {
    name: 'IPTV-org Thriller',
    url: 'https://iptv-org.github.io/iptv/categories/thriller.m3u',
    type: 'iptv',
    priority: 85
  },
  {
    name: 'IPTV-org War',
    url: 'https://iptv-org.github.io/iptv/categories/war.m3u',
    type: 'iptv',
    priority: 86
  },
  {
    name: 'IPTV-org Western',
    url: 'https://iptv-org.github.io/iptv/categories/western.m3u',
    type: 'iptv',
    priority: 87
  }
];

// Parse M3U playlist with source and type tracking
function parseM3U(content, sourceName, sourceType) {
  const lines = content.split('\n');
  const result = [];
  let current = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      
      // Determine category based on source type and group
      let category = 'General';
      if (groupMatch && groupMatch[1]) {
        category = groupMatch[1];
      } else {
        // Auto-categorize based on source type
        switch (sourceType) {
          case 'radio': category = 'Radio'; break;
          case 'pluto': category = 'Movies & TV'; break;
          case 'tubi': category = 'Movies'; break;
          case 'samsung': category = 'Samsung TV+'; break;
          case 'plex': category = 'Plex Live'; break;
          case 'webtv': category = 'Web TV'; break;
          default: category = 'Live TV'; break;
        }
      }
      
      current = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : '',
        category: category,
        source: sourceName,
        type: sourceType
      };
    } else if (line && !line.startsWith('#') && current.name) {
      if (line.startsWith('http')) {
        current.url = line;
        current.id = `${sourceName}_${result.length}`;
        result.push({ ...current });
      }
      current = {};
    }
  }
  
  return result;
}

// Load channels from multiple streaming sources and build alternatives map
async function loadChannelsFromSources() {
  console.log('Loading channels from multiple streaming sources...');
  let allChannels = [];
  sourceStats = {};
  channelAlternatives.clear();

  // Function to fetch with retry logic
  async function fetchWithRetry(source, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fetching ${source.type.toUpperCase()} from ${source.name}... (attempt ${attempt}/${maxRetries})`);
        const response = await axios.get(source.url, {
          timeout: 30000, // Increased timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/plain, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          }
        });

        const sourceChannels = parseM3U(response.data, source.name, source.type);
        allChannels.push(...sourceChannels);

        sourceStats[source.name] = {
          channels: sourceChannels.length,
          status: 'success',
          type: source.type,
          attempts: attempt
        };

        console.log(`✓ ${source.name} (${source.type}): ${sourceChannels.length} channels`);
        return true; // Success
      } catch (error) {
        console.warn(`✗ ${source.name} attempt ${attempt}/${maxRetries}: ${error.message}`);

        if (attempt === maxRetries) {
          sourceStats[source.name] = {
            channels: 0,
            status: 'failed',
            error: error.message,
            type: source.type,
            attempts: attempt
          };
          return false; // Failed after all retries
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // Process sources in parallel with concurrency control
  const concurrencyLimit = 5; // Process 5 sources at a time
  for (let i = 0; i < STREAMING_SOURCES.length; i += concurrencyLimit) {
    const batch = STREAMING_SOURCES.slice(i, i + concurrencyLimit);
    await Promise.all(batch.map(source => fetchWithRetry(source)));
  }

  // If we have very few channels, try some emergency backup sources
  if (allChannels.length < 1000) {
    console.log('Low channel count detected, trying emergency backup sources...');

    const emergencySources = [
      {
        name: 'Emergency IPTV-org All',
        url: 'https://iptv-org.github.io/iptv/index.m3u',
        type: 'iptv',
        priority: 999
      },
      {
        name: 'Emergency Free-TV Backup',
        url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
        type: 'iptv',
        priority: 1000
      }
    ];

    for (const source of emergencySources) {
      if (!sourceStats[source.name]) {
        await fetchWithRetry(source, 2); // Only 2 retries for emergency sources
      }
    }
  }

  // Build alternatives map - group channels by name similarity
  console.log('Building channel alternatives map...');
  const channelGroups = new Map();
  
  for (const channel of allChannels) {
    const normalizedName = channel.name.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
    
    if (!channelGroups.has(normalizedName)) {
      channelGroups.set(normalizedName, []);
    }
    channelGroups.get(normalizedName).push(channel);
  }

  // Create unique channels with alternatives
  const uniqueChannels = [];
  let alternativesCount = 0;
  
  for (const [name, alternatives] of channelGroups) {
    if (alternatives.length > 0) {
      // Use the first channel as primary
      const primaryChannel = alternatives[0];
      primaryChannel.id = uniqueChannels.length;
      uniqueChannels.push(primaryChannel);
      
      // Store alternatives if there are multiple sources
      if (alternatives.length > 1) {
        channelAlternatives.set(primaryChannel.id, alternatives.slice(1));
        alternativesCount += alternatives.length - 1;
      }
    }
  }

  console.log(`Total channels loaded: ${allChannels.length}`);
  console.log(`Unique channels after grouping: ${uniqueChannels.length}`);
  console.log(`Alternative sources available: ${alternativesCount}`);
  
  // Log breakdown by type
  const typeBreakdown = {};
  uniqueChannels.forEach(ch => {
    typeBreakdown[ch.type] = (typeBreakdown[ch.type] || 0) + 1;
  });
  console.log('Channel types:', typeBreakdown);
  
  return uniqueChannels;
}

// Enhanced stream validation for different content types
async function validateStream(url, channelType = 'iptv', timeout = 12000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Adjust validation based on content type
    let response;
    try {
      response = await axios.head(url, {
        timeout: timeout,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': channelType === 'radio' ? 'audio/*' : 'video/*,application/*'
        },
        maxRedirects: 5
      });
    } catch (headError) {
      // If HEAD fails, try GET with range request
      response = await axios.get(url, {
        timeout: timeout / 2,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': 'bytes=0-2048'
        },
        maxRedirects: 5
      });
    }
    
    clearTimeout(timeoutId);
    
    // Enhanced validation based on content type
    const contentType = response.headers['content-type'] || '';
    const contentLength = response.headers['content-length'];
    
    const isValidStatus = response.status === 200 || response.status === 206;
    
    let hasValidContentType = false;
    switch (channelType) {
      case 'radio':
        hasValidContentType = 
          contentType.includes('audio/') ||
          contentType.includes('application/ogg') ||
          url.includes('radio') ||
          url.includes('.mp3') ||
          url.includes('.aac');
        break;
      case 'webtv':
      case 'pluto':
      case 'tubi':
      case 'samsung':
      case 'plex':
        hasValidContentType = 
          contentType.includes('video/') ||
          contentType.includes('application/vnd.apple.mpegurl') ||
          contentType.includes('application/x-mpegURL') ||
          contentType.includes('application/dash+xml') ||
          url.includes('.m3u8') ||
          url.includes('playlist');
        break;
      default: // iptv
        hasValidContentType = 
          contentType.includes('video/') ||
          contentType.includes('application/vnd.apple.mpegurl') ||
          contentType.includes('application/x-mpegURL') ||
          contentType.includes('application/octet-stream') ||
          url.includes('.m3u8') ||
          url.includes('.ts');
    }
    
    const hasReasonableSize = !contentLength || parseInt(contentLength) > 100;
    
    return isValidStatus && (hasValidContentType || hasReasonableSize);
  } catch (error) {
    return false;
  }
}

// Validate channels in batches with priority sorting
async function validateChannels() {
  if (validationInProgress) return;
  
  validationInProgress = true;
  validatedChannels = [];
  
  console.log(`Starting validation of ${channels.length} channels...`);
  
  // Sort channels by source priority and type diversity
  const sortedChannels = [...channels].sort((a, b) => {
    const aPriority = STREAMING_SOURCES.find(s => s.name === a.source)?.priority || 999;
    const bPriority = STREAMING_SOURCES.find(s => s.name === b.source)?.priority || 999;
    if (aPriority !== bPriority) return aPriority - bPriority;
    // Secondary sort by type for diversity
    return a.type.localeCompare(b.type);
  });
  
  const batchSize = 25; // Increased batch size for faster processing
  const maxChannels = 800; // Increased limit for more channels
  const channelsToValidate = sortedChannels.slice(0, maxChannels);
  
  for (let i = 0; i < channelsToValidate.length; i += batchSize) {
    const batch = channelsToValidate.slice(i, i + batchSize);
    
    const validationPromises = batch.map(async (channel) => {
      const isValid = await validateStream(channel.url, channel.type);
      if (isValid) {
        return channel;
      }
      return null;
    });
    
    const results = await Promise.all(validationPromises);
    const validChannels = results.filter(channel => channel !== null);
    validatedChannels.push(...validChannels);
    
    console.log(`Validated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(channelsToValidate.length/batchSize)}: ${validChannels.length}/${batch.length} working`);
    
    // Shorter delay for faster processing
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`Validation complete: ${validatedChannels.length} working channels found`);
  console.log('Source breakdown:', getSourceBreakdown());
  validationInProgress = false;
}

// Get breakdown of validated channels by source
function getSourceBreakdown() {
  const breakdown = {};
  validatedChannels.forEach(channel => {
    breakdown[channel.source] = (breakdown[channel.source] || 0) + 1;
  });
  return breakdown;
}

// Load channels from all sources
async function loadChannels() {
  try {
    // First try to load from cache
    const cacheLoaded = await loadChannelsFromCache();

    if (!cacheLoaded) {
      // If no cache, load from sources
      console.log('Loading IPTV channels from multiple sources...');
      channels = await loadChannelsFromSources();
      console.log(`Total unique channels loaded: ${channels.length}`);

      // Save to cache for future use
      await saveChannelsToCache();
    }

    // Don't start validation during deployment - wait for server to be ready
    // Validation will be started separately after deployment is complete
    console.log('Channels loaded successfully - validation will start after deployment');
    
    channelsLoaded = true;
  } catch (error) {
    console.error('Error loading channels:', error.message);
    // Try to load from cache as fallback
    await loadChannelsFromCache();
  }
}

// Start validation after deployment is complete
async function startValidationAfterDeployment() {
  // In serverless environments, use a more conservative delay
  // and check if we're in a production environment
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const delay = isProduction ? 120000 : 30000; // 2 minutes in production, 30 seconds in development

  console.log(`⏳ Validation scheduled to start in ${delay/1000} seconds (${isProduction ? 'production' : 'development'} environment)`);
  console.log(`📊 Current status: channelsLoaded=${channelsLoaded}, validatedChannels=${validatedChannels.length}, validationInProgress=${validationInProgress}`);

  setTimeout(async () => {
    try {
      console.log(`🔍 Checking validation conditions: channelsLoaded=${channelsLoaded}, validatedChannels=${validatedChannels.length}, validationInProgress=${validationInProgress}`);

      if (channelsLoaded && validatedChannels.length === 0 && !validationInProgress) {
        console.log('🚀 Starting channel validation (post-deployment)...');
        await validateChannels();
      } else if (validationInProgress) {
        console.log('ℹ️ Validation already in progress');
      } else if (validatedChannels.length > 0) {
        console.log('ℹ️ Channels already validated');
      } else {
        console.log('⏸️ Validation conditions not met, skipping');
      }
    } catch (error) {
      console.error('❌ Error starting validation:', error.message);
    }
  }, delay);
}

// API Routes
app.get('/api/channels', (req, res) => {
  const { category, search, validated } = req.query;
  
  // Use validated channels if available and requested, otherwise use all channels
  let sourceChannels = (validated === 'true' && validatedChannels.length > 0) 
    ? validatedChannels 
    : channels;
  
  let filtered = [...sourceChannels];

  if (category && category !== 'all') {
    filtered = filtered.filter(ch => 
      ch.category && ch.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  if (search) {
    filtered = filtered.filter(ch => 
      ch.name && ch.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Add alternatives count to each channel
  const channelsWithAlternatives = filtered.map(channel => ({
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

// New endpoint to get alternatives for a specific channel
app.get('/api/channel/:id/alternatives', (req, res) => {
  const channelId = parseInt(req.params.id);
  const alternatives = channelAlternatives.get(channelId) || [];
  
  res.json({
    channelId,
    alternatives: alternatives.map((alt, index) => ({
      ...alt,
      alternativeIndex: index
    }))
  });
});

app.get('/api/categories', (req, res) => {
  const { validated } = req.query;
  
  // Use validated channels if available and requested
  let sourceChannels = (validated === 'true' && validatedChannels.length > 0) 
    ? validatedChannels 
    : channels;
    
  const categories = [...new Set(sourceChannels.map(ch => ch.category))].sort();
  res.json(categories);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const totalSources = STREAMING_SOURCES.length;
  const failedSources = Object.values(sourceStats).filter(stat => stat.status === 'failed').length;
  const successfulSources = Object.values(sourceStats).filter(stat => stat.status === 'success').length;

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
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

app.get('/api/validation-status', (req, res) => {
  const timeSinceStart = Date.now() - (global.serverStartTime || Date.now());
  const validationStartingIn = Math.max(0, 30000 - timeSinceStart); // 30 seconds delay

  res.json({
    validatedCount: validatedChannels.length,
    totalChannels: channels.length,
    validationInProgress,
    validationStartingIn: validationStartingIn > 0 ? Math.ceil(validationStartingIn / 1000) : 0,
    validationPercentage: channels.length > 0 ? Math.round((validatedChannels.length / Math.min(channels.length, 800)) * 100) : 0,
    sourceStats,
    sourceBreakdown: getSourceBreakdown()
  });
});

// Manual validation trigger endpoint
app.post('/api/validation/start', async (req, res) => {
  try {
    console.log('🔧 Manual validation triggered via API');

    if (validationInProgress) {
      return res.json({
        status: 'already_running',
        message: 'Validation is already in progress',
        validatedCount: validatedChannels.length,
        totalChannels: channels.length
      });
    }

    if (validatedChannels.length > 0) {
      return res.json({
        status: 'already_validated',
        message: 'Channels are already validated',
        validatedCount: validatedChannels.length,
        totalChannels: channels.length
      });
    }

    // Start validation immediately
    validateChannels();
    res.json({
      status: 'started',
      message: 'Validation started successfully',
      validatedCount: validatedChannels.length,
      totalChannels: channels.length
    });
  } catch (error) {
    console.error('❌ Error starting manual validation:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/sources', (req, res) => {
  res.json({
    sources: STREAMING_SOURCES.map(source => ({
      name: source.name,
      type: source.type,
      priority: source.priority,
      stats: sourceStats[source.name] || { channels: 0, status: 'pending', type: source.type }
    }))
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize
loadChannels();

// Start validation after deployment is complete (30 second delay)
startValidationAfterDeployment();

app.listen(PORT, () => {
  global.serverStartTime = Date.now(); // Track when server started
  console.log(`StreamVerse running on http://localhost:${PORT}`);
  console.log('✅ Server ready - channels loaded from cache');
  console.log('⏳ Validation will start in 30 seconds (post-deployment)');
});