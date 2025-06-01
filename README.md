# Rideshare Comparison App

A modern web application that compares rideshare prices across multiple services including Uber, Lyft, and local taxi services. Built with Next.js, TypeScript, and React.

## Features

- **Multi-Service Price Comparison**: Compare prices across Uber, Lyft, and taxi services
- **Interactive Route Mapping**: Visual route display using Leaflet maps with actual driving directions
- **Real-Time Route Calculation**: Uses OpenStreetMap Routing Machine (OSRM) API for accurate distance and duration
- **Smart Address Validation**: Geocoding with OpenStreetMap Nominatim API
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Special Pricing Logic**: Includes airport surcharges and flat-rate pricing for specific routes

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Mapping**: React Leaflet, OpenStreetMap
- **APIs**: 
  - OpenStreetMap Nominatim (Geocoding)
  - OSRM (Route calculation)
- **Testing**: Jest
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rideshareappnew
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Enter your pickup address in the "From" field
2. Enter your destination address in the "To" field
3. Click "Compare Prices" to see pricing across all services
4. View the interactive map showing your route
5. Compare prices and choose your preferred service

## Pricing Logic

The app uses realistic pricing models:

- **Uber**: $2.50 base + $1.80/mile + $0.40/minute
- **Lyft**: $2.00 base + $1.70/mile + $0.35/minute  
- **Taxi**: $3.50 base + $2.50/mile + $0.50/minute + airport surcharges

Special features:
- Airport surcharge detection
- Minimum fare enforcement
- Flat-rate pricing for specific routes (e.g., Santa Clara to SFO)

## Project Structure

```
rideshareappnew/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── RouteMap.tsx       # Map wrapper component
│   └── RouteMapClient.tsx # Client-side map implementation
├── lib/                   # Utility functions
└── __tests__/            # Test files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- OpenStreetMap for geocoding and mapping data
- OSRM for route calculation
- Leaflet for interactive maps





