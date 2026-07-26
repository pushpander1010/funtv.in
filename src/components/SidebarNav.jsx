import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Menu, X, Zap, BookOpen, Wrench } from 'lucide-react'
import { sidebarSections } from '../data/wiki'

function SidebarGroup({ title, icon: Icon, items, isOpen, onToggle }) {
  const location = useLocation()
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
      >
        <Icon className="w-4 h-4 text-brand-400" />
        <span>{title}</span>
        {isOpen ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
      </button>
      {isOpen && (
        <div className="ml-3 mt-1 space-y-0.5 border-l border-gray-800 pl-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/wiki/${item.id}`}
              className={`block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                location.pathname === `/wiki/${item.id}`
                  ? 'bg-brand-500/20 text-brand-400 font-medium'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// Accept external mobileOpen/setMobileOpen from Navbar
export default function SidebarNav({ mobileOpen, setMobileOpen }) {
  const [wikiOpen, setWikiOpen] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(true)

  // Close on route change
  const location = useLocation()
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const sidebarContent = (
    <>
      <Link to="/" className="flex items-center gap-2 px-3 py-3 mb-2 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-shadow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
          funtv.in
        </span>
      </Link>

      <SidebarGroup title="Wiki" icon={BookOpen} items={sidebarSections.wiki} isOpen={wikiOpen} onToggle={() => setWikiOpen(!wikiOpen)} />
      <SidebarGroup title="Tools" icon={Wrench} items={sidebarSections.tools} isOpen={toolsOpen} onToggle={() => setToolsOpen(!toolsOpen)} />
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar - slides from left */}
      <div className={`lg:hidden fixed top-0 left-0 z-40 w-72 h-full bg-gray-950 border-r border-gray-800 overflow-y-auto transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 pt-4">{sidebarContent}</div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 z-30 w-64 h-screen bg-gray-950 border-r border-gray-800 overflow-y-auto">
        <div className="p-4">{sidebarContent}</div>
      </aside>
    </>
  )
}
