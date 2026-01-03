class StreamVerse {
    constructor() {
        this.channels = [];
        this.categories = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.currentChannelIndex = -1;
        this.currentChannel = null;
        this.currentAlternatives = [];
        this.currentAlternativeIndex = 0;
        this.userClosedPlayer = false;
        this.autoSwitchEnabled = true;

        // Infinite scroll config
        this.channelsPerBatch = 48;     // how many cards to add each time
        this.renderedCount = 0;         // how many currently rendered
        this.filteredChannels = [];     // result after API + filters
        this.isAppending = false;

        // Engagement tracking
        this.popularChannels = this.loadPopularChannels();
        this.searchHistory = this.loadSearchHistory();
        this.sessionStart = Date.now();
        this.channelsViewed = 0;

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

        // Pagination elements (we will hide these)
        this.paginationControls = document.getElementById('paginationControls');
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        this.pageInfo = document.getElementById('pageInfo');
        this.pageStats = document.getElementById('pageStats');
    }

    bindEvents() {
        this.categoryFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.loadChannels(); // re-fetch (as your API supports category/search/validated)
        });

        this.searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.debounce(() => {
                this.loadChannels();
                if (this.currentSearch.length > 2) {
                    this.addToSearchHistory(this.currentSearch);
                }
            }, 300)();
        });

        this.validatedOnly.addEventListener('change', () => {
            this.loadData(); // categories depend on validated flag
        });

        this.refreshBtn.addEventListener('click', () => {
            this.loadData();
        });

        this.closePlayer.addEventListener('click', () => {
            this.closeVideoPlayer();
        });

        this.playerModal.addEventListener('click', (e) => {
            if (e.target === this.playerModal) {
                this.closeVideoPlayer();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeVideoPlayer();
            }
        });

        // Check validation status periodically
        setInterval(() => this.updateValidationStatus(), 5000);

        // Load source information
        this.loadSourceInfo();

        // Track engagement
        this.trackEngagement();
    }

    setupInfiniteScroll() {
        // Hide pagination UI completely (not needed)
        if (this.paginationControls) {
            this.paginationControls.style.display = 'none';
        }

        // Create sentinel element after grid
        this.sentinel = document.createElement('div');
        this.sentinel.id = 'infiniteSentinel';
        this.sentinel.style.height = '1px';
        this.sentinel.style.width = '100%';

        // Insert after channelsGrid
        this.channelsGrid.parentNode.insertBefore(this.sentinel, this.channelsGrid.nextSibling);

        // IntersectionObserver triggers when user scrolls near bottom
        this.io = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting) return;
                this.appendNextBatch();
            },
            { root: null, rootMargin: '900px 0px', threshold: 0 }
        );

        this.io.observe(this.sentinel);
    }

    // --------------------------
    // Popular channels management
    // --------------------------
    loadPopularChannels() {
        const stored = localStorage.getItem('funtv_popular');
        return stored ? JSON.parse(stored) : {};
    }

    savePopularChannels() {
        localStorage.setItem('funtv_popular', JSON.stringify(this.popularChannels));
    }

    trackChannelView(channelId) {
        this.popularChannels[channelId] = (this.popularChannels[channelId] || 0) + 1;
        this.savePopularChannels();
        this.channelsViewed++;
    }

    // --------------------------
    // Search history management
    // --------------------------
    loadSearchHistory() {
        const stored = localStorage.getItem('funtv_search_history');
        return stored ? JSON.parse(stored) : [];
    }

    saveSearchHistory() {
        localStorage.setItem('funtv_search_history', JSON.stringify(this.searchHistory.slice(-10)));
    }

    addToSearchHistory(query) {
        if (query && query.length > 2) {
            this.searchHistory = this.searchHistory.filter(item => item !== query);
            this.searchHistory.unshift(query);
            this.saveSearchHistory();
        }
    }

    // --------------------------
    // Engagement tracking
    // --------------------------
    trackEngagement() {
        setInterval(() => {
            const timeSpent = Math.floor((Date.now() - this.sessionStart) / 1000);
            console.log(`Session time: ${timeSpent}s, Channels viewed: ${this.channelsViewed}`);
        }, 30000);

        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const denom = (document.documentElement.scrollHeight - window.innerHeight);
            if (denom <= 0) return;
            const scrollPercent = Math.round((window.scrollY / denom) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (scrollPercent >= 25 && scrollPercent % 25 === 0) {
                    console.log(`Scroll depth: ${scrollPercent}%`);
                }
            }
        });
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
        } catch (error) {
            console.error('Error loading source info:', error);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    async loadData() {
        try {
            this.showLoading();

            // Load categories (depends on validated toggle)
            const validated = this.validatedOnly.checked;
            const categoriesRes = await fetch(`/api/categories?validated=${validated}`);
            this.categories = await categoriesRes.json();
            this.populateCategories();

            // Load channels
            await this.loadChannels();

            // Update status widgets
            this.updateValidationStatus();
            this.loadSourceInfo();

            this.hideLoading();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please try again.');
            this.hideLoading();
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

                if (status.sourceBreakdown) {
                    const topSources = Object.entries(status.sourceBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 2)
                        .map(([source, count]) => `${source.split(' ')[0]}: ${count}`)
                        .join(', ');

                    if (topSources) {
                        this.validationStatus.innerHTML += `<br><small style="opacity: 0.8;">${topSources}</small>`;
                    }
                }
            }
        } catch (error) {
            console.error('Error updating validation status:', error);
        }
    }

    populateCategories() {
        this.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.categoryFilter.appendChild(option);
        });
    }

    async loadChannels() {
        try {
            const params = new URLSearchParams();

            if (this.currentFilter !== 'all') params.append('category', this.currentFilter);
            if (this.currentSearch) params.append('search', this.currentSearch);
            if (this.validatedOnly.checked) params.append('validated', 'true');

            const response = await fetch(`/api/channels?${params}`);
            const data = await response.json();

            this.channels = data.channels || [];
            this.updateChannelCount(data);

            // Reset infinite scroll state + first render
            this.resetInfiniteGrid();
        } catch (error) {
            console.error('Error loading channels:', error);
            this.showError('Failed to load channels.');
        }
    }

    updateChannelCount(data) {
        const statusText = this.validatedOnly.checked ? 'verified' : 'total';
        const total = (data && data.total) ? data.total : this.channels.length;
        this.channelCount.textContent = `${this.channels.length} of ${total} ${statusText} channels`;
    }

    // --------------------------
    // Infinite grid rendering
    // --------------------------
    resetInfiniteGrid() {
        if (!this.channels || this.channels.length === 0) {
            this.channelsGrid.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No channels found. Try adjusting your filters.</p>
                </div>
            `;
            return;
        }

        this.filteredChannels = this.channels; // API already filtered by params
        this.renderedCount = 0;
        this.channelsGrid.innerHTML = '';

        // Render first batch immediately
        this.appendNextBatch(true);
    }

    appendNextBatch(isFirst = false) {
        if (this.isAppending) return;
        if (!this.filteredChannels || this.filteredChannels.length === 0) return;

        const remaining = this.filteredChannels.length - this.renderedCount;
        if (remaining <= 0) return;

        this.isAppending = true;

        const batch = this.filteredChannels.slice(
            this.renderedCount,
            this.renderedCount + this.channelsPerBatch
        );

        // Build DOM nodes (faster + avoids layout trashing)
        const frag = document.createDocumentFragment();

        batch.forEach((channel, idxInBatch) => {
            const actualIndex = this.renderedCount + idxInBatch;
            const categoryClass = (channel.category || 'general')
                .toLowerCase()
                .replace(/\s+/g, '');

            const card = document.createElement('div');
            card.className = `channel-card ${categoryClass}`;
            card.addEventListener('click', () => this.playChannel(actualIndex));

            const logo = channel.logo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzYzNjZmMTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjx0ZXh0IHg9IjMyIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+U1Y8L3RleHQ+Cjwvc3ZnPgo=';

            const verifiedHtml = this.validatedOnly.checked
                ? `<div class="verified-badge"><i class="fas fa-check-circle"></i> Verified</div>`
                : '';

            const sourceHtml = channel.source
                ? `<div class="source-badge">${this.escapeHtml(channel.source.split(' ')[0])}</div>`
                : '';

            const typeHtml = channel.type
                ? `<div class="type-badge ${this.escapeHtml(channel.type)}">${this.getTypeIcon(channel.type)} ${this.escapeHtml(String(channel.type).toUpperCase())}</div>`
                : '';

            const altHtml = (channel.alternativesCount > 0)
                ? `<div class="alternatives-badge"><i class="fas fa-layer-group"></i> +${channel.alternativesCount}</div>`
                : '';

            card.innerHTML = `
                <img class="channel-logo"
                     src="${logo}"
                     alt="${this.escapeHtml(channel.name)}"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzYzNjZmMTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjx0ZXh0IHg9IjMyIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+U1Y8L3RleHQ+Cjwvc3ZnPgo='">
                <div class="channel-name">${this.escapeHtml(channel.name)}</div>
                <div class="channel-info">
                    <div class="channel-category">${this.escapeHtml(channel.category)}</div>
                    ${verifiedHtml}
                    ${sourceHtml}
                    ${typeHtml}
                    ${altHtml}
                </div>
            `;

            frag.appendChild(card);
        });

        this.channelsGrid.appendChild(frag);
        this.renderedCount += batch.length;
        this.isAppending = false;

        // Optional: show a tiny hint after first render
        if (isFirst) {
            // no-op; keep clean
        }
    }

    // --------------------------
    // Player + fallback logic
    // --------------------------
    async playChannel(index) {
        const channel = this.channels[index];
        if (!channel) return;

        this.trackChannelView(channel.id);

        this.currentChannelIndex = index;
        this.currentChannel = channel;
        this.currentAlternativeIndex = 0;
        this.userClosedPlayer = false;

        await this.loadChannelAlternatives(channel.id);
        this.playChannelSource(channel);
    }

    async loadChannelAlternatives(channelId) {
        try {
            const response = await fetch(`/api/channel/${channelId}/alternatives`);
            const data = await response.json();
            this.currentAlternatives = data.alternatives || [];
            console.log(`Loaded ${this.currentAlternatives.length} alternatives for channel`);
        } catch (error) {
            console.error('Error loading alternatives:', error);
            this.currentAlternatives = [];
        }
    }

    playChannelSource(channelSource) {
        if (!channelSource || this.userClosedPlayer) return;

        this.playerTitle.textContent = `${channelSource.name} (${channelSource.source})`;
        this.videoPlayer.src = channelSource.url;
        this.playerModal.style.display = 'flex';

        this.videoPlayer.onloadeddata = null;
        this.videoPlayer.onerror = null;

        this.videoPlayer.onloadeddata = () => {
            console.log(`Successfully loaded: ${channelSource.source}`);
        };

        this.videoPlayer.onerror = () => {
            if (!this.userClosedPlayer) {
                console.log(`Failed to load: ${channelSource.source}`);
                this.handleStreamFailure();
            }
        };

        setTimeout(() => {
            if (this.videoPlayer.readyState === 0 && !this.userClosedPlayer) {
                console.log(`Timeout for: ${channelSource.source}`);
                this.handleStreamFailure();
            }
        }, 10000);
    }

    handleStreamFailure() {
        if (this.userClosedPlayer) return;

        if (this.currentAlternativeIndex < this.currentAlternatives.length) {
            const nextAlternative = this.currentAlternatives[this.currentAlternativeIndex];
            this.currentAlternativeIndex++;

            console.log(`Trying alternative ${this.currentAlternativeIndex}/${this.currentAlternatives.length}: ${nextAlternative.source}`);
            this.showSwitchingMessage(`Trying alternative source: ${nextAlternative.source}`);

            setTimeout(() => {
                if (!this.userClosedPlayer) {
                    this.playChannelSource(nextAlternative);
                }
            }, 1500);
            return;
        }

        if (this.autoSwitchEnabled) {
            console.log('All sources failed, trying next channel...');
            this.showSwitchingMessage('All sources failed. Trying next channel...');

            setTimeout(() => {
                if (!this.userClosedPlayer) {
                    this.tryNextChannel();
                }
            }, 2000);
        } else {
            this.showStreamError('All sources for this channel are unavailable.');
        }
    }

    tryNextChannel() {
        if (this.userClosedPlayer) return;

        const nextIndex = (this.currentChannelIndex + 1) % this.channels.length;
        if (nextIndex !== this.currentChannelIndex) {
            this.playChannel(nextIndex);
        } else {
            this.showStreamError('No more channels available.');
        }
    }

    showSwitchingMessage(message) {
        this.playerTitle.textContent = message;
    }

    showStreamError(message) {
        this.playerTitle.textContent = 'Stream Error';
        alert(message);
    }

    closeVideoPlayer() {
        this.userClosedPlayer = true;
        this.playerModal.style.display = 'none';
        this.videoPlayer.pause();
        this.videoPlayer.src = '';

        this.currentChannelIndex = -1;
        this.currentChannel = null;
        this.currentAlternatives = [];
        this.currentAlternativeIndex = 0;
    }

    // --------------------------
    // UI helpers
    // --------------------------
    showLoading() {
        if (!document.querySelector('.loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <h3>Loading FunTV Channels</h3>
                    <p>Discover 15,000+ live channels from around the world...</p>
                    <div class="loading-progress">
                        <div class="progress-bar"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        const tips = [
            "Use the search bar to find specific channels instantly",
            "We aggregate channels from multiple sources worldwide",
            "If one source fails, we automatically try alternatives",
            "Works on mobile, tablet, and desktop devices",
            "Filter by category: News, Sports, Entertainment, and more",
            "Toggle verified channels for quality-tested streams",
            "Global content: Indian, international, and regional channels",
            "Optimized for the best streaming experience"
        ];

        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        this.channelsGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading channels...</p>
                <div class="loading-tip">
                    <small>${randomTip}</small>
                </div>
            </div>
        `;
        this.channelCount.textContent = 'Loading...';
    }

    showError(message) {
        this.channelsGrid.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="app.loadData()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 4px; color: white; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }

    getTypeIcon(type) {
        const icons = {
            'iptv': '📺',
            'radio': '📻',
            'webtv': '🌐',
            'pluto': '🎬',
            'tubi': '🍿',
            'samsung': '📱',
            'plex': '🎭'
        };
        return icons[type] || '📺';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = (text ?? '').toString();
        return div.innerHTML;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StreamVerse();
});
