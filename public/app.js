class StreamVerse {
  constructor() {
    this.channels = [];
    this.categories = [];
    this.countries = [];
    this.currentFilter = 'all';
    this.currentCountry = 'all';
    this.currentSearch = '';
    this.currentChannelIndex = -1;

    // Infinite scroll
    this.batchSize = 48;        // how many cards to add per load
    this.renderedCount = 0;     // how many cards already on screen
    this.filteredChannels = []; // after filter/search
    this.countrySet = new Set();

    this.userClosedPlayer = false;
    this.autoSwitchEnabled = true;

    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.setupInfiniteScroll();
    this.loadData();
  }

  bindElements() {
    this.channelsGrid = document.getElementById('channelsGrid');
    this.categoryFilter = document.getElementById('categoryFilter');
    this.countryFilter = document.getElementById('countryFilter');
    this.searchInput = document.getElementById('searchInput');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.channelCount = document.getElementById('channelCount');
    this.sourceInfo = document.getElementById('sourceInfo');

    this.playerModal = document.getElementById('playerModal');
    this.videoPlayer = document.getElementById('videoPlayer');
    this.playerTitle = document.getElementById('playerTitle');
    this.closePlayer = document.getElementById('closePlayer');

    // Hide old pagination if exists
    const pag = document.getElementById('paginationControls');
    if (pag) pag.style.display = 'none';
  }

  bindEvents() {
    if (this.categoryFilter) {
      this.categoryFilter.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.reloadChannelsForFilters();
      });
    }

    if (this.countryFilter) {
      this.countryFilter.addEventListener('change', (e) => {
        this.currentCountry = e.target.value;
        this.reloadChannelsForFilters();
      });
    }

    const debounced = this.debounce(() => this.applyFiltersAndRender(true), 250);
    this.searchInput.addEventListener('input', (e) => {
      this.currentSearch = e.target.value || '';
      debounced();
    });

    this.refreshBtn.addEventListener('click', () => {
      this.loadData();
    });

    this.closePlayer.addEventListener('click', () => this.closeVideoPlayer());

    this.playerModal.addEventListener('click', (e) => {
      if (e.target === this.playerModal) this.closeVideoPlayer();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeVideoPlayer();
    });

  }

  setupInfiniteScroll() {
    // sentinel at the bottom of the grid
    this.sentinel = document.createElement('div');
    this.sentinel.id = 'scrollSentinel';
    this.sentinel.style.height = '1px';
    this.sentinel.style.width = '100%';

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        this.renderNextBatch();
      }
    }, { root: null, rootMargin: '800px', threshold: 0 });

    // we append after first render
    this.infiniteObserver = observer;
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  async loadData() {
    try {
      this.showLoading();

      const filtersRes = await fetch(`/api/categories`);
      const filters = await filtersRes.json();
      this.categories = filters.categories || [];
      this.countries = filters.countries || [];
      this.countrySet = new Set((this.countries || []).map((country) => country.toLowerCase()));
      this.populateFilters();

      await this.loadChannelsFromAPI();
      await this.loadSourceInfo();

      this.applyFiltersAndRender(true);
    } catch (e) {
      console.error(e);
      this.showError('Failed to load channels. Refresh and try again.');
    }
  }

  async loadSourceInfo() {
    try {
      const response = await fetch('/api/sources');
      const data = await response.json();

      const activeSources = data.sources.filter(s => s.stats.status === 'success').length;
      const totalSources = data.sources.length;

      this.sourceInfo.innerHTML = `
        <i class="fas fa-database"></i>
        <span>${activeSources}/${totalSources} sources active</span>
      `;
    } catch (e) {
      console.error('source info error', e);
    }
  }

  populateFilters() {
    this.populateSelect(this.categoryFilter, this.categories, 'All Categories', this.currentFilter);
    this.populateSelect(this.countryFilter, this.countries, 'All Countries', this.currentCountry);
  }

  populateSelect(selectEl, values = [], placeholder, currentValue) {
    if (!selectEl) return;

    const previousValue = currentValue || 'all';
    selectEl.innerHTML = `<option value="all">${placeholder}</option>`;

    values.forEach((value) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      selectEl.appendChild(opt);
    });

    if (previousValue !== 'all' && values.includes(previousValue)) {
      selectEl.value = previousValue;
    } else {
      selectEl.value = 'all';
      if (selectEl === this.categoryFilter) this.currentFilter = 'all';
      if (selectEl === this.countryFilter) this.currentCountry = 'all';
    }
  }

  async loadChannelsFromAPI() {
    const params = new URLSearchParams();
    if (this.currentFilter !== 'all') params.append('category', this.currentFilter);
    if (this.currentCountry !== 'all') params.append('country', this.currentCountry);
    if (this.currentSearch) params.append('search', this.currentSearch);
    const query = params.toString();
    const response = await fetch(query ? `/api/channels?${query}` : '/api/channels');
    const data = await response.json();
    this.channels = data.channels || [];

    // Server may block insecure (http) streams when site is on https.
    // Expose a small hint in UI so users understand why counts may differ.
    this.blockedInsecure = data.blockedInsecure || 0;
    this.proxiedStreams = data.proxiedStreams || 0;

    let extra = '';
    if (this.blockedInsecure > 0) {
      extra = ` (blocked ${this.blockedInsecure} insecure)`;
    } else if (this.proxiedStreams > 0) {
      extra = ` (secured ${this.proxiedStreams} via proxy)`;
    }
    this.channelCount.textContent = `${this.channels.length} channels${extra}`;
  }

  async reloadChannelsForFilters() {
    try {
      this.showLoading();
      await this.loadChannelsFromAPI();
      this.applyFiltersAndRender(true);
    } catch (e) {
      console.error('filter reload error', e);
      this.showError('Failed to load channels. Refresh and try again.');
    }
  }

  applyFiltersAndRender(reset) {
    // client-side filter/search for instant UI (API already filters, this is extra safe)
    const q = this.currentSearch.trim().toLowerCase();
    const selectedCategory = this.currentFilter.toLowerCase();
    const selectedCountry = this.currentCountry.toLowerCase();

    this.filteredChannels = this.channels.filter(ch => {
      const tags = this.getChannelTags(ch);
      const okCat = (this.currentFilter === 'all')
        ? true
        : tags.categories.some(cat => cat.toLowerCase() === selectedCategory);

      const okCountry = (this.currentCountry === 'all')
        ? true
        : tags.countries.some(ctry => ctry.toLowerCase() === selectedCountry);

      const okSearch = !q ? true : (String(ch.name).toLowerCase().includes(q));
      return okCat && okCountry && okSearch;
    });

    if (reset) {
      this.channelsGrid.innerHTML = '';
      this.renderedCount = 0;

      // ensure sentinel exists at bottom
      if (!this.channelsGrid.contains(this.sentinel)) {
        this.channelsGrid.appendChild(this.sentinel);
      }
      this.infiniteObserver.observe(this.sentinel);
    }

    if (this.filteredChannels.length === 0) {
      this.channelsGrid.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>No channels found. Try another search/filter.</p>
        </div>
      `;
      return;
    }

    this.renderNextBatch();
  }

  getChannelTags(channel) {
    if (!channel) return { categories: [], countries: [] };

    const tokens = String(channel.category || '')
      .split(';')
      .map(token => token.trim())
      .filter(Boolean);

    const categories = [];
    const countries = [];
    const seenCategories = new Set();
    const seenCountries = new Set();

    tokens.forEach((token) => {
      const normalized = token.toLowerCase();
      if (this.countrySet.has(normalized)) {
        if (!seenCountries.has(normalized)) {
          countries.push(token);
          seenCountries.add(normalized);
        }
      } else if (!seenCategories.has(normalized)) {
        categories.push(token);
        seenCategories.add(normalized);
      }
    });

    return { categories, countries };
  }

  getChannelShareLink(channel) {
    if (!channel?.url) {
      return window.location.origin;
    }

    try {
      if (channel.url.startsWith('http')) {
        return channel.url;
      }
      return `${window.location.origin}${channel.url}`;
    } catch {
      return window.location.origin;
    }
  }

  async shareChannel(channel) {
    if (!channel) return;
    const shareUrl = this.getChannelShareLink(channel);
    const title = channel.name || 'StreamVerse Channel';
    const text = `Watch ${title} on StreamVerse`;
    const shareData = { title, text, url: shareUrl };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.warn('native share failed', err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Channel link copied! Share it with your friends.');
    } catch (err) {
      console.warn('clipboard share failed', err);
      window.prompt('Copy this link and share it:', shareUrl);
    }
  }

  renderNextBatch() {
    if (!this.filteredChannels || this.filteredChannels.length === 0) return;
    if (this.renderedCount >= this.filteredChannels.length) return;

    const next = this.filteredChannels.slice(this.renderedCount, this.renderedCount + this.batchSize);
    const frag = document.createDocumentFragment();

    next.forEach((channel) => {
      const idx = this.channels.indexOf(channel); // index for playChannel

      const card = document.createElement('div');
      card.className = 'channel-card';
      card.onclick = () => this.playChannel(idx);

      const safeName = this.escapeHtml(channel.name || 'Unknown');
      const safeCat = this.escapeHtml(channel.category || 'General');

      card.innerHTML = `
        <img class="channel-logo"
          src="${channel.logo || ''}"
          alt="${safeName}"
          onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxMiIgZmlsbD0iIzNiODJmNiIvPjx0ZXh0IHg9IjMyIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+VFY8L3RleHQ+PC9zdmc+'">
        <div class="channel-name">${safeName}</div>
        <div class="channel-info">
          <span class="channel-category">${safeCat}</span>
          ${channel.source ? `<span class="source-badge">${this.escapeHtml(String(channel.source).split(' ')[0])}</span>` : ''}
        </div>
      `;

      const shareBtn = document.createElement('button');
      shareBtn.className = 'share-btn';
      shareBtn.type = 'button';
      shareBtn.title = 'Share this channel';
      shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shareChannel(channel);
      });
      card.appendChild(shareBtn);

      frag.appendChild(card);
    });

    // insert before sentinel, so sentinel stays last
    this.channelsGrid.insertBefore(frag, this.sentinel);

    this.renderedCount += next.length;
  }

  async playChannel(index) {
    const channel = this.channels[index];
    if (!channel) return;

    this.userClosedPlayer = false;
    this.currentChannelIndex = index;

    // get alternatives
    let alternatives = [];
    try {
      const r = await fetch(`/api/channel/${channel.id}/alternatives`);
      const data = await r.json();
      alternatives = data.alternatives || [];
    } catch {}

    this.playChannelSource(channel, alternatives, 0);
  }

  playChannelSource(channelSource, alternatives, altIndex) {
    if (!channelSource || this.userClosedPlayer) return;

    // Avoid mixed-content: browsers block http audio/video inside https pages.
    const pageIsHttps = window.location.protocol === 'https:';
    const urlStr = typeof channelSource.url === 'string' ? channelSource.url : '';
    const urlIsSecure = urlStr.startsWith('/') || urlStr.toLowerCase().startsWith('https://');
    if (pageIsHttps && !urlIsSecure) {
      // Try next alternative immediately.
      if (altIndex < alternatives.length) {
        return this.playChannelSource(alternatives[altIndex], alternatives, altIndex + 1);
      }
      // Nothing secure available.
      this.playerModal.style.display = 'flex';
      this.playerTitle.textContent = `${channelSource.name} (no secure stream available)`;
      this.videoPlayer.pause();
      this.videoPlayer.removeAttribute('src');
      this.videoPlayer.load();
      alert('This channel only has insecure (HTTP) streams, which browsers block on HTTPS sites. Try another channel.');
      return;
    }

    this.playerTitle.textContent = `${channelSource.name} (${channelSource.source || 'source'})`;
    this.videoPlayer.src = channelSource.url;
    this.playerModal.style.display = 'flex';

    this.videoPlayer.onloadeddata = null;
    this.videoPlayer.onerror = null;

    this.videoPlayer.onerror = () => {
      if (this.userClosedPlayer) return;

      // try next alternative
      if (altIndex < alternatives.length) {
        const nextAlt = alternatives[altIndex];
        this.playerTitle.textContent = `Switching source... (${nextAlt.source || 'alt'})`;
        setTimeout(() => this.playChannelSource(nextAlt, alternatives, altIndex + 1), 800);
        return;
      }

      // try next channel (optional)
      if (this.autoSwitchEnabled && this.channels.length > 1) {
        const nextIndex = (this.currentChannelIndex + 1) % this.channels.length;
        this.playChannel(nextIndex);
      } else {
        alert('Stream unavailable for this channel.');
      }
    };

    // timeout safety
    setTimeout(() => {
      if (this.videoPlayer.readyState === 0 && !this.userClosedPlayer) {
        this.videoPlayer.onerror?.();
      }
    }, 12000);
  }

  closeVideoPlayer() {
    this.userClosedPlayer = true;
    this.playerModal.style.display = 'none';
    this.videoPlayer.pause();
    this.videoPlayer.src = '';
  }

  showLoading() {
    this.channelsGrid.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading channels...</p>
      </div>
    `;
    this.channelCount.textContent = 'Loading...';
  }

  showError(msg) {
    this.channelsGrid.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${msg}</p>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new StreamVerse();
});
