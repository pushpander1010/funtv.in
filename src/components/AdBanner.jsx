import AdUnit from './AdUnit'

/**
 * Ad placement wrapper. Renders the actual Adsterra ad or a fallback placeholder.
 *
 * Props:
 *   size - 'banner-728x90' | 'banner-300x250' | 'banner-160x600' | 'banner-160x300' | 'banner-468x60' | 'native'
 *   className - optional extra classes
 */
const AD_CONFIGS = {
  'banner-728x90': { adKey: '5df0ac4486339e89c333e4a7bf7f78e4', width: 728, height: 90 },
  'banner-300x250': { adKey: 'ec9ef089ea4d7eb3526c17b71c3d133c', width: 300, height: 250 },
  'banner-160x600': { adKey: '2e571ed7255b622325900daa65918dbf', width: 160, height: 600 },
  'banner-160x300': { adKey: '37a4e7e26ed45c89959a2f271fb18909', width: 160, height: 300 },
  'banner-468x60': { adKey: 'dd1bf32a74cc7e43e54fd948f406552e', width: 468, height: 60 },
}

export default function AdBanner({ size = 'banner-300x250', className = '' }) {
  const config = AD_CONFIGS[size]

  if (!config) {
    return (
      <div className={`flex items-center justify-center text-xs text-gray-600 ${className}`}>
        Ad
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <AdUnit {...config} />
    </div>
  )
}
