import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Search, Star, ExternalLink, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { sidebarSections, wikiPages } from '../data/wiki'
import AdBanner from '../components/AdBanner'

const wikiIcons = {
  'adblocking-privacy': '🛡️',
  'artificial-intelligence': '🧠',
  'streaming': '🎬',
  'music-podcasts': '🎵',
  'gaming': '🎮',
  'reading': '📚',
  'downloading': '⬇️',
  'torrenting': '🧲',
  'educational': '🎓',
  'android-ios': '📱',
  'linux-macos': '🐧',
  'miscellaneous': '✨',
}

const toolIcons = {
  'system-tools': '⚙️',
  'file-tools': '📁',
  'internet-tools': '🌐',
  'social-media-tools': '💬',
  'image-tools': '🖼️',
  'video-tools': '🎥',
  'audio-tools': '🎧',
  'developer-tools': '💻',
  'educational-tools': '📖',
}

const wikiColors = {
  'adblocking-privacy': 'from-emerald-500/20 to-green-500/20 border-emerald-500/20',
  'artificial-intelligence': 'from-purple-500/20 to-violet-500/20 border-purple-500/20',
  'streaming': 'from-red-500/20 to-pink-500/20 border-red-500/20',
  'music-podcasts': 'from-pink-500/20 to-rose-500/20 border-pink-500/20',
  'gaming': 'from-orange-500/20 to-amber-500/20 border-orange-500/20',
  'reading': 'from-teal-500/20 to-cyan-500/20 border-teal-500/20',
  'downloading': 'from-blue-500/20 to-indigo-500/20 border-blue-500/20',
  'torrenting': 'from-gray-400/20 to-gray-500/20 border-gray-400/20',
  'educational': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/20',
  'android-ios': 'from-green-500/20 to-emerald-500/20 border-green-500/20',
  'linux-macos': 'from-blue-400/20 to-cyan-400/20 border-blue-400/20',
  'miscellaneous': 'from-violet-500/20 to-purple-500/20 border-violet-500/20',
}

const toolColors = {
  'system-tools': 'from-slate-500/20 to-gray-500/20 border-slate-500/20',
  'file-tools': 'from-amber-500/20 to-yellow-500/20 border-amber-500/20',
  'internet-tools': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/20',
  'social-media-tools': 'from-pink-500/20 to-rose-500/20 border-pink-500/20',
  'image-tools': 'from-violet-500/20 to-purple-500/20 border-violet-500/20',
  'video-tools': 'from-red-500/20 to-orange-500/20 border-red-500/20',
  'audio-tools': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20',
  'developer-tools': 'from-blue-500/20 to-indigo-500/20 border-blue-500/20',
  'educational-tools': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/20',
}

function getCategoryCount(id) {
  const page = wikiPages.find(p => p.id === id)
  if (!page) return 0
  return page.sections.reduce((sum, sec) => {
    return sum + (sec.items || []).length + (sec.subsections || []).reduce((s, sub) => s + sub.items.length, 0)
  }, 0)
}

function getStarredCount(id) {
  const page = wikiPages.find(p => p.id === id)
  if (!page) return 0
  let count = 0
  page.sections.forEach(sec => {
    count += (sec.items || []).filter(i => i.starred).length
    count += (sec.subsections || []).reduce((s, sub) => s + sub.items.filter(i => i.starred).length, 0)
  })
  return count
}

