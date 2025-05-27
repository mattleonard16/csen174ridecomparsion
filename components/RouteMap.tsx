import dynamic from 'next/dynamic';

type RouteMapProps = {
  pickup: [number, number]; // [lon, lat]
  destination: [number, number]; // [lon, lat]
};

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(() => import('./RouteMapClient'), {
  ssr: false,
  loading: () => <div className="mt-4" style={{ height: 300, width: '100%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>
}) as React.ComponentType<RouteMapProps>;

export default function RouteMap({ pickup, destination }: RouteMapProps) {
  return <DynamicMap pickup={pickup} destination={destination} />;
}