import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, ExternalLink, AlertTriangle, Info } from 'lucide-react'
import { wikiPages } from '../data/wiki'
import TOC from '../components/TOC'

function ResourceItem({ item }) {
  return (
    <li className="flex items-start gap-2 py-1">
      <span className="text-gray-600 mt-1.5 text-xs">•</span>
      <div className="flex-1">
        <span className="flex items-center gap-1.5">
          {item.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-200 hover:text-brand-400 transition-colors"
          >
            {item.name}
          </a>
          <ExternalLink className="w-3 h-3 text-gray-600 flex-shrink-0" />
        </span>
        {item.desc && (
          <span className="text-gray-500 text-sm"> - {item.desc}</span>
        )}
        {item.links && item.links.map((link, i) => (
          <span key={i} className="text-gray-500 text-sm">
            {' / '}
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">
              {link.name}
            </a>
          </span>
        ))}
      </div>
    </li>
  )
}

function TipBox({ tip }) {
  const styles = {
    tip: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    danger: 'bg-red-500/10 border-red-500/30 text-red-300',
  }
  const icons = {
    tip: Info,
    warning: AlertTriangle,
    danger: AlertTriangle,
  }
  const Icon = icons[tip.type] || Info

  return (
    <div className={`rounded-lg border px-4 py-3 mb-4 text-sm ${styles[tip.type] || styles.tip}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{tip.text}</span>
      </div>
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

  // Build TOC data
  const tocSections = page.sections.map((section) => ({
    id: section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: section.title,
    subsections: (section.subsections || []).map((sub) => ({
      id: sub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: sub.title,
    })),
  }))

  return (
    <div className="flex gap-8">
      {/* Main Content */}
      <article className="flex-1 min-w-0 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">{page.title}</h1>
        <p className="text-gray-500 mb-8">{page.description}</p>

        {page.sections.map((section) => {
          const sectionId = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          return (
            <section key={sectionId} id={sectionId} className="mb-12 scroll-mt-20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                {section.title}
                <a href={`#${sectionId}`} className="text-gray-700 hover:text-brand-400 text-sm">#</a>
              </h2>

              {section.tip && <TipBox tip={section.tip} />}

              {section.items && (
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <ResourceItem key={item.name} item={item} />
                  ))}
                </ul>
              )}

              {section.subsections && section.subsections.map((sub) => {
                const subId = sub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                return (
                  <div key={subId} id={subId} className="mt-6 scroll-mt-20">
                    <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                      {sub.title}
                      <a href={`#${subId}`} className="text-gray-700 hover:text-brand-400 text-xs">#</a>
                    </h3>
                    <ul className="space-y-1">
                      {sub.items.map((item) => (
                        <ResourceItem key={item.name} item={item} />
                      ))}
                    </ul>
                  </div>
                )
              })}
            </section>
          )
        })}

        {/* SEO */}
        <div className="mt-16 p-6 rounded-xl bg-gray-900/30 border border-gray-800/50">
          <h2 className="text-lg font-bold text-white mb-3">About this page</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            funtv.in curates the best free {page.title.toLowerCase()} resources on the internet.
            All links are hand-picked for quality and safety. Starred (⭐) items are our top recommendations.
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