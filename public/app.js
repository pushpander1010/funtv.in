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
    }

    bindEvents() {
        this.categoryFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.loadChannels();
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
            this.loadChannels();
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

    // Popular channels management
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

    // Search history management
    loadSearchHistory() {
        const stored = localStorage.getItem('funtv_search_history');
        return stored ? JSON.parse(stored) : [];
    }

    saveSearchHistory() {
        localStorage.setItem('funtv_search_history', JSON.stringify(this.searchHistory.slice(-10))); // Keep last 10
    }

    addToSearchHistory(query) {
        if (query && query.length > 2) {
            this.searchHistory = this.searchHistory.filter(item => item !== query);
            this.searchHistory.unshift(query);
            this.saveSearchHistory();
        }
    }

    // Engagement tracking
    trackEngagement() {
        // Track time spent
        setInterval(() => {
            const timeSpent = Math.floor((Date.now() - this.sessionStart) / 1000);
            // Analytics ready - can send to Google Analytics, etc.
            console.log(`Session time: ${timeSpent}s, Channels viewed: ${this.channelsViewed}`);
        }, 30000); // Every 30 seconds

        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                // Analytics ready
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

    async loadData() {
        try {
            this.showLoading();
            
            // Load categories
            const validated = this.validatedOnly.checked;
            const categoriesRes = await fetch(`/api/categories?validated=${validated}`);
            this.categories = await categoriesRes.json();
            this.populateCategories();
            
            // Load channels
            await this.loadChannels();
            
            // Update validation status
            this.updateValidationStatus();
            
            // Update source info
            this.loadSourceInfo();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please try again.');
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
                
                // Show source breakdown if available
                if (status.sourceBreakdown) {
                    const topSources = Object.entries(status.sourceBreakdown)
                        .sort(([,a], [,b]) => b - a)
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
            if (this.currentFilter !== 'all') {
                params.append('category', this.currentFilter);
            }
            if (this.currentSearch) {
                params.append('search', this.currentSearch);
            }
            if (this.validatedOnly.checked) {
                params.append('validated', 'true');
            }

            const response = await fetch(`/api/channels?${params}`);
            const data = await response.json();
            
            this.channels = data.channels;
            this.updateChannelCount(data);
            this.renderChannels();
        } catch (error) {
            console.error('Error loading channels:', error);
            this.showError('Failed to load channels.');
        }
    }

    updateChannelCount(data) {
        const statusText = this.validatedOnly.checked ? 'verified' : 'total';
        this.channelCount.textContent = `${this.channels.length} of ${data.total} ${statusText} channels`;
    }

    renderChannels() {
        if (this.channels.length === 0) {
            this.channelsGrid.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No channels found. Try adjusting your filters.</p>
                </div>
            `;
            return;
        }

        this.channelsGrid.innerHTML = this.channels.map((channel, index) => `
            <div class="channel-card" onclick="app.playChannel(${index})">
                <img class="channel-logo" 
                     src="${channel.logo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzYzNjZmMTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjx0ZXh0IHg9IjMyIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+U1Y8L3RleHQ+Cjwvc3ZnPgo='}" 
                     alt="${this.escapeHtml(channel.name)}"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzYzNjZmMTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjx0ZXh0IHg9IjMyIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+U1Y8L3RleHQ+Cjwvc3ZnPgo='">
                <div class="channel-name">${this.escapeHtml(channel.name)}</div>
                <div class="channel-info">
                    <div class="channel-category">${this.escapeHtml(channel.category)}</div>
                    ${this.validatedOnly.checked ? '<div class="verified-badge"><i class="fas fa-check-circle"></i> Verified</div>' : ''}
                    ${channel.source ? `<div class="source-badge">${this.escapeHtml(channel.source.split(' ')[0])}</div>` : ''}
                    ${channel.type ? `<div class="type-badge ${channel.type}">${this.getTypeIcon(channel.type)} ${this.escapeHtml(channel.type.toUpperCase())}</div>` : ''}
                    ${channel.alternativesCount > 0 ? `<div class="alternatives-badge"><i class="fas fa-layer-group"></i> +${channel.alternativesCount}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Show popular channels based on view history
    showPopularChannels() {
        const popularIds = Object.entries(this.popularChannels)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .map(([id]) => id);

        if (popularIds.length === 0) return;

        const popularChannels = this.channels.filter(channel =>
            popularIds.includes(channel.id.toString())
        );

        if (popularChannels.length > 0) {
            // Could add a popular channels section to the UI
            console.log('Popular channels:', popularChannels.map(c => c.name));
        }
    }

    async playChannel(index) {
        const channel = this.channels[index];
        if (!channel) return;

        // Track channel view for popularity
        this.trackChannelView(channel.id);

        this.currentChannelIndex = index;
        this.currentChannel = channel;
        this.currentAlternativeIndex = 0;
        this.userClosedPlayer = false;

        // Load alternatives for this channel
        await this.loadChannelAlternatives(channel.id);

        // Start playing the primary source
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

        // Clear previous event listeners
        this.videoPlayer.onloadeddata = null;
        this.videoPlayer.onerror = null;

        // Set up new event listeners
        this.videoPlayer.onloadeddata = () => {
            console.log(`Successfully loaded: ${channelSource.source}`);
        };

        this.videoPlayer.onerror = () => {
            if (!this.userClosedPlayer) {
                console.log(`Failed to load: ${channelSource.source}`);
                this.handleStreamFailure();
            }
        };

        // Timeout for streams that take too long
        setTimeout(() => {
            if (this.videoPlayer.readyState === 0 && !this.userClosedPlayer) {
                console.log(`Timeout for: ${channelSource.source}`);
                this.handleStreamFailure();
            }
        }, 10000);
    }

    handleStreamFailure() {
        if (this.userClosedPlayer) return;

        // Try next alternative source for the same channel
        if (this.currentAlternativeIndex < this.currentAlternatives.length) {
            const nextAlternative = this.currentAlternatives[this.currentAlternativeIndex];
            this.currentAlternativeIndex++;
            
            console.log(`Trying alternative ${this.currentAlternativeIndex}/${this.currentAlternatives.length}: ${nextAlternative.source}`);
            
            // Show switching message
            this.showSwitchingMessage(`Trying alternative source: ${nextAlternative.source}`);
            
            setTimeout(() => {
                if (!this.userClosedPlayer) {
                    this.playChannelSource(nextAlternative);
                }
            }, 1500);
            return;
        }

        // All alternatives failed, try next channel if auto-switch is enabled
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
        // You could also show a loading overlay here
    }

    showStreamError(message) {
        this.playerTitle.textContent = 'Stream Error';
        alert(message);
    }

    closeVideoPlayer() {
        this.userClosedPlayer = true; // Mark as user-initiated close
        this.playerModal.style.display = 'none';
        this.videoPlayer.pause();
        this.videoPlayer.src = '';
        
        // Reset state
        this.currentChannelIndex = -1;
        this.currentChannel = null;
        this.currentAlternatives = [];
        this.currentAlternativeIndex = 0;
    }

    showLoading() {
        const tips = [
            "💡 Pro tip: Use the search bar to find specific channels instantly",
            "🎯 Fun fact: We aggregate channels from 8+ different sources worldwide",
            "⚡ Smart fallback: If one source fails, we automatically try alternatives",
            "📱 Works perfectly on mobile, tablet, and desktop devices",
            "🔍 Filter by category: News, Sports, Entertainment, and more",
            "✅ Verified channels: Toggle to show only quality-tested streams",
            "🌍 Global content: Indian, international, and regional channels",
            "🚀 Fast loading: Optimized for the best streaming experience"
        ];

        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        this.channelsGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading 15,000+ channels...</p>
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
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StreamVerse();
});