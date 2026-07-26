import { ExternalLink, Shield } from 'lucide-react'

export default function ResourceCard({ resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 rounded-xl bg-gray-900/50 border border-gray-800/50 hover:border-brand-500/30 hover:bg-gray-900 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-100 group-hover:text-brand-400 transition-colors truncate">
              {resource.name}
            </h3>
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
            {resource.safe && (
              <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" title="Safe & verified" />
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{resource.description}</p>
        </div>
      </div>
      {resource.tags && resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-xs bg-gray-800/80 text-gray-400 border border-gray-700/50"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  )
}