function CategoryCard({ item, icon, color }) {
  const count = getCategoryCount(item.id)
  const starred = getStarredCount(item.id)
  return (
    <Link
      to={`/wiki/${item.id}`}
      className={`group relative p-5 rounded-2xl bg-gradient-to-br ${color} border hover:scale-[1.02] transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/5`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="font-bold text-gray-100 group-hover:text-white transition-colors text-sm">
        {item.title}
      </h3>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span>{count} links</span>
        {starred > 0 && (
          <span className="flex items-center gap-0.5 text-amber-400/70">
            <Star className="w-3 h-3 fill-amber-400/70" />
            {starred}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function Home() {
  const [search, setSearch] = useState('')

  const totalItems = wikiPages.reduce((sum, page) => {
    return sum + page.sections.reduce((s, sec) => {
      return s + (sec.items || []).length + (sec.subsections || []).reduce((ss, sub) => ss + sub.items.length, 0)
    }, 0)
  }, 0)

  const allPages = [...sidebarSections.wiki, ...sidebarSections.tools]

  const searchResults = search
    ? wikiPages.flatMap(page =>
        page.sections.flatMap(sec => {
          const items = (sec.items || []).filter(r =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            (r.desc && r.desc.toLowerCase().includes(search.toLowerCase()))
          )
          const subItems = (sec.subsections || []).flatMap(sub =>
            sub.items.filter(r =>
              r.name.toLowerCase().includes(search.toLowerCase()) ||
              (r.desc && r.desc.toLowerCase().includes(search.toLowerCase()))
            )
          )
          return [...items, ...subItems].map(r => ({ ...r, pageTitle: page.title, pageId: page.id }))
        })
      )
    : []

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-6">
            <Zap className="w-4 h-4" />
            Free resources — no signups required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              The Internet's Best
            </span>
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
              Free Resources
            </span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Curated links to the best free streaming, software, books, games, AI tools and more.
            No signups, no BS — just click and go.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search all resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 text-base"
            />
          </div>

          {/* Search Results */}
          {search.length > 0 && (
            <div className="mt-4 max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-xl overflow-hidden text-left max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.slice(0, 10).map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 border-b border-gray-800/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {r.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                      <div>
                        <div className="text-sm font-medium text-gray-200">{r.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-md">{r.desc}</div>
                      </div>
                    </div>
                    <Link
                      to={`/wiki/${r.pageId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-brand-400 whitespace-nowrap ml-4 hover:underline"
                    >
                      {r.pageTitle}
                    </Link>
                  </a>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No resources found for "{search}"
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/wiki/streaming"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              Start Exploring
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#categories"
              className="px-6 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-gray-300 font-medium transition-colors border border-gray-700/50"
            >
              Browse All
            </a>
          </div>

          {/* Scroll down arrow */}
          <a
            href="#categories"
            className="mt-10 inline-flex flex-col items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors group animate-pulse"
          >
            <span className="text-xs font-semibold tracking-widest uppercase">Explore</span>
            <svg
              className="w-7 h-7 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800/50 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{allPages.length}+</div>
              <div className="text-sm text-gray-500">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalItems}+</div>
              <div className="text-sm text-gray-500">Curated Links</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-sm text-gray-500">Free to Use</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-sm text-gray-500">Signups Required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdBanner className="h-24" />
      </div>

      {/* Wiki Categories */}
      <section id="categories" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📚</span> Wiki
          </h2>
          <p className="text-sm text-gray-500 mt-1">Streaming, privacy, gaming, books, and more</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sidebarSections.wiki.map((item) => (
            <CategoryCard
              key={item.id}
              item={item}
              icon={wikiIcons[item.id] || '📄'}
              color={wikiColors[item.id] || 'from-gray-500/20 to-gray-600/20 border-gray-500/20'}
            />
          ))}
        </div>
      </section>

      {/* Tools Categories */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🔧</span> Tools
          </h2>
          <p className="text-sm text-gray-500 mt-1">System, file, internet, image, video, and developer tools</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sidebarSections.tools.map((item) => (
            <CategoryCard
              key={item.id}
              item={item}
              icon={toolIcons[item.id] || '📄'}
              color={toolColors[item.id] || 'from-gray-500/20 to-gray-600/20 border-gray-500/20'}
            />
          ))}
        </div>
      </section>

      {/* Ad */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdBanner className="h-20" />
      </div>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-800/50">
        <h2 className="text-xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'Is funtv.in free to use?', a: 'Yes. All resources are completely free. We never charge anything.' },
            { q: 'Do I need to create an account?', a: 'No. Browse, click a link, and go. No signups needed.' },
            { q: 'How do you make money?', a: 'We display ads from third-party ad networks. This keeps the site running and free for everyone.' },
            { q: 'Can I suggest a resource?', a: 'Yes! Reach out via our Contact page.' },
            { q: 'Do you host any content?', a: 'No. funtv.in is a curated directory of links. We do not host, store, or distribute any content.' },
          ].map((faq, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-900/30 border border-gray-800/50">
              <h3 className="font-semibold text-gray-200 text-sm">{faq.q}</h3>
              <p className="text-sm text-gray-500 mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}