import dynamic from 'next/dynamic'

type RouteMapProps = {
  pickup: [number, number] | null
  destination: [number, number] | null
}
//  to avoid SSR to improve browswer only api call
const DynamicMap = dynamic(() => import('./RouteMapClient'), {
  ssr: false,
  loading: () => (
    <div
      className="mt-4"
      style={{
        height: 300,
        width: '100%',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <div className="text-gray-600 font-medium">Loading map...</div>
      </div>
    </div>
  ),
}) as React.ComponentType<RouteMapProps>

export default function RouteMap({ pickup, destination }: RouteMapProps) {
  // Show loading state if coordinates are not available
  if (!pickup || !destination) {
    return (
      <div
        className="mt-4 rounded-lg border-2 border-dashed border-gray-300"
        style={{
          height: 300,
          width: '100%',
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">🗺️</div>
          <div className="font-medium">Map will appear here</div>
          <div className="text-sm">Enter pickup and destination locations</div>
        </div>
      </div>
    )
  }

  return <DynamicMap pickup={pickup} destination={destination} />
}
