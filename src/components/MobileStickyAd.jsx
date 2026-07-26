import { useState, useEffect } from 'react'
import AdUnit from './AdUnit'

/**
 * Mobile-only sticky bottom ad — ALWAYS visible, no dismiss button.
 * Shows a 320x100 ad on mobile. Hidden on desktop (lg+).
 * Adds bottom padding to body so content isn't hidden behind it.
 */
export default function MobileStickyAd() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  // Add bottom padding to main content area
  useEffect(() => {
    if (!visible) return
    const main = document.querySelector('main')
    if (main) main.style.paddingBottom = '80px'
    return () => { if (main) main.style.paddingBottom = '' }
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center lg:hidden pointer-events-none">
      <div className="relative w-full max-w-[360px] mx-2 mb-0 pointer-events-auto">
        {/* Gradient fade on top edge */}
        <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-t from-gray-950/95 to-transparent" />
        <div className="rounded-t-xl overflow-hidden bg-gray-950/95 backdrop-blur-sm border border-gray-800/50 border-b-0 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-center p-1">
            <AdUnit
              adKey="cbdda3eab50a0c495bd5966f51fa8c47"
              width={320}
              height={100}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
