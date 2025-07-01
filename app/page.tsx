'use client'

import { useState } from 'react'
import RideComparisonForm from '@/components/ride-comparison-form'

// Popular routes data
const POPULAR_ROUTES = [
  {
    id: 'sfo-downtown',
    pickup: 'San Francisco International Airport (SFO), San Francisco, CA, USA',
    destination: 'Downtown San Francisco, San Francisco, CA, USA',
    displayName: 'SFO → Downtown SF',
    estimatedPrice: '~$45-65',
    estimatedTime: '35-50 min'
  },
  {
    id: 'stanford-apple',
    pickup: 'Stanford University, Stanford, CA, USA', 
    destination: 'Apple Park, Cupertino, CA, USA',
    displayName: 'Stanford → Apple Park',
    estimatedPrice: '~$15-25',
    estimatedTime: '15-20 min'
  },
  {
    id: 'sjc-santa-clara',
    pickup: 'San Jose International Airport (SJC), San Jose, CA, USA',
    destination: 'Santa Clara, CA, USA',
    displayName: 'SJC → Santa Clara', 
    estimatedPrice: '~$20-30',
    estimatedTime: '20-25 min'
  },
  {
    id: 'palo-alto-google',
    pickup: 'Palo Alto, CA, USA',
    destination: 'Googleplex, Mountain View, CA, USA',
    displayName: 'Palo Alto → Google',
    estimatedPrice: '~$12-18', 
    estimatedTime: '10-15 min'
  }
]

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<{pickup: string, destination: string} | null>(null)

  const handleRouteClick = (route: typeof POPULAR_ROUTES[0]) => {
    setSelectedRoute({
      pickup: route.pickup,
      destination: route.destination
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-16">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent leading-tight">
              Compare Rideshares
              <br />
              <span className="text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                Save Money, Save Time
              </span>
            </h1>
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto font-medium leading-relaxed">
              Get real-time pricing across Uber, Lyft & Taxi services.
              <br className="hidden sm:block" />
              Smart recommendations powered by live surge data.
            </p>
          </div>

          {/* Statistics/Trust Signals */}
          <div className="flex justify-center items-center gap-8 mb-8 flex-wrap text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Compare 3 services instantly</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Save up to 40% on rides</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Real-time surge alerts</span>
            </div>
          </div>

          {/* Service Logos */}
          <div className="flex justify-center items-center gap-8 mb-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="text-gray-700 font-medium">Uber</span>
            </div>
            <div className="text-gray-400">vs</div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-gray-700 font-medium">Lyft</span>
            </div>
            <div className="text-gray-400">vs</div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">T</span>
              </div>
              <span className="text-gray-700 font-medium">Taxi</span>
            </div>
          </div>

          {/* Popular Routes Quick Access */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Popular Bay Area Routes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {POPULAR_ROUTES.map((route) => (
                <button 
                  key={route.id}
                  onClick={() => handleRouteClick(route)}
                  className="group bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md active:bg-blue-100 active:scale-95"
                >
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {route.displayName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {route.estimatedPrice} • {route.estimatedTime}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 text-xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Real-time Pricing</h3>
              <p className="text-gray-600 text-sm">
                Get current surge pricing and accurate fare estimates
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-green-600 text-xl">🚗</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Smart Recommendations</h3>
              <p className="text-gray-600 text-sm">
                AI-powered suggestions for best value and fastest rides
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-purple-600 text-xl">📍</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Bay Area Optimized</h3>
              <p className="text-gray-600 text-sm">
                Specially tuned for San Francisco Bay Area routes
              </p>
            </div>
          </div>
        </div>

        <RideComparisonForm 
          selectedRoute={selectedRoute}
          onRouteProcessed={() => setSelectedRoute(null)}
        />
      </div>
    </main>
  )
}
