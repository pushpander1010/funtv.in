import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Search } from 'lucide-react'
import { useState } from 'react'
import { categories } from '../data/categories'
import AdBanner from '../components/AdBanner'

export default function Home() {
  const [globalSearch, setGlobalSearch] = useState('')

  const totalResources = categories.reduce((sum, c) => sum + c.resources.length, 0)

  // Global search across all categories
  const searchResults = globalSearch
    ? categories.flatMap(cat =>
        cat.resources
          .filter(r =>
            r.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
            r.description.toLowerCase().includes(globalSearch.toLowerCase())
          )
          .map(r => ({ ...r, categoryName: cat.title, categoryId: cat.id }))
      )
    : []

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
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
          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Curated links to the best free streaming, software, books, games, AI tools and more.
            No signups, no BS — just click and go.
          </p>

          {/* Global Search */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search all resources..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 text-base"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-4 max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-xl overflow-hidden text-left max-h-80 overflow-y-auto">
              {searchResults.slice(0, 10).map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 border-b border-gray-800/50 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-200">{r.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-md">{r.description}</div>
                  </div>
                  <span className="text-xs text-brand-400 whitespace-nowrap ml-4">{r.categoryName}</span>
                </a>
              ))}
            </div>
          )}
          {globalSearch && searchResults.length === 0 && (
            <div className="mt-4 max-w-2xl mx-auto text-center text-gray-500 text-sm py-4">
              No resources found for "{globalSearch}"
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/streaming"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{categories.length}+</div>
              <div className="text-sm text-gray-500">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalResources}+</div>
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

      {/* Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdBanner className="h-28" />
      </div>

      {/* Categories Grid */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white">Browse Categories</h2>
          <p className="text-gray-500 mt-2">Find exactly what you need</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.id}
                to={`/${cat.id}`}
                className="group relative p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50 hover:border-gray-700/80 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/5"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-100 group-hover:text-brand-400 transition-colors">
                        {cat.title}
                      </h3>
                      {cat.badge && (
                        <span className={cat.badgeColor || 'badge-blue'}>
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                    <div className="mt-2 text-xs text-gray-600">
                      {cat.resources.length} resources →
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdBanner className="h-24" />
      </div>

      {/* FAQ / SEO */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            { q: 'Is funtv.in free to use?', a: 'Yes. All resources listed on funtv.in are completely free. We don\'t charge anything and never will.' },
            { q: 'Do I need to create an account?', a: 'No. Simply browse categories, click a link, and go directly to the resource. No signups or registrations needed.' },
            { q: 'Is this site safe?', a: 'We only list reputable, well-known resources. Many have a verified safe badge (🛡️). However, always use your judgment when visiting external sites.' },
            { q: 'How do you make money?', a: 'We display ads from third-party ad networks. This helps us keep the site running and free for everyone.' },
            { q: 'Can I suggest a resource?', a: 'Yes! Reach out to us via our Contact page and we\'ll review your suggestion.' },
            { q: 'Do you host any content?', a: 'No. funtv.in is a curated directory of links. We do not host, store, or distribute any content ourselves.' },
          ].map((faq, i) => (
            <div key={i} className="p-5 rounded-xl bg-gray-900/50 border border-gray-800/50">
              <h3 className="font-semibold text-gray-200">{faq.q}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}