import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type RouteMapProps = {
  pickup: [number, number]; // [lon, lat]
  destination: [number, number]; // [lon, lat]
};

export default function RouteMap({ pickup, destination }: RouteMapProps) {
  // Center the map between the two points
  const center = [
    (pickup[1] + destination[1]) / 2,
    (pickup[0] + destination[0]) / 2,
  ];

  return (
    <MapContainer center={center} zoom={11} style={{ height: 300, width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <Marker position={[pickup[1], pickup[0]]} />
      <Marker position={[destination[1], destination[0]]} />
      <Polyline positions={[[pickup[1], pickup[0]], [destination[1], destination[0]]]} color="blue" />
    </MapContainer>
  );
}