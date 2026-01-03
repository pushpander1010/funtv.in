// Build script to pre-load channels cache
// This runs during deployment to ensure channels are available immediately

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

let channelAlternatives = new Map();
let sourceStats = {};

// Simplified parseM3U function for build script
function parseM3U(content, sourceName, sourceType) {
  const lines = content.split('\n');
  const result = [];
  let current = {};

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim();

    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);

      current = {
        id: result.length + 1,
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : '',
        category: groupMatch ? groupMatch[1] : 'General',
        source: sourceName,
        type: sourceType,
        url: '',
        validated: false
      };
    } else if (line && !line.startsWith('#') && current.name) {
      if (line.startsWith('http')) {
        current.url = line;
        result.push({ ...current });
      }
      current = {};
    }
  }

  return result;
}

async function buildChannelsFromSources() {
  console.log('Building channels cache for deployment...');

  const STREAMING_SOURCES = [
    // Keep the build fast: cache a solid "starter" set.
    { name: 'IPTV-org Main', url: 'https://iptv-org.github.io/iptv/index.m3u', type: 'iptv', priority: 1 },
    { name: 'IPTV-org News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', type: 'iptv', priority: 2 },
    { name: 'IPTV-org Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', type: 'iptv', priority: 3 },
    { name: 'IPTV-org Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', type: 'iptv', priority: 4 },
    { name: 'IPTV-org US', url: 'https://iptv-org.github.io/iptv/countries/us.m3u', type: 'iptv', priority: 5 },
    { name: 'IPTV-org IN', url: 'https://iptv-org.github.io/iptv/countries/in.m3u', type: 'iptv', priority: 6 },
    { name: 'IPTV-org English', url: 'https://iptv-org.github.io/iptv/languages/eng.m3u', type: 'iptv', priority: 7 },
    { name: 'Free-TV Main', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', type: 'iptv', priority: 8 }
  ];

  let allChannels = [];
  sourceStats = {};

  // Load from a limited number of sources (keeps deployments fast)
  const BUILD_SOURCE_LIMIT = 8;
  for (const source of STREAMING_SOURCES.slice(0, BUILD_SOURCE_LIMIT)) {
    try {
      console.log(`Loading ${source.name}...`);

      const response = await axios.get(source.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const sourceChannels = parseM3U(response.data, source.name, source.type);
      allChannels.push(...sourceChannels);

      sourceStats[source.name] = {
        channels: sourceChannels.length,
        status: 'success',
        type: source.type
      };

      console.log(`✓ ${source.name}: ${sourceChannels.length} channels`);
    } catch (error) {
      console.warn(`✗ ${source.name}: ${error.message}`);
      sourceStats[source.name] = {
        channels: 0,
        status: 'failed',
        error: error.message,
        type: source.type
      };
    }
  }

  // Build alternatives map
  console.log('Building channel alternatives...');
  const channelGroups = new Map();

  for (const channel of allChannels) {
    const normalizedName = (channel.name || '').toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!channelGroups.has(normalizedName)) channelGroups.set(normalizedName, []);
    channelGroups.get(normalizedName).push(channel);
  }

  // Create unique channels
  const uniqueChannels = [];
  channelAlternatives = new Map();

  for (const [, alternatives] of channelGroups) {
    if (alternatives.length > 0) {
      const primaryChannel = alternatives[0];
      uniqueChannels.push(primaryChannel);

      if (alternatives.length > 1) {
        channelAlternatives.set(primaryChannel.id, alternatives.slice(1));
      }
    }
  }

  console.log(`Build complete: ${uniqueChannels.length} channels cached`);
  return uniqueChannels;
}

// Save channels to cache
async function saveChannelsToCache(channels) {
  try {
    const cachePath = path.join(__dirname, 'channels-cache.json');
    const cacheData = {
      timestamp: new Date().toISOString(),
      channels: channels,
      validatedChannels: [],
      channelAlternatives: Array.from(channelAlternatives.entries()),
      sourceStats: sourceStats
    };

    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    console.log(`Saved ${channels.length} channels to cache`);
  } catch (error) {
    console.error('Error saving channels to cache:', error.message);
    process.exit(1);
  }
}

// Main build function
async function buildChannelsCache() {
  try {
    console.log('Starting channels cache build...');
    const channels = await buildChannelsFromSources();
    await saveChannelsToCache(channels);
    console.log('Channels cache build completed successfully!');
    console.log(`Cached ${channels.length} channels for instant loading`);
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

buildChannelsCache();
