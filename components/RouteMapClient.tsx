import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for pickup and destination
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit bounds when route is loaded
function FitBounds({ routeCoordinates }: { routeCoordinates: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, routeCoordinates]);
  
  return null;
}

type RouteMapClientProps = {
  pickup: [number, number]; // [lon, lat]
  destination: [number, number]; // [lon, lat]
};

export default function RouteMapClient({ pickup, destination }: RouteMapClientProps) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);

  // Center the map between the two points (initial center)
  const center: [number, number] = [
    (pickup[1] + destination[1]) / 2,
    (pickup[0] + destination[0]) / 2,
  ];

  // Fetch the actual route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const [pickupLon, pickupLat] = pickup;
        const [destLon, destLat] = destination;
        
        const url = `http://router.project-osrm.org/route/v1/driving/${pickupLon},${pickupLat};${destLon},${destLat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === "Ok" && data.routes?.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setRouteCoordinates(coordinates);
        } else {
          // Fallback to straight line if route fetch fails
          setRouteCoordinates([[pickup[1], pickup[0]], [destination[1], destination[0]]]);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to straight line
        setRouteCoordinates([[pickup[1], pickup[0]], [destination[1], destination[0]]]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [pickup, destination]);

  return (
    <div className="mt-4">
      <MapContainer center={center} zoom={10} style={{ height: 300, width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        {/* Pickup marker (green) */}
        <Marker position={[pickup[1], pickup[0]]} icon={pickupIcon} />
        
        {/* Destination marker (red) */}
        <Marker position={[destination[1], destination[0]]} icon={destinationIcon} />
        
        {/* Route polyline */}
        {!loading && routeCoordinates.length > 0 && (
          <>
            <Polyline 
              positions={routeCoordinates} 
              color="#2563eb" 
              weight={4}
              opacity={0.8}
            />
            <FitBounds routeCoordinates={routeCoordinates} />
          </>
        )}
      </MapContainer>
    </div>
  );
} 