// Wiki-style data structure
// Each page has sections, each section has items + optional subsections
// Items have: name, url, desc, starred?, links? (alternate links)

export const sidebarSections = {
  wiki: [
    { id: 'adblocking-privacy', title: 'Adblocking / Privacy' },
    { id: 'artificial-intelligence', title: 'Artificial Intelligence' },
    { id: 'streaming', title: 'Movies / TV / Anime' },
    { id: 'music-podcasts', title: 'Music / Podcasts / Radio' },
    { id: 'gaming', title: 'Gaming / Emulation' },
    { id: 'reading', title: 'Books / Comics / Manga' },
    { id: 'downloading', title: 'Downloading' },
    { id: 'torrenting', title: 'Torrenting' },
    { id: 'educational', title: 'Educational' },
    { id: 'android-ios', title: 'Android / iOS' },
    { id: 'linux-macos', title: 'Linux / macOS' },
    { id: 'miscellaneous', title: 'Miscellaneous' },
  ],
  tools: [
    { id: 'system-tools', title: 'System Tools' },
    { id: 'file-tools', title: 'File Tools' },
    { id: 'internet-tools', title: 'Internet Tools' },
    { id: 'social-media-tools', title: 'Social Media Tools' },
    { id: 'image-tools', title: 'Image Tools' },
    { id: 'video-tools', title: 'Video Tools' },
    { id: 'audio-tools', title: 'Audio Tools' },
    { id: 'developer-tools', title: 'Developer Tools' },
    { id: 'educational-tools', title: 'Educational Tools' },
  ],
}

