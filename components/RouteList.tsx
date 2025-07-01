'use client'

import { useState } from 'react'

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

interface RouteListProps {
  onRouteSelect: (route: { pickup: string, destination: string }) => void
  processingRouteId: string | null
}

export default function RouteList({ onRouteSelect, processingRouteId }: RouteListProps) {
  const handleRouteClick = (route: typeof POPULAR_ROUTES[0]) => {
    onRouteSelect({
      pickup: route.pickup,
      destination: route.destination
    })
  }

  return (
    <section className="snap-start min-h-screen flex items-center border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 max-w-5xl w-full">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Popular Bay Area Routes
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Click any route to get instant price comparisons
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {POPULAR_ROUTES.map((route) => {
            const isProcessing = processingRouteId === route.id
            return (
              <button 
                key={route.id}
                onClick={() => handleRouteClick(route)}
                disabled={isProcessing}
                className={`group border rounded-xl p-5 sm:p-6 text-left transition-all duration-200 hover:shadow-lg active:scale-[0.98] ${
                  isProcessing 
                    ? 'bg-blue-50 border-blue-300 cursor-not-allowed shadow-md' 
                    : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 shadow-sm'
                }`}
              >
                <div className={`text-base sm:text-lg font-semibold flex items-center gap-3 mb-2 ${
                  isProcessing ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  {isProcessing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  )}
                  {route.displayName}
                </div>
                <div className="text-sm text-gray-500">
                  {isProcessing ? (
                    <span className="text-blue-600 font-medium">Getting live prices...</span>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <span className="font-medium text-gray-700">{route.estimatedPrice}</span>
                      <span className="hidden sm:inline text-gray-400">•</span>
                      <span>{route.estimatedTime}</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Estimates based on current traffic conditions
          </p>
        </div>
      </div>
    </section>
  )
} 