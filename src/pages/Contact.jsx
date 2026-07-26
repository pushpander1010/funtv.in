import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MessageSquare, ExternalLink } from 'lucide-react'

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-400 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <h1 className="text-3xl font-bold text-white mb-4">Contact Us</h1>
      <p className="text-gray-500 mb-10">Have a suggestion, question, or want to report a broken link? We'd love to hear from you.</p>
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5 text-brand-400" />
            <h2 className="font-semibold text-gray-200">Email</h2>
          </div>
          <p className="text-sm text-gray-500">For general inquiries, resource suggestions, or takedown requests:</p>
          <a href="mailto:hello@funtv.in" className="inline-flex items-center gap-2 mt-3 text-brand-400 hover:text-brand-300 text-sm font-medium">
            hello@funtv.in
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-brand-400" />
            <h2 className="font-semibold text-gray-200">Suggest a Resource</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">Found a great free resource we should list? Send us:</p>
          <ul className="text-sm text-gray-500 space-y-1 ml-4 list-disc">
            <li>Name and URL of the resource</li>
            <li>Brief description</li>
            <li>Which category it belongs to</li>
          </ul>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50">
          <h2 className="font-semibold text-gray-200 mb-3">Takedown Requests</h2>
          <p className="text-sm text-gray-500">If you are a content owner and believe a link infringes on your rights, please email us and we will remove it promptly.</p>
        </div>
      </div>
    </div>
  )
}