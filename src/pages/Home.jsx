import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Search } from 'lucide-react'
import { useState } from 'react'
import { sidebarSections, wikiPages } from '../data/wiki'
import AdBanner from '../components/AdBanner'

export default function Home() {
  const [search, setSearch] = useState('')

  const totalItems = wikiPages.reduce((sum, page) => {
    return sum + page.sections.reduce((s, sec) => {
      let count = (sec.items || []).length
      count += (sec.subsections || []).reduce((ss, sub) => ss + sub.items.length, 0)
      return s + count
    }, 0)
  }, 0)

  const allPages = [...sidebarSections.wiki, ...sidebarSections.tools]

  // Search
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
              {searchResults.slice(0, 10).map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 border-b border-gray-800/50 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-200">{r.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-md">{r.desc}</div>
                  </div>
                  <Link
                    to={`/wiki/${r.pageId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-brand-400 whitespace-nowrap ml-4 hover:underline"
                  >
                    {r.pageTitle}
                  </Link>
                </a>
              ))}
              {searchResults.length === 0 && (
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
      <section id="categories" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Wiki</h2>
          <p className="text-sm text-gray-500 mt-1">Streaming, privacy, gaming, books, and more</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sidebarSections.wiki.map((item) => {
            const page = wikiPages.find(p => p.id === item.id)
            const itemCount = page ? page.sections.reduce((s, sec) => {
              return s + (sec.items || []).length + (sec.subsections || []).reduce((ss, sub) => ss + sub.items.length, 0)
            }, 0) : 0
            return (
              <Link
                key={item.id}
                to={`/wiki/${item.id}`}
                className="group flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-gray-800/50 hover:border-gray-700/80 transition-all duration-200"
              >
                <div>
                  <h3 className="font-semibold text-gray-100 group-hover:text-brand-400 transition-colors">{item.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{itemCount} resources</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-400 transition-colors" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* Tools Categories */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Tools</h2>
          <p className="text-sm text-gray-500 mt-1">System, file, internet, image, video, and developer tools</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sidebarSections.tools.map((item) => {
            const page = wikiPages.find(p => p.id === item.id)
            const itemCount = page ? page.sections.reduce((s, sec) => {
              return s + (sec.items || []).length + (sec.subsections || []).reduce((ss, sub) => ss + sub.items.length, 0)
            }, 0) : 0
            return (
              <Link
                key={item.id}
                to={`/wiki/${item.id}`}
                className="group flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-gray-800/50 hover:border-gray-700/80 transition-all duration-200"
              >
                <div>
                  <h3 className="font-semibold text-gray-100 group-hover:text-brand-400 transition-colors">{item.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{itemCount} resources</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-400 transition-colors" />
              </Link>
            )
          })}
        </div>
      </section>

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