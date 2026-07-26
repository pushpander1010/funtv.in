import { useState, useEffect } from 'react'
import AdUnit from './AdUnit'

/**
 * Mobile-only sticky bottom ad.
 * Shows a 300x250 on small screens, 320x50 on larger mobile.
 * Hidden on desktop (lg+), fixed to bottom on mobile.
 */
export default function MobileStickyAd() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Show after 3s delay so it doesn't feel intrusive
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!visible || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center lg:hidden">
      {/* Backdrop blur + ad container */}
      <div className="relative w-full max-w-[340px] mx-2 mb-2 rounded-xl overflow-hidden bg-gray-950/95 backdrop-blur-sm border border-gray-800/50 shadow-2xl shadow-black/50">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-gray-800/80 text-gray-500 hover:text-gray-300 text-xs"
          aria-label="Close ad"
        >
          ✕
        </button>
        <div className="flex items-center justify-center p-1">
          <AdUnit
            adKey="cbdda3eab50a0c495bd5966f51fa8c47"
            width={320}
            height={100}
          />
        </div>
      </div>
    </div>
  )
}