export const wikiPages = [
  {
    id: 'adblocking-privacy',
    title: 'Adblocking / Privacy',
    description: 'Adblocking, Privacy, VPNs, Proxies, Antiviruses',
    sections: [
      {
        title: 'Adblocking',
        tip: { type: 'tip', text: 'We highly recommend using an adblocker. Don\'t run multiple general adblockers simultaneously to avoid breakage. Combining general adblockers with tools like SponsorBlock is fine.' },
        items: [
          { name: 'uBlock Origin', url: 'https://github.com/nicehash/uBlock-Origin', desc: 'Adblocker / Recommended', starred: true },
          { name: 'AdGuard', url: 'https://adguard.com', desc: 'Adblocker / Alternative', starred: true },
          { name: 'SponsorBlock', url: 'https://sponsor.ajay.app', desc: 'Skip Sponsored YouTube Ads', starred: true },
          { name: 'Popup Blocker (strict)', url: 'https://github.com/nicehash/Popup-Blocker', desc: 'Popup Blockers' },
          { name: 'BehindTheOverlay', url: 'https://github.com/nicehash/BehindTheOverlay', desc: 'Hide Website Overlays' },
        ],
        subsections: [
          {
            title: 'Adblock Filters',
            items: [
              { name: 'FilterLists', url: 'https://filterlists.com', desc: 'Filter / Host List Directory' },
              { name: 'Hagezi Blocklists', url: 'https://github.com/nicehash/hagezi-blocklists', desc: 'Blocklist Collection' },
              { name: 'FMHY Filterlist', url: 'https://github.com/nicehash/FMHYFilterlist', desc: 'Unsafe Sites Filter' },
              { name: 'EasyList', url: 'https://easylist.to', desc: 'Standard Filter List' },
            ]
          },
          {
            title: 'DNS Adblocking',
            items: [
              { name: 'NextDNS', url: 'https://nextdns.io', desc: 'Customizable DNS Filtering / Free Tier' },
              { name: 'AdGuard DNS', url: 'https://adguard-dns.io', desc: 'DNS Adblocking' },
              { name: 'Pi-hole', url: 'https://pi-hole.net', desc: 'Network-wide DNS Adblocking' },
              { name: 'RethinkDNS', url: 'https://rethinkdns.com', desc: 'DNS + Firewall for Android' },
            ]
          },
          {
            title: 'Antivirus / Anti-Malware',
            items: [
              { name: 'Malwarebytes', url: 'https://malwarebytes.com', desc: 'Anti-Malware / Free Scan' },
              { name: 'VirusTotal', url: 'https://virustotal.com', desc: 'File / URL Scanner' },
              { name: 'Hybrid Analysis', url: 'https://hybrid-analysis.com', desc: 'Malware Analysis' },
              { name: 'Kaspersky Free', url: 'https://kaspersky.com', desc: 'Free Antivirus' },
            ]
          },
        ]
      },
      {
        title: 'Privacy / Security',
        items: [
          { name: 'PrivacyGuides', url: 'https://privacyguides.org', desc: 'Comprehensive Privacy Recommendations', starred: true },
          { name: 'EFF Surveillance Self-Defense', url: 'https://ssd.eff.org', desc: 'Digital Privacy Guide' },
          { name: 'PrivacyTests', url: 'https://privacytests.org', desc: 'Browser Privacy Tests' },
        ],
        subsections: [
          {
            title: 'VPN',
            items: [
              { name: 'Mullvad', url: 'https://mullvad.net', desc: 'Privacy VPN / No Email Needed', starred: true },
              { name: 'ProtonVPN', url: 'https://protonvpn.com', desc: 'Free VPN / Unlimited Bandwidth', starred: true },
              { name: 'Windscribe', url: 'https://windscribe.com', desc: 'Free VPN / 10GB Month' },
              { name: 'IVPN', url: 'https://ivpn.net', desc: 'Privacy VPN' },
            ]
          },
          {
            title: 'Encrypted Messengers',
            items: [
              { name: 'Signal', url: 'https://signal.org', desc: 'Encrypted Messenger / Recommended', starred: true },
              { name: 'Session', url: 'https://getsession.org', desc: 'Decentralized Messenger' },
              { name: 'Briar', url: 'https://briarproject.org', desc: 'P2P Encrypted Messenger' },
              { name: 'Element (Matrix)', url: 'https://element.io', desc: 'Decentralized Messenger' },
            ]
          },
          {
            title: 'Email Privacy',
            items: [
              { name: 'ProtonMail', url: 'https://proton.me/mail', desc: 'Encrypted Email / Free', starred: true },
              { name: 'Tuta', url: 'https://tuta.com', desc: 'Encrypted Email' },
              { name: 'SimpleLogin', url: 'https://simplelogin.io', desc: 'Email Aliases' },
            ]
          },
          {
            title: 'Password Privacy / 2FA',
            items: [
              { name: 'Bitwarden', url: 'https://bitwarden.com', desc: 'Password Manager / Free', starred: true },
              { name: 'KeePassXC', url: 'https://keepassxc.org', desc: 'Offline Password Manager' },
              { name: 'Authy', url: 'https://authy.com', desc: '2FA Authenticator' },
            ]
          },
          {
            title: 'Browsers',
            items: [
              { name: 'Brave', url: 'https://brave.com', desc: 'Privacy Browser / Built-in Ad Block', starred: true },
              { name: 'Firefox', url: 'https://firefox.com', desc: 'Open Source Browser' },
              { name: 'Tor Browser', url: 'https://torproject.org', desc: 'Anonymous Browsing' },
              { name: 'LibreWolf', url: 'https://librewolf.net', desc: 'Hardened Firefox Fork' },
            ]
          },
          {
            title: 'Browser Extensions',
            items: [
              { name: 'uBlock Origin', url: 'https://github.com/nicehash/uBlock-Origin', desc: 'Ad Blocker', starred: true },
              { name: 'Privacy Badger', url: 'https://privacybadger.org', desc: 'Tracker Blocker' },
              { name: 'ClearURLs', url: 'https://clearurls.githubusercontent.net', desc: 'Remove URL Tracking' },
              { name: 'LocalCDN', url: 'https://localcdn.org', desc: 'Prevent CDN Tracking' },
            ]
          },
        ]
      },
      {
        title: 'Proxy',
        subsections: [
          {
            title: 'Proxy Servers',
            items: [
              { name: 'SearXNG', url: 'https://searx.space', desc: 'Privacy Search Engine / Self-hostable' },
              { name: 'Caddy', url: 'https://caddyserver.com', desc: 'Reverse Proxy' },
            ]
          },
          {
            title: 'Anti Censorship',
            items: [
              { name: 'Psiphon', url: 'https://psiphon.ca', desc: 'Anti-Censorship Tool' },
              { name: 'Lantern', url: 'https://getlantern.org', desc: 'Open Internet Tool' },
              { name: 'Bridges', url: 'https://bridges.torproject.org', desc: 'Tor Bridges' },
            ]
          },
        ]
      },
    ]
  },

  {
    id: 'artificial-intelligence',
    title: 'Artificial Intelligence',
    description: 'AI Chatbots, Image Generators, AI Tools',
    sections: [
      {
        title: 'AI Chatbots',
        items: [
          { name: 'ChatGPT', url: 'https://chat.openai.com', desc: 'OpenAI Chatbot / Free Tier', starred: true },
          { name: 'Claude', url: 'https://claude.ai', desc: 'Anthropic Chatbot / Free Tier', starred: true },
          { name: 'Gemini', url: 'https://gemini.google.com', desc: 'Google AI / Free' },
          { name: 'Perplexity', url: 'https://perplexity.ai', desc: 'AI Search Engine with Citations', starred: true },
          { name: 'DeepSeek', url: 'https://chat.deepseek.com', desc: 'Chinese AI Chatbot / Free' },
          { name: 'Mistral Le Chat', url: 'https://chat.mistral.ai', desc: 'Mistral AI / Free' },
          { name: 'Grok', url: 'https://grok.com', desc: 'xAI Chatbot' },
        ]
      },
      {
        title: 'Image Generation',
        items: [
          { name: 'Stable Diffusion', url: 'https://stability.ai', desc: 'Open Source Image Gen', starred: true },
          { name: 'Bing Image Creator', url: 'https://www.bing.com/images/create', desc: 'Microsoft Free AI Image Gen', starred: true },
          { name: 'Leonardo AI', url: 'https://leonardo.ai', desc: 'AI Art Generation / Free Tier' },
          { name: 'Playground AI', url: 'https://playground.com', desc: 'AI Image Generation / Free Tier' },
          { name: 'Ideogram', url: 'https://ideogram.ai', desc: 'AI Image Gen / Text in Images' },
          { name: 'Flux', url: 'https://blackforestlabs.ai', desc: 'Open Source Image Model' },
        ]
      },
      {
        title: 'Video Generation',
        items: [
          { name: 'Runway ML', url: 'https://runwayml.com', desc: 'AI Video Generation / Free Tier' },
          { name: 'Pika', url: 'https://pika.art', desc: 'AI Video Generation / Free Tier' },
          { name: 'Kling AI', url: 'https://klingai.com', desc: 'AI Video Generation' },
          { name: 'Hailuo AI', url: 'https://hailuoai.video', desc: 'Free AI Video Generation' },
        ]
      },
      {
        title: 'AI Writing / Productivity',
        items: [
          { name: 'Notion AI', url: 'https://notion.so', desc: 'AI Writing in Notion / Free Tier' },
          { name: 'Gamma App', url: 'https://gamma.app', desc: 'AI Presentations / Free Tier' },
          { name: 'Sudowrite', url: 'https://sudowrite.com', desc: 'AI Writing Assistant' },
        ]
      },
      {
        title: 'AI Development',
        items: [
          { name: 'Hugging Face', url: 'https://huggingface.co', desc: 'Open Source AI Models / Datasets', starred: true },
          { name: 'Ollama', url: 'https://ollama.ai', desc: 'Run AI Models Locally', starred: true },
          { name: 'v0 by Vercel', url: 'https://v0.dev', desc: 'AI React UI Generation' },
          { name: 'Cursor', url: 'https://cursor.sh', desc: 'AI Code Editor / Free Tier' },
          { name: 'Continue', url: 'https://continue.dev', desc: 'AI Code Assistant / VS Code' },
          { name: 'LM Studio', url: 'https://lmstudio.ai', desc: 'Run Local AI Models' },
        ]
      },
      {
        title: 'AI Audio / TTS',
        items: [
          { name: 'ElevenLabs', url: 'https://elevenlabs.io', desc: 'AI Text-to-Speech / Free Tier', starred: true },
          { name: 'Suno AI', url: 'https://suno.com', desc: 'AI Music Generation / Free Tier' },
          { name: 'Udio', url: 'https://udio.com', desc: 'AI Music Generation' },
        ]
      },
    ]
  },

  {
    id: 'streaming',
    title: 'Movies / TV / Anime',
    description: 'Free Streaming, Anime, Subtitles, Trackers',
    sections: [
      {
        title: 'Free Streaming',
        tip: { type: 'tip', text: 'These are all legal, free, ad-supported streaming services. No account needed for most.' },
        items: [
          { name: 'Tubi', url: 'https://tubitv.com', desc: 'Thousands of free movies and shows', starred: true },
          { name: 'Pluto TV', url: 'https://pluto.tv', desc: '100+ live channels + on-demand', starred: true },
          { name: 'Plex Free', url: 'https://app.plex.tv', desc: 'Free streaming with live TV' },
          { name: 'Crackle', url: 'https://crackle.com', desc: 'Free movies from Sony' },
          { name: 'YouTube Free Movies', url: 'https://youtube.com/feed/storefront?bp=ogUCKAQ%3D', desc: 'Free ad-supported movies' },
          { name: 'Peacock Free', url: 'https://peacocktv.com', desc: 'Free tier with sports and shows' },
          { name: 'Kanopy', url: 'https://kanopy.com', desc: 'Free with library card' },
          { name: 'Filmrise', url: 'https://filmrise.com', desc: 'Free movies and TV series' },
          { name: 'Roku Channel', url: 'https://therokuchannel.roku.com', desc: 'Free movies, shows, live TV' },
          { name: 'Popcornflix', url: 'https://popcornflix.com', desc: 'Free movies and web originals' },
          { name: 'Vudu Free', url: 'https://vudu.com', desc: 'Free ad-supported movies' },
          { name: 'Internet Archive Movies', url: 'https://archive.org/details/movies', desc: 'Public domain movies' },
        ]
      },
      {
        title: 'Anime',
        subsections: [
          {
            title: 'Anime Streaming',
            items: [
              { name: 'Crunchyroll', url: 'https://crunchyroll.com', desc: 'Largest anime streaming / Free with ads', starred: true },
              { name: 'Anime-Planet', url: 'https://anime-planet.com', desc: 'Anime tracker + free legal streaming links' },
              { name: 'MyAnimeList', url: 'https://myanimelist.net', desc: 'Anime database + community' },
              { name: 'Aniwatch', url: 'https://aniwatch.to', desc: 'Free anime streaming' },
            ]
          },
          {
            title: 'Anime Tools',
            items: [
              { name: 'MAL Sync', url: 'https://github.com/MALSync/MAL-Sync', desc: 'Auto-sync anime with trackers' },
              { name: 'Anilist', url: 'https://anilist.co', desc: 'Anime tracking + discovery' },
            ]
          },
        ]
      },
      {
        title: 'Subtitles',
        items: [
          { name: 'OpenSubtitles', url: 'https://opensubtitles.org', desc: 'Largest subtitle database', starred: true },
          { name: 'Subscene', url: 'https://subscene.com', desc: 'Subtitles for movies and shows' },
          { name: 'Subdl', url: 'https://subdl.com', desc: 'Fast subtitle search' },
          { name: 'SubtitleCat', url: 'https://subtitlecat.com', desc: 'Multi-language subtitles' },
        ]
      },
      {
        title: 'Trackers / Trackers',
        items: [
          { name: 'IMDb', url: 'https://imdb.com', desc: 'Movie database / ratings', starred: true },
          { name: 'Letterboxd', url: 'https://letterboxd.com', desc: 'Social movie tracking' },
          { name: 'Trakt', url: 'https://trakt.tv', desc: 'Universal media tracker' },
          { name: 'JustWatch', url: 'https://justwatch.com', desc: 'Find where to stream anything' },
        ]
      },
    ]
  },

  {
    id: 'music-podcasts',
    title: 'Music / Podcasts / Radio',
    description: 'Music Streaming, Podcasts, Downloaders, Audio Tools',
    sections: [
      {
        title: 'Music Streaming',
        items: [
          { name: 'Spotify Free', url: 'https://spotify.com', desc: 'Free music streaming with ads', starred: true },
          { name: 'YouTube Music', url: 'https://music.youtube.com', desc: 'Free music with ads' },
          { name: 'SoundCloud', url: 'https://soundcloud.com', desc: 'Independent music streaming', starred: true },
          { name: 'Bandcamp', url: 'https://bandcamp.com', desc: 'Support independent artists' },
          { name: 'Pandora Free', url: 'https://pandora.com', desc: 'Free radio streaming' },
          { name: 'Internet Archive Audio', url: 'https://archive.org/details/audio', desc: 'Public domain music' },
        ]
      },
      {
        title: 'Podcasts',
        items: [
          { name: 'Podcast Index', url: 'https://podcastindex.org', desc: 'Open podcast directory', starred: true },
          { name: 'Pocket Casts', url: 'https://pocketcasts.com', desc: 'Best podcast app / Free' },
          { name: 'AntennaPod', url: 'https://antennapod.org', desc: 'Open source podcast app' },
          { name: 'Apple Podcasts', url: 'https://podcasts.apple.com', desc: 'Apple podcast directory' },
        ]
      },
      {
        title: 'Music Downloaders',
        items: [
          { name: 'yt-dlp', url: 'https://github.com/yt-dlp/yt-dlp', desc: 'Download audio from YouTube + 1000 sites', starred: true },
          { name: 'SpotDL', url: 'https://github.com/spotDL/spotify-downloader', desc: 'Download Spotify tracks as MP3', starred: true },
          { name: 'Deemix', url: 'https://deemix.app', desc: 'Download from Deezer' },
        ]
      },
      {
        title: 'Audio Tools',
        items: [
          { name: 'Audacity', url: 'https://audacityteam.org', desc: 'Free audio editor', starred: true },
          { name: 'LMMS', url: 'https://lmms.io', desc: 'Free music production software' },
          { name: 'MuseScore', url: 'https://musescore.org', desc: 'Free music notation' },
          { name: 'Equalizer APO', url: 'https://sourceforge.net/projects/equalizerapo', desc: 'Windows system-wide EQ' },
        ]
      },
    ]
  },

  {
    id: 'gaming',
    title: 'Gaming / Emulation',
    description: 'Free Games, Emulators, ROMs, Gaming Tools',
    sections: [
      {
        title: 'Free Games',
        items: [
          { name: 'Steam Free to Play', url: 'https://store.steampowered.com/genre/free-to-play', desc: 'Best free games on Steam', starred: true },
          { name: 'Epic Games Free', url: 'https://store.epicgames.com/en-US/free-games', desc: 'Free games every week', starred: true },
          { name: 'GOG Free Games', url: 'https://www.gog.com/en/games?priceRange=0,0', desc: 'DRM-free free games' },
          { name: 'itch.io Free Games', url: 'https://itch.io/games/free', desc: 'Indie games — thousands free' },
          { name: 'Prime Gaming', url: 'https://gaming.amazon.com', desc: 'Free games with Amazon Prime' },
        ]
      },
      {
        title: 'Emulators',
        items: [
          { name: 'RetroArch', url: 'https://retroarch.com', desc: 'Multi-system emulator / Recommended', starred: true },
          { name: 'OpenEmu', url: 'https://openemu.org', desc: 'Best Mac emulator' },
          { name: 'PCSX2', url: 'https://pcsx2.net', desc: 'PlayStation 2 emulator' },
          { name: 'DuckStation', url: 'https://github.com/stenzek/duckstation', desc: 'PlayStation 1 emulator' },
          { name: 'Cemu', url: 'https://cemu.info', desc: 'Wii U emulator' },
          { name: 'Yuzu', url: 'https://yuzu-emu.org', desc: 'Nintendo Switch emulator' },
          { name: 'Dolphin', url: 'https://dolphin-emu.org', desc: 'GameCube + Wii emulator' },
          { name: 'PPSSPP', url: 'https://ppsspp.org', desc: 'PSP emulator' },
        ]
      },
      {
        title: 'Gaming Tools',
        items: [
          { name: 'PCGamingWiki', url: 'https://pcgamingwiki.com', desc: 'Fix any PC game issue', starred: true },
          { name: 'ProtonDB', url: 'https://protondb.com', desc: 'Linux game compatibility' },
          { name: 'Can You Run It', url: 'https://systemrequirementslab.com', desc: 'Check if your PC can run a game' },
          { name: 'SteamDB', url: 'https://steamdb.info', desc: 'Steam game data and stats' },
        ]
      },
      {
        title: 'Cloud Gaming',
        items: [
          { name: 'GeForce NOW', url: 'https://play.geforce.now', desc: 'NVIDIA cloud gaming / Free tier', starred: true },
          { name: 'Xbox Cloud Gaming', url: 'https://xbox.com/play', desc: 'Cloud gaming with Game Pass' },
          { name: 'Boosteroid', url: 'https://boosteroid.com', desc: 'Cloud gaming service' },
        ]
      },
    ]
  },

  {
    id: 'reading',
    title: 'Books / Comics / Manga',
    description: 'Free Ebooks, Audiobooks, Comics, Manga, Textbooks',
    sections: [
      {
        title: 'Ebooks',
        items: [
          { name: 'Project Gutenberg', url: 'https://gutenberg.org', desc: '70,000+ free public domain ebooks', starred: true },
          { name: 'Open Library', url: 'https://openlibrary.org', desc: 'Free digital lending library', starred: true },
          { name: 'Standard Ebooks', url: 'https://standardebooks.org', desc: 'Beautifully formatted public domain ebooks' },
          { name: 'ManyBooks', url: 'https://manybooks.net', desc: 'Free ebooks in multiple formats' },
          { name: 'Internet Archive Books', url: 'https://archive.org/details/texts', desc: 'Millions of free books' },
          { name: 'Google Books', url: 'https://books.google.com', desc: 'Preview millions of books' },
          { name: 'Humble Bundle Books', url: 'https://www.humblebundle.com/books', desc: 'Pay-what-you-want ebook bundles' },
        ]
      },
      {
        title: 'Audiobooks',
        items: [
          { name: 'Librivox', url: 'https://librivox.org', desc: 'Free public domain audiobooks', starred: true },
          { name: 'Audible Free', url: 'https://audible.com', desc: 'Free audiobooks — free trial' },
          { name: 'Loyal Books', url: 'https://loyalbooks.com', desc: 'Free public domain audiobooks' },
        ]
      },
      {
        title: 'Manga / Comics',
        items: [
          { name: 'MangaDex', url: 'https://mangadex.org', desc: 'Free manga reader / community translated', starred: true },
          { name: 'ComicK', url: 'https://comick.io', desc: 'Free manga and comics reader' },
          { name: 'ReadComicOnline', url: 'https://readcomiconline.li', desc: 'Free comics reader' },
          { name: 'ComiXology Free', url: 'https://comixology.com', desc: 'Free comics from Amazon' },
        ]
      },
      {
        title: 'Textbooks',
        items: [
          { name: 'OpenStax', url: 'https://openstax.org', desc: 'Free peer-reviewed textbooks', starred: true },
          { name: 'Library Genesis', url: 'https://libgen.is', desc: 'Massive textbook library' },
          { name: 'FreeTextbooks', url: 'https://freeetextbooks.com', desc: 'Free textbook downloads' },
        ]
      },
      {
        title: 'Reading Tools',
        items: [
          { name: 'Calibre', url: 'https://calibre-ebook.com', desc: 'Free ebook management', starred: true },
          { name: 'KOReader', url: 'https://github.com/koreader/koreader', desc: 'Ebook reader for e-ink devices' },
          { name: 'YACReader', url: 'https://www.yacreader.com', desc: 'Best comic reader for PC' },
        ]
      },
    ]
  },

  {
    id: 'downloading',
    title: 'Downloading',
    description: 'Download Managers, Video Downloaders, File Sharing',
    sections: [
      {
        title: 'Video Downloaders',
        items: [
          { name: 'yt-dlp', url: 'https://github.com/yt-dlp/yt-dlp', desc: 'Best video downloader / 1000+ sites', starred: true },
          { name: 'Stacher', url: 'https://stacher.io', desc: 'yt-dlp GUI — easy video downloads', starred: true },
          { name: 'JDownloader', url: 'https://jdownloader.org', desc: 'Premium link downloader / Free' },
        ]
      },
      {
        title: 'Download Managers',
        items: [
          { name: 'Free Download Manager', url: 'https://freedownloadmanager.org', desc: 'Download accelerator + torrent client', starred: true },
          { name: 'Motrix', url: 'https://motrix.app', desc: 'Free download manager / HTTP, FTP, BitTorrent' },
          { name: 'aria2', url: 'https://aria2.github.io', desc: 'Command line download utility' },
          { name: 'Internet Download Manager', url: 'https://internetdownloadmanager.com', desc: 'Best download accelerator (paid)' },
        ]
      },
      {
        title: 'File Sharing',
        items: [
          { name: 'Mega', url: 'https://mega.nz', desc: 'Encrypted cloud storage / 20GB free', starred: true },
          { name: 'GoFile', url: 'https://gofile.io', desc: 'Free file sharing / No limits' },
          { name: 'File.io', url: 'https://file.io', desc: 'Temporary file sharing' },
          { name: 'WeTransfer', url: 'https://wetransfer.com', desc: 'File transfer / 2GB free' },
        ]
      },
    ]
  },

  {
    id: 'torrenting',
    title: 'Torrenting',
    description: 'Torrent Sites, Clients, Debrid Services, Privacy',
    sections: [
      {
        title: 'Torrent Clients',
        items: [
          { name: 'qBittorrent', url: 'https://qbittorrent.org', desc: 'Best free torrent client', starred: true },
          { name: 'Transmission', url: 'https://transmissionbt.com', desc: 'Lightweight torrent client' },
          { name: 'Deluge', url: 'https://deluge-torrent.org', desc: 'Plugin-based torrent client' },
          { name: 'Tixati', url: 'https://tixati.com', desc: 'Lightweight torrent client' },
        ]
      },
      {
        title: 'Torrent Sites',
        tip: { type: 'warning', text: 'Use a VPN when torrenting. These sites may contain malicious content — always check comments and seeders.' },
        items: [
          { name: '1337x', url: 'https://1337x.to', desc: 'Most popular torrent site' },
          { name: 'Nyaa', url: 'https://nyaa.si', desc: 'Anime torrents' },
          { name: 'RuTracker', url: 'https://rutracker.org', desc: 'Russian tracker / massive library' },
          { name: 'FitGirl Repacks', url: 'https://fitgirl-repacks.site', desc: 'Compressed game repacks' },
        ]
      },
      {
        title: 'Debrid Services',
        items: [
          { name: 'Real-Debrid', url: 'https://real-debrid.com', desc: 'Premium unrestricted downloads', starred: true },
          { name: 'AllDebrid', url: 'https://alldebrid.com', desc: 'Premium link downloader' },
          { name: 'Premiumize', url: 'https://premiumize.me', desc: 'All-in-one debrid service' },
        ]
      },
      {
        title: 'Torrent Privacy',
        items: [
          { name: 'Mullvad', url: 'https://mullvad.net', desc: 'Privacy VPN / P2P friendly', starred: true },
          { name: 'ProtonVPN', url: 'https://protonvpn.com', desc: 'Free VPN / P2P support' },
          { name: 'AirVPN', url: 'https://airvpn.org', desc: 'VPN for torrenting' },
        ]
      },
    ]
  },

  {
    id: 'educational',
    title: 'Educational',
    description: 'Free Courses, Coding, Languages, Research',
    sections: [
      {
        title: 'Free Courses',
        items: [
          { name: 'freeCodeCamp', url: 'https://freecodecamp.org', desc: 'Free coding bootcamp / Certifications', starred: true },
          { name: 'Khan Academy', url: 'https://khanacademy.org', desc: 'Free courses on every subject', starred: true },
          { name: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu', desc: 'MIT course materials / Free' },
          { name: 'CS50 Harvard', url: 'https://cs50.harvard.edu', desc: 'Harvard intro to CS / Free' },
          { name: 'The Odin Project', url: 'https://theodinproject.com', desc: 'Full stack web dev / Free curriculum' },
          { name: 'Coursera Free', url: 'https://coursera.org', desc: 'Audit courses from top universities' },
          { name: 'edX Free', url: 'https://edx.org', desc: 'University courses / Audit free' },
          { name: 'Udemy Free Courses', url: 'https://udemy.com/courses/?price=price-free', desc: 'Free courses on various topics' },
        ]
      },
      {
        title: 'Coding Practice',
        items: [
          { name: 'LeetCode', url: 'https://leetcode.com', desc: 'Coding problems / Free tier', starred: true },
          { name: 'Codecademy', url: 'https://codecademy.com', desc: 'Interactive coding lessons / Free tier' },
          { name: 'HackerRank', url: 'https://hackerrank.com', desc: 'Coding challenges' },
          { name: 'Codewars', url: 'https://codewars.com', desc: 'Code kata challenges' },
          { name: 'Exercism', url: 'https://exercism.org', desc: 'Free mentored coding practice' },
        ]
      },
      {
        title: 'Languages',
        items: [
          { name: 'Duolingo', url: 'https://duolingo.com', desc: 'Free language learning', starred: true },
          { name: 'Anki', url: 'https://apps.ankiweb.net', desc: 'Free flashcard app / Spaced repetition', starred: true },
          { name: 'Google Translate', url: 'https://translate.google.com', desc: 'Free translation / 100+ languages' },
          { name: 'DeepL', url: 'https://deepl.com', desc: 'AI translation / Better than Google' },
        ]
      },
      {
        title: 'Research / Papers',
        items: [
          { name: 'Google Scholar', url: 'https://scholar.google.com', desc: 'Academic paper search', starred: true },
          { name: 'Sci-Hub', url: 'https://sci-hub.se', desc: 'Free access to research papers' },
          { name: 'arXiv', url: 'https://arxiv.org', desc: 'Open access research papers' },
          { name: 'Semantic Scholar', url: 'https://semanticscholar.org', desc: 'AI-powered research search' },
        ]
      },
    ]
  },

  {
    id: 'android-ios',
    title: 'Android / iOS',
    description: 'Best Mobile Apps, Alternative App Stores, Mobile Tools',
    sections: [
      {
        title: 'Android Essentials',
        items: [
          { name: 'NewPipe', url: 'https://newpipe.net', desc: 'YouTube client / No ads, background play', starred: true },
          { name: 'F-Droid', url: 'https://f-droid.org', desc: 'Open source Android app store', starred: true },
          { name: 'Termux', url: 'https://termux.dev', desc: 'Linux terminal emulator for Android' },
          { name: 'Syncthing', url: 'https://syncthong.net', desc: 'P2P file sync / No cloud' },
          { name: 'Bitwarden', url: 'https://bitwarden.com', desc: 'Password manager / Syncs with desktop' },
          { name: 'Signal', url: 'https://signal.org', desc: 'Encrypted messaging / Best privacy' },
          { name: 'OsmAnd', url: 'https://osmand.net', desc: 'Offline maps / Free and open source' },
          { name: 'K-9 Mail', url: 'https://k9mail.app', desc: 'Open source email client' },
        ]
      },
      {
        title: 'Android Browsers',
        items: [
          { name: 'Brave', url: 'https://brave.com', desc: 'Privacy browser / Built-in ad block', starred: true },
          { name: 'Firefox', url: 'https://firefox.com', desc: 'Open source browser / Extensions' },
          { name: 'Bromite', url: 'https://bromite.org', desc: 'Chromium fork with ad blocking' },
          { name: 'Cromite', url: 'https://github.com/nicehash/cromite', desc: 'Chromium fork / Privacy focused' },
        ]
      },
      {
        title: 'Android File Managers',
        items: [
          { name: 'Material Files', url: 'https://github.com/nicehash/MaterialFiles', desc: 'Open source file manager' },
          { name: 'MiXplorer', url: 'https://mixplorer.com', desc: 'Powerful file manager' },
          { name: 'Solid Explorer', url: 'https://solidexplorer.com', desc: 'Dual-pane file manager' },
        ]
      },
      {
        title: 'iOS Essentials',
        tip: { type: 'tip', text: 'iOS is more restrictive. Most alternatives require sideloading via AltStore or similar.' },
        items: [
          { name: 'AltStore', url: 'https://altstore.io', desc: 'Sideload apps on iOS', starred: true },
          { name: 'Signal', url: 'https://signal.org', desc: 'Encrypted messaging' },
          { name: 'Firefox', url: 'https://firefox.com', desc: 'Browser with extensions' },
          { name: 'Bitwarden', url: 'https://bitwarden.com', desc: 'Password manager' },
        ]
      },
    ]
  },

  {
    id: 'linux-macos',
    title: 'Linux / macOS',
    description: 'Linux Distros, macOS Tools, Desktop Environments',
    sections: [
      {
        title: 'Linux Distros',
        items: [
          { name: 'Linux Mint', url: 'https://linuxmint.com', desc: 'Best distro for beginners', starred: true },
          { name: 'Fedora', url: 'https://fedoraproject.org', desc: 'Cutting-edge Linux / Stable' },
          { name: 'Arch Linux', url: 'https://archlinux.org', desc: 'DIY Linux / Rolling release' },
          { name: 'Ubuntu', url: 'https://ubuntu.com', desc: 'Most popular Linux distro' },
          { name: 'Pop!_OS', url: 'https://pop.system76.com', desc: 'NVIDIA-friendly Linux' },
          { name: 'NixOS', url: 'https://nixos.org', desc: 'Reproducible Linux' },
        ]
      },
      {
        title: 'Linux Tools',
        items: [
          { name: 'Flatpak', url: 'https://flatpak.org', desc: 'Universal Linux package manager', starred: true },
          { name: 'AppImage', url: 'https://appimage.org', desc: 'Portable Linux apps' },
          { name: 'Timeshift', url: 'https://github.com/nicehash/timeshift', desc: 'System backup / Restore' },
          { name: 'BleachBit', url: 'https://bleachbit.org', desc: 'System cleaner' },
          { name: 'GParted', url: 'https://gparted.org', desc: 'Partition editor' },
        ]
      },
      {
        title: 'macOS Tools',
        items: [
          { name: 'Homebrew', url: 'https://brew.sh', desc: 'Package manager for macOS', starred: true },
          { name: 'Raycast', url: 'https://raycast.com', desc: 'Productivity launcher / Free tier' },
          { name: 'Keka', url: 'https://www.keka.io', desc: 'File archiver for macOS' },
          { name: 'IINA', url: 'https://iina.io', desc: 'Modern media player for macOS' },
          { name: 'Rectangle', url: 'https://rectangleapp.com', desc: 'Window management / Free' },
        ]
      },
    ]
  },

  {
    id: 'miscellaneous',
    title: 'Miscellaneous',
    description: 'Useful Tools, Fun Sites, Everything Else',
    sections: [
      {
        title: 'Image Tools',
        items: [
          { name: 'TinyPNG', url: 'https://tinypng.com', desc: 'Free image compression', starred: true },
          { name: 'Remove.bg', url: 'https://remove.bg', desc: 'Remove image backgrounds / Free tier' },
          { name: 'Photopea', url: 'https://photopea.com', desc: 'Photoshop in your browser / Free', starred: true },
          { name: 'Canva Free', url: 'https://canva.com', desc: 'Free graphic design tool' },
          { name: 'Excalidraw', url: 'https://excalidraw.com', desc: 'Free whiteboard / Diagramming' },
          { name: 'Spline Design', url: 'https://spline.design', desc: 'Free 3D design tool' },
        ]
      },
      {
        title: 'Text / Writing Tools',
        items: [
          { name: 'Notion', url: 'https://notion.so', desc: 'Note-taking / Project management / Free', starred: true },
          { name: 'Obsidian', url: 'https://obsidian.md', desc: 'Knowledge base / Markdown / Free', starred: true },
          { name: 'Grammarly', url: 'https://grammarly.com', desc: 'AI writing assistant / Free tier' },
          { name: 'Hemingway Editor', url: 'https://hemingwayapp.com', desc: 'Writing improvement tool' },
        ]
      },
      {
        title: 'Productivity',
        items: [
          { name: '10minutemail', url: 'https://10minutemail.com', desc: 'Temporary disposable email', starred: true },
          { name: 'Temp Mail', url: 'https://temp-mail.org', desc: 'Disposable email / No signup' },
          { name: 'Regex101', url: 'https://regex101.com', desc: 'Free regex tester / Debugger' },
          { name: 'Carbon.now.sh', url: 'https://carbon.now.sh', desc: 'Beautiful code screenshots' },
          { name: 'Google Translate', url: 'https://translate.google.com', desc: 'Free translation / 100+ languages' },
        ]
      },
      {
        title: 'Fun / Entertainment',
        items: [
          { name: 'Neal.fun', url: 'https://neal.fun', desc: 'Interactive fun web experiments' },
          { name: 'Little Alchemy 2', url: 'https://littlealchemy2.com', desc: 'Combine elements game' },
          { name: 'GeoGuessr Free', url: 'https://geoguessr.com', desc: 'Guess location game / Free tier' },
          { name: 'Hole.io', url: 'https://hole-io.com', desc: 'Black hole io game' },
        ]
      },
    ]
  },

  // ===== TOOLS PAGES =====
  {
    id: 'system-tools',
    title: 'System Tools',
    description: 'System Tweaks, Hardware Tools, Windows ISOs, Customization',
    sections: [
      {
        title: 'System Tools',
        tip: { type: 'warning', text: 'It is not recommended to use debloaters unless you know what you are doing. Always research first, never just Apply All randomly.' },
        items: [
          { name: 'PowerToys', url: 'https://github.com/microsoft/PowerToys', desc: 'Microsoft system tools / Recommended', starred: true },
          { name: 'Sysinternals', url: 'https://learn.microsoft.com/en-us/sysinternals', desc: 'Advanced system tools' },
          { name: 'Bulk Crap Uninstaller', url: 'https://www.bcuninstaller.com', desc: 'Bulk uninstallation tool' },
          { name: 'BleachBit', url: 'https://bleachbit.org', desc: 'Clean system storage' },
          { name: 'CPU-Z', url: 'https://cpuid.com/softwares/cpu-z.html', desc: 'System info tool' },
          { name: 'GPU-Z', url: 'https://gpuz.techpowerup.com', desc: 'GPU info tool' },
          { name: 'CoreTemp', url: 'https://www.alcpu.com/CoreTemp', desc: 'CPU temperature monitor' },
        ],
        subsections: [
          {
            title: 'System Tweaks',
            items: [
              { name: 'Windhawk', url: 'https://windhawk.net', desc: 'System customization platform', starred: true },
              { name: 'Winaero', url: 'https://winaerotweaker.com', desc: 'Windows tweaking tool' },
              { name: 'StartAllBack', url: 'https://startallback.com', desc: 'Classic start menu / Windows 11' },
              { name: 'Open Shell', url: 'https://open-shell.com', desc: 'Classic start menu' },
              { name: 'EarTrumpet', url: 'https://eartrumpet.app', desc: 'Volume mixer replacement' },
              { name: 'AltSnap', url: 'https://github.com/nicehash/AltSnap', desc: 'Window dragging replacement' },
            ]
          },
          {
            title: 'Task Automation',
            items: [
              { name: 'AutoHotkey', url: 'https://autohotkey.com', desc: 'Windows automation scripting', starred: true },
              { name: 'AutoIt', url: 'https://www.autoitscript.com', desc: 'Windows automation scripting' },
              { name: 'n8n', url: 'https://n8n.io', desc: 'Workflow automation / Self-hostable' },
            ]
          },
          {
            title: 'Terminal / CLI',
            items: [
              { name: 'Windows Terminal', url: 'https://github.com/microsoft/terminal', desc: 'Best Windows terminal', starred: true },
              { name: 'Alacritty', url: 'https://alacritty.org', desc: 'Fast GPU-accelerated terminal' },
              { name: 'Starship', url: 'https://starship.rs', desc: 'Cross-shell prompt' },
              { name: 'Zsh', url: 'https://www.zsh.org', desc: 'Unix shell / Better than bash' },
            ]
          },
        ]
      },
      {
        title: 'Hardware Tools',
        items: [
          { name: 'HWiNFO', url: 'https://hwinfo.com', desc: 'Hardware info / monitoring', starred: true },
          { name: 'CrystalDiskInfo', url: 'https://crystalmark.info/en/software/crystaldiskinfo', desc: 'Disk health monitor' },
          { name: 'CrystalDiskMark', url: 'https://crystalmark.info/en/software/crystaldiskmark', desc: 'Disk benchmark' },
          { name: 'MemTest86', url: 'https://memtest86.com', desc: 'RAM testing' },
        ]
      },
      {
        title: 'Windows ISOs',
        items: [
          { name: 'Microsoft Media Creation Tool', url: 'https://www.microsoft.com/software-download', desc: 'Official Windows ISO / Recommended', starred: true },
          { name: 'Rufus', url: 'https://rufus.ie', desc: 'USB bootable creator' },
          { name: 'Ventoy', url: 'https://ventoy.net', desc: 'Multi-boot USB creator' },
        ]
      },
    ]
  },

  {
    id: 'file-tools',
    title: 'File Tools',
    description: 'File Managers, Archivers, Cloud Storage, Sync',
    sections: [
      {
        title: 'File Managers',
        items: [
          { name: 'Everything', url: 'https://www.voidtools.com', desc: 'Fastest file search for Windows', starred: true },
          { name: 'Total Commander', url: 'https://www.ghisler.com', desc: 'Dual-pane file manager' },
          { name: 'Double Commander', url: 'https://doublecmd.sourceforge.io', desc: 'Free dual-pane file manager' },
          { name: 'Files', url: 'https://files.community', desc: 'Modern Windows file manager' },
        ]
      },
      {
        title: 'File Archivers',
        items: [
          { name: '7-Zip', url: 'https://7-zip.org', desc: 'Best free file archiver', starred: true },
          { name: 'NanaZip', url: 'https://github.com/M2Team/NanaZip', desc: 'Modern 7-Zip fork' },
          { name: 'PeaZip', url: 'https://peazip.github.io', desc: 'Free file archiver' },
        ]
      },
      {
        title: 'Cloud Storage',
        items: [
          { name: 'Mega', url: 'https://mega.nz', desc: 'Encrypted / 20GB free', starred: true },
          { name: 'Google Drive', url: 'https://drive.google.com', desc: '15GB free' },
          { name: 'OneDrive', url: 'https://onedrive.live.com', desc: '5GB free / Microsoft' },
          { name: 'pCloud', url: 'https://pcloud.com', desc: '10GB free / Lifetime plans' },
        ]
      },
      {
        title: 'File Sync',
        items: [
          { name: 'Syncthing', url: 'https://syncthing.net', desc: 'P2P file sync / No cloud', starred: true },
          { name: 'Resilio Sync', url: 'https://www.reilio.com', desc: 'P2P file sync' },
          { name: 'FreeFileSync', url: 'https://freefilesync.org', desc: 'File sync / backup tool' },
        ]
      },
    ]
  },

  {
    id: 'internet-tools',
    title: 'Internet Tools',
    description: 'Browsers, Download Managers, Network Tools',
    sections: [
      {
        title: 'Browsers',
        items: [
          { name: 'Brave', url: 'https://brave.com', desc: 'Privacy browser / Built-in ad block', starred: true },
          { name: 'Firefox', url: 'https://firefox.com', desc: 'Open source / Customizable' },
          { name: 'Vivaldi', url: 'https://vivaldi.com', desc: 'Feature-rich browser' },
          { name: 'Floorp', url: 'https://floorp.app', desc: 'Firefox-based / Customizable' },
        ]
      },
      {
        title: 'Download Managers',
        items: [
          { name: 'Free Download Manager', url: 'https://freedownloadmanager.org', desc: 'Download accelerator + torrent client', starred: true },
          { name: 'Motrix', url: 'https://motrix.app', desc: 'Free download manager' },
          { name: 'aria2', url: 'https://aria2.github.io', desc: 'CLI download utility' },
        ]
      },
      {
        title: 'Network Tools',
        items: [
          { name: 'Wireshark', url: 'https://wireshark.org', desc: 'Network protocol analyzer', starred: true },
          { name: 'Fiddler', url: 'https://www.telerik.com/fiddler', desc: 'HTTP debugging proxy' },
          { name: 'Speedtest', url: 'https://speedtest.net', desc: 'Internet speed test' },
        ]
      },
    ]
  },

  {
    id: 'social-media-tools',
    title: 'Social Media Tools',
    description: 'Reddit, Twitter/X, Instagram, YouTube Tools',
    sections: [
      {
        title: 'Reddit Tools',
        items: [
          { name: 'Redlib', url: 'https://github.com/nicehash/redlib', desc: 'Privacy-friendly Reddit frontend', starred: true },
          { name: 'Reddit Enhancement Suite', url: 'https://redditenhancementsuite.com', desc: 'Browser extension / Better Reddit' },
          { name: 'Slide for Reddit', url: 'https://github.com/nicehash/slide', desc: 'Open source Reddit client' },
        ]
      },
      {
        title: 'YouTube Tools',
        items: [
          { name: 'SponsorBlock', url: 'https://sponsor.ajay.app', desc: 'Skip sponsored segments', starred: true },
          { name: 'Return YouTube Dislike', url: 'https://returnyoutubedislike.com', desc: 'Bring back dislikes' },
          { name: 'Unhook', url: 'https://unhook.app', desc: 'Remove YouTube recommendations' },
          { name: 'DeArrow', url: 'https://dearrow.app', desc: 'Crowdsourced video titles / Thumbnails' },
        ]
      },
      {
        title: 'Twitter / X Tools',
        items: [
          { name: 'Nitter', url: 'https://nitter.net', desc: 'Privacy-friendly Twitter frontend' },
          { name: 'BetterTweetdeck', url: 'https://github.com/nicehash/BetterTweetDeck', desc: 'Enhanced Twitter client' },
        ]
      },
    ]
  },

  {
    id: 'image-tools',
    title: 'Image Tools',
    description: 'Image Editors, Converters, Compressors, AI Image Gen',
    sections: [
      {
        title: 'Image Editors',
        items: [
          { name: 'GIMP', url: 'https://gimp.org', desc: 'Professional photo editor / Free', starred: true },
          { name: 'Photopea', url: 'https://photopea.com', desc: 'Photoshop in browser / Free', starred: true },
          { name: 'Krita', url: 'https://krita.org', desc: 'Digital painting / Free' },
          { name: 'Paint.NET', url: 'https://getpaint.net', desc: 'Simple image editor for Windows' },
          { name: 'Figma', url: 'https://figma.com', desc: 'Design tool / Free tier' },
        ]
      },
      {
        title: 'Image Tools',
        items: [
          { name: 'TinyPNG', url: 'https://tinypng.com', desc: 'Image compression', starred: true },
          { name: 'Remove.bg', url: 'https://remove.bg', desc: 'Remove backgrounds / Free tier' },
          { name: 'SVG Viewer', url: 'https://www.svgviewer.dev', desc: 'SVG viewer / editor' },
          { name: 'Squoosh', url: 'https://squoosh.app', desc: 'Image compression by Google' },
        ]
      },
      {
        title: 'Screenshots',
        items: [
          { name: 'ShareX', url: 'https://getsharex.com', desc: 'Best screenshot tool / Windows', starred: true },
          { name: 'Flameshot', url: 'https://flameshot.org', desc: 'Screenshot tool / Linux' },
          { name: 'Snipping Tool', url: 'https://www.microsoft.com/store/productId/9MZ95KL8M2FR', desc: 'Windows built-in screenshot' },
        ]
      },
    ]
  },

  {
    id: 'video-tools',
    title: 'Video Tools',
    description: 'Video Editors, Converters, Compressors, Screen Recorders',
    sections: [
      {
        title: 'Video Editors',
        items: [
          { name: 'DaVinci Resolve', url: 'https://blackmagicdesign.com', desc: 'Hollywood-grade editor / Free tier', starred: true },
          { name: 'Shotcut', url: 'https://shotcut.org', desc: 'Free video editor / No watermark' },
          { name: 'Kdenlive', url: 'https://kdenlive.org', desc: 'Free video editor / Open source' },
          { name: 'CapCut', url: 'https://capcut.com', desc: 'Easy video editor / Free' },
          { name: 'OBS Studio', url: 'https://obsproject.com', desc: 'Screen recording / Live streaming', starred: true },
        ]
      },
      {
        title: 'Video Converters / Compressors',
        items: [
          { name: 'FFmpeg', url: 'https://ffmpeg.org', desc: 'Command line video tool / Industry standard', starred: true },
          { name: 'HandBrake', url: 'https://handbrake.fr', desc: 'Video transcoder / Free' },
          { name: 'VLC', url: 'https://videolan.org', desc: 'Plays any format / Free' },
        ]
      },
      {
        title: 'Video Downloaders',
        items: [
          { name: 'yt-dlp', url: 'https://github.com/yt-dlp/yt-dlp', desc: 'Best video downloader / 1000+ sites', starred: true },
          { name: 'Stacher', url: 'https://stacher.io', desc: 'yt-dlp GUI' },
        ]
      },
    ]
  },

  {
    id: 'audio-tools',
    title: 'Audio Tools',
    description: 'Audio Editors, DAWs, Music Tools, TTS',
    sections: [
      {
        title: 'Audio Editors',
        items: [
          { name: 'Audacity', url: 'https://audacityteam.org', desc: 'Free audio editor / Recorder', starred: true },
          { name: 'Ocenaudio', url: 'https://www.ocenaudio.com', desc: 'Easy audio editor' },
        ]
      },
      {
        title: 'DAWs (Music Production)',
        items: [
          { name: 'LMMS', url: 'https://lmms.io', desc: 'Free music production software', starred: true },
          { name: 'Cakewalk', url: 'https://www.bandlab.com/products/cakewalk', desc: 'Free professional DAW' },
          { name: 'Ardour', url: 'https://ardour.org', desc: 'Open source DAW' },
          { name: 'MuseScore', url: 'https://musescore.org', desc: 'Music notation / Free' },
        ]
      },
      {
        title: 'Audio Tools',
        items: [
          { name: 'Equalizer APO', url: 'https://sourceforge.net/projects/equalizerapo', desc: 'Windows system-wide EQ', starred: true },
          { name: 'VoiceMeeter', url: 'https://vb-audio.com/Voicemeeter', desc: 'Virtual audio mixer' },
          { name: 'mpv', url: 'https://mpv.io', desc: 'Minimalist media player' },
        ]
      },
      {
        title: 'Text-to-Speech',
        items: [
          { name: 'ElevenLabs', url: 'https://elevenlabs.io', desc: 'AI TTS / Free tier', starred: true },
          { name: 'Edge TTS', url: 'https://github.com/rany2/edge-tts', desc: 'Microsoft Edge TTS / Free' },
          { name: 'Piper', url: 'https://github.com/rhasspy/piper', desc: 'Local TTS / Open source' },
        ]
      },
    ]
  },

  {
    id: 'developer-tools',
    title: 'Developer Tools',
    description: 'Code Editors, APIs, DevOps, Programming Resources',
    sections: [
      {
        title: 'Code Editors',
        items: [
          { name: 'VS Code', url: 'https://code.visualstudio.com', desc: 'Best free code editor', starred: true },
          { name: 'Cursor', url: 'https://cursor.sh', desc: 'AI code editor / Free tier' },
          { name: 'Zed', url: 'https://zed.dev', desc: 'Fast code editor / Open source' },
          { name: 'Neovim', url: 'https://neovim.io', desc: 'Vim-based editor / Terminal' },
        ]
      },
      {
        title: 'API Testing',
        items: [
          { name: 'Postman', url: 'https://postman.com', desc: 'API development platform / Free tier', starred: true },
          { name: 'Insomnia', url: 'https://insomnia.rest', desc: 'API client / Open source' },
          { name: 'HTTPie', url: 'https://httpie.io', desc: 'Modern CLI HTTP client' },
        ]
      },
      {
        title: 'Git Tools',
        items: [
          { name: 'GitHub', url: 'https://github.com', desc: 'Code hosting / Free', starred: true },
          { name: 'GitKraken', url: 'https://www.gitkraken.com', desc: 'Git GUI client / Free tier' },
          { name: 'Sourcetree', url: 'https://www.sourcetreeapp.com', desc: 'Free Git GUI' },
        ]
      },
      {
        title: 'DevOps / Deployment',
        items: [
          { name: 'Vercel', url: 'https://vercel.com', desc: 'Frontend deployment / Free tier', starred: true },
          { name: 'Cloudflare Pages', url: 'https://pages.cloudflare.com', desc: 'Static site hosting / Free' },
          { name: 'Railway', url: 'https://railway.app', desc: 'App hosting / Free tier' },
          { name: 'Docker', url: 'https://docker.com', desc: 'Containerization platform / Free' },
        ]
      },
      {
        title: 'Programming Resources',
        items: [
          { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', desc: 'Web development documentation', starred: true },
          { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: 'Programming Q&A' },
          { name: 'W3Schools', url: 'https://w3schools.com', desc: 'Web development tutorials' },
          { name: 'Roadmap.sh', url: 'https://roadmap.sh', desc: 'Developer learning roadmaps' },
        ]
      },
    ]
  },

  {
    id: 'educational-tools',
    title: 'Educational Tools',
    description: 'Note-taking, Flashcards, Learning Platforms',
    sections: [
      {
        title: 'Note-taking',
        items: [
          { name: 'Obsidian', url: 'https://obsidian.md', desc: 'Knowledge base / Markdown / Free', starred: true },
          { name: 'Notion', url: 'https://notion.so', desc: 'All-in-one workspace / Free tier' },
          { name: 'Logseq', url: 'https://logseq.com', desc: 'Open source knowledge base' },
          { name: 'Joplin', url: 'https://joplinapp.org', desc: 'Open source note-taking / Evernote alternative' },
        ]
      },
      {
        title: 'Flashcards / Study',
        items: [
          { name: 'Anki', url: 'https://apps.ankiweb.net', desc: 'Spaced repetition flashcards / Free', starred: true },
          { name: 'Quizlet', url: 'https://quizlet.com', desc: 'Flashcard platform / Free tier' },
          { name: 'Remnote', url: 'https://remnote.com', desc: 'Note-taking + flashcards / Free tier' },
        ]
      },
      {
        title: 'Learning Platforms',
        items: [
          { name: 'Khan Academy', url: 'https://khanacademy.org', desc: 'Free courses on every subject', starred: true },
          { name: 'freeCodeCamp', url: 'https://freecodecamp.org', desc: 'Free coding bootcamp' },
          { name: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu', desc: 'MIT courses / Free' },
          { name: 'The Odin Project', url: 'https://theodinproject.com', desc: 'Full stack web dev / Free' },
        ]
      },
    ]
  },
]