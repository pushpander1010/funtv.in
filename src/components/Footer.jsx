import { Link } from 'react-router-dom'
import { Zap, Heart } from 'lucide-react'
import { categories } from '../data/categories'

const footerSections = [
  { title: 'Browse', links: categories.slice(0, 5).map(c => ({ name: c.title, path: '/' + c.id })) },
  { title: 'More', links: categories.slice(5, 10).map(c => ({ name: c.title, path: '/' + c.id })) },
  { title: 'About', links: [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Sitemap', path: '/sitemap.xml' },
  ]},
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">funtv.in</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your ultimate hub for free resources on the internet. Curated links — we don't host any content.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">{section.title}</h3>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-gray-500 hover:text-brand-400 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2026 funtv.in — We don't host any content. All links point to third-party sites.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500" /> for the internet
          </p>
        </div>
      </div>
    </footer>
  )
}