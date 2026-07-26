import { useEffect, useRef } from 'react'

/**
 * Reusable Adsterra banner ad component.
 * Renders an iframe ad by injecting atOptions + invoke.js into a container div.
 *
 * Props:
 *   adKey  - the Adsterra ad unit key (from atOptions.key)
 *   width  - ad width in px
 *   height - ad height in px
 *   className - optional extra classes
 */
export default function AdUnit({ adKey, width, height, className = '' }) {
  const containerRef = useRef(null)
  const idRef = useRef(`adsterra-${adKey.slice(0, 8)}`)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear any previous render (Strict Mode double-mount)
    container.innerHTML = ''

    // Create the atOptions script
    const configScript = document.createElement('script')
    configScript.textContent = `
      window.atOptions = window.atOptions || {};
      window.atOptions['${adKey}'] = {
        'key': '${adKey}',
        'format': 'iframe',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
    `
    container.appendChild(configScript)

    // Create the invoke script
    const invokeScript = document.createElement('script')
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`
    invokeScript.async = true
    container.appendChild(invokeScript)

    return () => {
      container.innerHTML = ''
    }
  }, [adKey, width, height])

  return (
    <div
      ref={containerRef}
      id={idRef.current}
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ minWidth: width, minHeight: height }}
    />
  )
}
