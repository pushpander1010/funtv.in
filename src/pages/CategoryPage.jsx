import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { categories } from '../data/categories'
import ResourceCard from '../components/ResourceCard'
import AdBanner from '../components/AdBanner'

export default function CategoryPage() {
  const { categoryId } = useParams()
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)

  const category = categories.find((c) => c.id === categoryId)

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Category Not Found</h1>
        <p className="text-gray-500 mb-6">This category doesn't exist yet.</p>
        <Link to="/" className="text-brand-400 hover:text-brand-300">← Back to Home</Link>
      </div>
    )
  }

  const Icon = category.icon

  const allTags = useMemo(() => {
    const tags = new Set()
    category.resources.forEach((r) => r.tags?.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  }, [category])

  const filtered = useMemo(() => {
    return category.resources.filter((r) => {
      const matchesSearch = !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      const matchesTag = !selectedTag || r.tags?.includes(selectedTag)
      return matchesSearch && matchesTag
    })
  }, [category, search, selectedTag])

  // Split resources into chunks for ad injection
  const AD_EVERY = 6

  return (
    <div className="min-h-screen px-3 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto pt-8 sm:pt-10 pb-6 sm:pb-8">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-400 transition-colors mb-5 sm:mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{category.title}</h1>
                {category.badge && (
                  <span className={category.badgeColor || 'badge-blue'}>
                    {category.badge}
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">{category.description}</p>
              <p className="text-xs text-gray-600 mt-1">{filtered.length} resources</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder={`Search ${category.title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 text-sm"
            />
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  !selectedTag
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-gray-300'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top ad */}
      <div className="max-w-7xl mx-auto py-4">
        <AdBanner size="banner-728x90" className="py-2" />
      </div>

      {/* Resources with in-content ads */}
      <div className="max-w-7xl mx-auto pb-12 sm:pb-16">
        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filtered.map((resource, idx) => (
                <div key={resource.name}>
                  <ResourceCard resource={resource} />
                  {/* In-content ad every AD_EVERY cards */}
                  {(idx + 1) % AD_EVERY === 0 && idx < filtered.length - 1 && (
                    <div className="mt-3 col-span-full">
                      <AdBanner size="banner-300x250" className="py-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 sm:py-20">
            <p className="text-gray-500">No resources found matching your search.</p>
            <button onClick={() => { setSearch(''); setSelectedTag(null) }} className="mt-4 text-sm text-brand-400 hover:text-brand-300">
              Clear filters
            </button>
          </div>
        )}

        {/* Bottom ad */}
        {filtered.length > 3 && (
          <div className="mt-8">
            <AdBanner size="banner-728x90" className="py-2" />
          </div>
        )}

        {/* SEO content */}
        <div className="mt-12 sm:mt-16 p-5 sm:p-8 rounded-2xl bg-gray-900/30 border border-gray-800/50">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
            Free {category.title} Resources — Complete Guide
          </h2>
          <div className="prose prose-invert prose-sm max-w-none text-gray-500">
            <p>
              Looking for the best free {category.title.toLowerCase()} resources? funtv.in has curated
              a comprehensive list of {filtered.length}+ verified links to help you find exactly what you
              need. All resources are free to use and regularly updated.
            </p>
            <p>
              Each resource is hand-picked for quality, reliability, and safety. Look for the
              shield icon (🛡️) for our verified-safe picks. Whether you're a beginner or power user,
              you'll find something useful in this collection.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
