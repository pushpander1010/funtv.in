import { useState, useEffect } from 'react'

export default function TOC({ sections }) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  if (sections.length === 0) return null

  return (
    <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 px-3">On this page</h3>
      <ul className="space-y-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`block px-3 py-1.5 text-sm rounded-lg transition-colors border-l-2 ${
                activeId === section.id
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              {section.title}
            </a>
            {section.subsections && section.subsections.map((sub) => (
              <a
                key={sub.id}
                href={`#${sub.id}`}
                className={`block px-3 py-1 text-xs rounded-lg transition-colors border-l-2 ml-4 ${
                  activeId === sub.id
                    ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                    : 'border-transparent text-gray-600 hover:text-gray-400 hover:bg-gray-800/20'
                }`}
              >
                {sub.title}
              </a>
            ))}
          </li>
        ))}
      </ul>
    </nav>
  )
}