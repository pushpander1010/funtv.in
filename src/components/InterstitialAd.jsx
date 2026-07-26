import { useState, useEffect, useCallback } from 'react'
import AdUnit from './AdUnit'

/**
 * Interstitial ad that shows full-screen overlay on route changes.
 * Shows once per session or every N navigations.
 * Auto-dismisses after 5 seconds or on tap.
 */
export default function InterstitialAd({ interval = 3 }) {
  const [visible, setVisible] = useState(false)
  const [navCount, setNavCount] = useState(0)

  const dismiss = useCallback(() => setVisible(false), [])

  useEffect(() => {
    // Track route changes via popstate
    const handleNav = () => {
      setNavCount(prev => {
        const next = prev + 1
        if (next % interval === 0) {
          // Small delay so page renders first
          setTimeout(() => setVisible(true), 600)
        }
        return next
      })
    }

    window.addEventListener('popstate', handleNav)
    // Also intercept pushState/replaceState for React Router
    const origPush = history.pushState
    const origReplace = history.replaceState
    history.pushState = function(...args) {
      origPush.apply(this, args)
      handleNav()
    }
    history.replaceState = function(...args) {
      origReplace.apply(this, args)
    }

    return () => {
      window.removeEventListener('popstate', handleNav)
      history.pushState = origPush
      history.replaceState = origReplace
    }
  }, [interval])

  // Auto-dismiss after 6s
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(dismiss, 6000)
    return () => clearTimeout(t)
  }, [visible, dismiss])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={dismiss}>
      <div className="relative mx-4" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white text-lg font-bold shadow-lg"
          aria-label="Close ad"
        >
          ✕
        </button>
        {/* Ad container */}
        <div className="rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 shadow-2xl">
          <AdUnit
            adKey="ec9ef089ea4d7eb3526c17b71c3d133c"
            width={320}
            height={250}
          />
        </div>
        {/* Skip timer */}
        <p className="text-center text-xs text-gray-600 mt-2">Tap anywhere to dismiss</p>
      </div>
    </div>
  )
}
