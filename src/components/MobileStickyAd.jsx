import { useState, useEffect } from 'react'
import AdUnit from './AdUnit'

/**
 * Mobile-only sticky bottom ad (320x50).
 * Hidden on desktop (lg+), fixed to bottom on mobile.
 */
export default function MobileStickyAd() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after 2s delay so it doesn't feel intrusive
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-gray-950/90 backdrop-blur-sm border-t border-gray-800/50 lg:hidden">
      <AdUnit
        adKey="cbdda3eab50a0c495bd5966f51fa8c47"
        width={320}
        height={50}
      />
      <button
        onClick={() => setVisible(false)}
        className="absolute top-1 right-2 text-gray-600 hover:text-gray-400 text-xs"
        aria-label="Close ad"
      >
        ✕
      </button>
    </div>
  )
}
