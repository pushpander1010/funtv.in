export default function AdBanner({ className = '', label = 'Advertisement' }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-dashed border-gray-700/50 bg-gray-900/30 flex items-center justify-center ${className}`}>
      {/* 
        REPLACE THIS DIV WITH YOUR AD NETWORK CODE
        Example for PropellerAds:
        <script type="text/javascript" src="//pl1234567890.com/..."></script>
      */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-600 uppercase tracking-wider">{label}</p>
        <p className="text-[10px] text-gray-700 mt-1">336 x 280 / Responsive</p>
      </div>
    </div>
  )
}