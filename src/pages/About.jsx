import { Link } from 'react-router-dom'
import { ArrowLeft, Zap, Shield, Globe, Heart } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-400 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">About funtv.in</h1>
      <div className="space-y-6 text-gray-500 leading-relaxed">
        <p>funtv.in is a curated directory of the internet's best free resources. We collect, organize, and present links to free streaming services, software, apps, books, AI tools, and more — all in one place.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
          {[
            { icon: Zap, title: 'Free Forever', desc: 'Every resource we list is free to use' },
            { icon: Shield, title: 'Safe & Verified', desc: 'We vet resources for safety and quality' },
            { icon: Globe, title: 'No Hosting', desc: 'We do not host any content — only links' },
            { icon: Heart, title: 'Community Driven', desc: 'Suggestions welcome via our Contact page' },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-gray-900/50 border border-gray-800/50">
              <item.icon className="w-5 h-5 text-brand-400 mb-2" />
              <h3 className="font-semibold text-gray-200 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <p>We believe the internet should be accessible to everyone. That's why we curate free alternatives to expensive software, free streaming options, and free learning resources.</p>
        <p>funtv.in is not affiliated with any of the linked websites. If you are a content owner and want a link removed, please contact us immediately.</p>
      </div>
    </div>
  )
}