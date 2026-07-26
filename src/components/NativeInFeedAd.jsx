/**
 * Native in-feed ad for resource lists.
 * Renders a small native ad unit that blends with content.
 * Used inside resource grids on CategoryPage, WikiPage, etc.
 */
import AdUnit from './AdUnit'

export default function NativeInFeedAd({ className = '' }) {
  return (
    <div className={`rounded-xl border border-gray-800/50 bg-gray-900/30 overflow-hidden ${className}`}>
      <AdUnit
        adKey="5df0ac4486339e89c333e4a7bf7f78e4"
        width={300}
        height={250}
      />
    </div>
  )
}
