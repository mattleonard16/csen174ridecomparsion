import dynamic from 'next/dynamic';

type RouteMapProps = {
  pickup: [number, number]; 
  destination: [number, number]; 
};
//  to avoid SSR to improve browswer only api call
const DynamicMap = dynamic(() => import('./RouteMapClient'), {
  ssr: false,
  loading: () => <div className="mt-4" style={{ height: 300, width: '100%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>
}) as React.ComponentType<RouteMapProps>;

export default function RouteMap({ pickup, destination }: RouteMapProps) {
  return <DynamicMap pickup={pickup} destination={destination} />;
}