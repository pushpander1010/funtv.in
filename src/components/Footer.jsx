import { Link } from 'react-router-dom'
import { Zap, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gray-950 mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">funtv.in</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/about" className="text-gray-500 hover:text-brand-400 transition-colors">About</Link>
            <Link to="/contact" className="text-gray-500 hover:text-brand-400 transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500" /> for the internet
          </p>
        </div>
        <p className="text-xs text-gray-700 text-center mt-4">
          © 2026 funtv.in — We don't host any content. All links point to third-party sites.
        </p>
      </div>
    </footer>
  )
}