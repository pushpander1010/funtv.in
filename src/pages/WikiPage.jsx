import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, ExternalLink, AlertTriangle, Info, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { wikiPages } from '../data/wiki'
import TOC from '../components/TOC'
import AdBanner from '../components/AdBanner'

function ResourceItem({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
        item.starred
          ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10'
          : 'bg-gray-900/30 border-gray-800/50 hover:border-gray-700/80 hover:bg-gray-900/60'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
        item.starred
          ? 'bg-amber-500/20 text-amber-400'
          : 'bg-gray-800/80 text-gray-500 group-hover:bg-brand-500/20 group-hover:text-brand-400'
      } transition-colors`}>
        {item.starred ? <Star className="w-4 h-4 fill-amber-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-200 group-hover:text-brand-400 transition-colors text-sm">
            {item.name}
          </span>
          {item.starred && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
              RECOMMENDED
            </span>
          )}
        </div>
        {item.desc && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
        )}
        {item.links && item.links.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.links.map((link, i) => (
              <span key={i} className="text-xs text-gray-600">
                {i > 0 && '/ '}
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-brand-400/70 hover:text-brand-400 transition-colors">
                  {link.name}
                </a>
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  )
}

function TipBox({ tip }) {
  const styles = {
    tip: 'bg-blue-500/10 border-blue-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    danger: 'bg-red-500/10 border-red-500/30',
  }
  const icons = { tip: Info, warning: AlertTriangle, danger: AlertTriangle }
  const labels = { tip: 'TIP', warning: 'WARNING', danger: 'DANGER' }
  const textColors = { tip: 'text-blue-300', warning: 'text-amber-300', danger: 'text-red-300' }
  const labelColors = { tip: 'text-blue-400', warning: 'text-amber-400', danger: 'text-red-400' }
  const Icon = icons[tip.type] || Info

  return (
    <div className={`rounded-xl border px-4 py-3 mb-5 ${styles[tip.type] || styles.tip}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${textColors[tip.type] || textColors.tip}`} />
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColors[tip.type] || labelColors.tip}`}>
            {labels[tip.type] || 'TIP'}
          </span>
          <p className={`text-sm mt-0.5 ${textColors[tip.type] || textColors.tip}`}>{tip.text}</p>
        </div>
      </div>
    </div>
  )
}

function SubSection({ sub }) {
  const [open, setOpen] = useState(true)
  const subId = sub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div id={subId} className="mt-5 scroll-mt-20">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left group"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-brand-400 transition-colors" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-400 transition-colors" />
        )}
        <h3 className="text-base font-semibold text-gray-200 group-hover:text-brand-400 transition-colors">
          {sub.title}
        </h3>
        <span className="text-xs text-gray-600 ml-1">({sub.items.length})</span>
        <a href={`#${subId}`} className="text-gray-700 hover:text-brand-400 text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          #
        </a>
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
          {sub.items.map((item) => (
            <ResourceItem key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function WikiPage() {
  const { pageId } = useParams()
  const page = wikiPages.find((p) => p.id === pageId)

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-gray-500 mb-6">This page doesn't exist yet.</p>
        <Link to="/" className="text-brand-400 hover:text-brand-300">← Back to Home</Link>
      </div>
    )
  }

  const tocSections = page.sections.map((section) => ({
    id: section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: section.title,
    subsections: (section.subsections || []).map((sub) => ({
      id: sub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: sub.title,
    })),
  }))

  const totalItems = page.sections.reduce((sum, sec) => {
    return sum + (sec.items || []).length + (sec.subsections || []).reduce((s, sub) => s + sub.items.length, 0)
  }, 0)

  return (
    <div className="flex gap-8">
      <article className="flex-1 min-w-0 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{page.title}</h1>
          </div>
          <p className="text-gray-500">{page.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-400" />
              {totalItems} resources
            </span>
            <span>{page.sections.length} sections</span>
          </div>
        </div>

        {/* Sections as visual cards */}
        {page.sections.map((section) => {
          const sectionId = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const sectionItemCount = (section.items || []).length + (section.subsections || []).reduce((s, sub) => s + sub.items.length, 0)

          return (
            <section key={sectionId} id={sectionId} className="mb-8 scroll-mt-20">
              {/* Section Header Card */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-gray-800/50 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {section.title}
                      <a href={`#${sectionId}`} className="text-gray-700 hover:text-brand-400 text-sm">#</a>
                    </h2>
                    <p className="text-xs text-gray-600">{sectionItemCount} resources</p>
                  </div>
                </div>
              </div>

              {section.tip && <TipBox tip={section.tip} />}

              {/* Main items as grid */}
              {section.items && section.items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {section.items.map((item) => (
                    <ResourceItem key={item.name} item={item} />
                  ))}
                </div>
              )}

              {/* Subsections */}
              {section.subsections && section.subsections.map((sub) => (
                <SubSection key={sub.title} sub={sub} />
              ))}
            </section>
          )
        })}

        {/* Mid-page ad */}
        <div className="my-8">
          <AdBanner className="h-24" />
        </div>

        {/* SEO footer */}
        <div className="p-6 rounded-xl bg-gray-900/30 border border-gray-800/50">
          <h2 className="text-lg font-bold text-white mb-3">About this page</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            funtv.in curates the best free {page.title.toLowerCase()} resources on the internet.
            All links are hand-picked for quality and safety. Starred items are our top recommendations.
            This page is regularly updated with new resources.
          </p>
        </div>
      </article>

      {/* TOC - desktop only */}
      <aside className="hidden xl:block w-56 flex-shrink-0">
        <TOC sections={tocSections} />
      </aside>
    </div>
  )
}