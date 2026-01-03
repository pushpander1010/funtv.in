const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Comprehensive streaming sources for maximum availability
const STREAMING_SOURCES = [
  // Primary IPTV Sources
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
    name: 'Free-TV',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    type: 'iptv',
    priority: 5
  },
  // Alternative IPTV Sources
  {
    name: 'IPTV Collection',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us.m3u',
    type: 'iptv',
    priority: 6
  },
  {
    name: 'World IPTV',
    url: 'https://raw.githubusercontent.com/hosseinpourziyaie/IPTV-WORLD/main/IPTV-WORLD.m3u',
    type: 'iptv',
    priority: 7
  },
  {
    name: 'Global IPTV',
    url: 'https://raw.githubusercontent.com/davidmuma/Canales_dobleM/master/TDT_ES/playlist.m3u8',
    type: 'iptv',
    priority: 8
  },
  // Web TV Sources
  {
    name: 'WebTV Collection',
    url: 'https://raw.githubusercontent.com/benmoose39/YouTube_to_m3u/main/youtube.m3u',
    type: 'webtv',
    priority: 9
  },
  {
    name: 'YouTube Live',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_youtube.m3u8',
    type: 'webtv',
    priority: 10
  },
  // Radio Sources
  {
    name: 'Radio Browser Top',
    url: 'https://de1.api.radio-browser.info/m3u/stations/topvote/200',
    type: 'radio',
    priority: 11
  },
  {
    name: 'Radio Browser Popular',
    url: 'https://de1.api.radio-browser.info/m3u/stations/topclick/200',
    type: 'radio',
    priority: 12
  },
  // Premium Free Services (when available)
  {
    name: 'Pluto TV Channels',
    url: 'https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master/PlutoTV/all.m3u8',
    type: 'pluto',
    priority: 13
  },
  {
    name: 'Tubi Streams',
    url: 'https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master/Tubi/all.m3u8',
    type: 'tubi',
    priority: 14
  },
  // Additional Sources
  {
    name: 'Awesome IPTV',
    url: 'https://raw.githubusercontent.com/iptv-org/awesome-iptv/master/README.md',
    type: 'iptv',
    priority: 15
  }
];

let channels = [];
let validatedChannels = [];
let channelAlternatives = new Map(); // Store alternative sources for same channels
let validationInProgress = false;
let sourceStats = {};

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

  for (const source of STREAMING_SOURCES) {
    try {
      console.log(`Fetching ${source.type.toUpperCase()} from ${source.name}...`);
      const response = await axios.get(source.url, { 
        timeout: 25000, // Increased timeout for more sources
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
      
      console.log(`✓ ${source.name} (${source.type}): ${sourceChannels.length} channels`);
    } catch (error) {
      console.error(`✗ ${source.name}: ${error.message}`);
      sourceStats[source.name] = {
        channels: 0,
        status: 'failed',
        error: error.message,
        type: source.type
      };
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
    console.log('Loading IPTV channels from multiple sources...');
    channels = await loadChannelsFromSources();
    console.log(`Total unique channels loaded: ${channels.length}`);
    
    // Start validation in background
    validateChannels();
  } catch (error) {
    console.error('Error loading channels:', error.message);
  }
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

app.get('/api/validation-status', (req, res) => {
  res.json({
    validatedCount: validatedChannels.length,
    totalChannels: channels.length,
    validationInProgress,
    validationPercentage: channels.length > 0 ? Math.round((validatedChannels.length / Math.min(channels.length, 800)) * 100) : 0,
    sourceStats,
    sourceBreakdown: getSourceBreakdown()
  });
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

app.listen(PORT, () => {
  console.log(`StreamVerse running on http://localhost:${PORT}`);
});