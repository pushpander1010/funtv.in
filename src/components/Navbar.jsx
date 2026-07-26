import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'
import { categories } from '../data/categories'

const navLinks = [
  { name: 'Home', path: '/' },
  ...categories.slice(0, 5).map(c => ({ name: c.title, path: '/' + c.id })),
  { name: 'All Categories', path: '/#categories' },
]

export default function Navbar({ onToggleSidebar, mobileOpen }) {
  const location = useLocation()

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Mobile: hamburger triggers sidebar. Desktop: logo links home */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              aria-label="Toggle sidebar"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-shadow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
                funtv.in
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop search or spacer */}
          <div className="hidden md:block w-8" />
        </div>
      </div>
    </nav>
  )
}
