class StreamVerse {
  constructor() {
    this.channels = [];
    this.categories = [];
    this.currentFilter = 'all';
    this.currentSearch = '';
    this.currentChannelIndex = -1;

    // Infinite scroll
    this.batchSize = 48;       // how many cards to add per load
    this.renderedCount = 0;    // how many cards already on screen
    this.filteredChannels = []; // after filter/search

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
    this.searchInput = document.getElementById('searchInput');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.channelCount = document.getElementById('channelCount');
    this.validatedOnly = document.getElementById('validatedOnly');
    this.validationStatus = document.getElementById('validationStatus');
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
    this.categoryFilter.addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.applyFiltersAndRender(true);
    });

    const debounced = this.debounce(() => this.applyFiltersAndRender(true), 250);
    this.searchInput.addEventListener('input', (e) => {
      this.currentSearch = e.target.value || '';
      debounced();
    });

    this.validatedOnly.addEventListener('change', () => {
      this.loadData();
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

    setInterval(() => this.updateValidationStatus(), 5000);
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

      const validated = this.validatedOnly.checked;
      const categoriesRes = await fetch(`/api/categories?validated=${validated}`);
      this.categories = await categoriesRes.json();
      this.populateCategories();

      await this.loadChannelsFromAPI();
      await this.updateValidationStatus();
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

  async updateValidationStatus() {
    try {
      const response = await fetch('/api/validation-status');
      const status = await response.json();

      if (status.validationInProgress) {
        this.validationStatus.className = 'validation-status checking';
        this.validationStatus.innerHTML = `
          <i class="fas fa-spinner"></i>
          <span>Verifying channels... ${status.validatedCount}/${Math.min(status.totalChannels, 800)}</span>
        `;
      } else {
        this.validationStatus.className = 'validation-status complete';
        this.validationStatus.innerHTML = `
          <i class="fas fa-check-circle"></i>
          <span>${status.validatedCount} verified channels</span>
        `;
      }
    } catch (e) {
      console.error('validation status error', e);
    }
  }

  populateCategories() {
    this.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    this.categories.forEach(category => {
      const opt = document.createElement('option');
      opt.value = category;
      opt.textContent = category;
      this.categoryFilter.appendChild(opt);
    });
  }

  async loadChannelsFromAPI() {
    const params = new URLSearchParams();
    if (this.currentFilter !== 'all') params.append('category', this.currentFilter);
    if (this.currentSearch) params.append('search', this.currentSearch);
    if (this.validatedOnly.checked) params.append('validated', 'true');

    const response = await fetch(`/api/channels?${params}`);
    const data = await response.json();
    this.channels = data.channels || [];

    const statusText = this.validatedOnly.checked ? 'verified' : 'total';
    this.channelCount.textContent = `${this.channels.length} ${statusText} channels`;
  }

  applyFiltersAndRender(reset) {
    // client-side filter/search for instant UI (API already filters, this is extra safe)
    const q = this.currentSearch.trim().toLowerCase();

    this.filteredChannels = this.channels.filter(ch => {
      const okCat = (this.currentFilter === 'all') ? true : (String(ch.category).toLowerCase() === String(this.currentFilter).toLowerCase());
      const okSearch = !q ? true : (String(ch.name).toLowerCase().includes(q));
      return okCat && okSearch;
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
          ${this.validatedOnly.checked ? `<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>` : ''}
          ${channel.source ? `<span class="source-badge">${this.escapeHtml(String(channel.source).split(' ')[0])}</span>` : ''}
        </div>
      `;

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
