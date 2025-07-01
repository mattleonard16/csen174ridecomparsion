'use client'

import { useState } from 'react'
import Hero from '@/components/Hero'
import RouteList from '@/components/RouteList'
import FeatureGrid from '@/components/FeatureGrid'
import RideFormSection from '@/components/RideFormSection'



export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<{pickup: string, destination: string} | null>(null)
  const [processingRouteId, setProcessingRouteId] = useState<string | null>(null)

  const handleRouteSelect = (route: { pickup: string, destination: string }) => {
    // Find the route ID to show processing state
    const routeMap = {
      'San Francisco International Airport (SFO), San Francisco, CA, USA': 'sfo-downtown',
      'Stanford University, Stanford, CA, USA': 'stanford-apple',
      'San Jose International Airport (SJC), San Jose, CA, USA': 'sjc-santa-clara',
      'Palo Alto, CA, USA': 'palo-alto-google'
    }
    
    const routeId = routeMap[route.pickup as keyof typeof routeMap]
    setProcessingRouteId(routeId || null)
    setSelectedRoute(route)
  }

  const handleRouteProcessed = () => {
    setSelectedRoute(null)
    setProcessingRouteId(null)
  }

  return (
    <main className="scroll-snap-y overflow-y-scroll h-screen">
      <Hero />
      
      <RouteList 
        onRouteSelect={handleRouteSelect}
        processingRouteId={processingRouteId}
      />
      
      <FeatureGrid />
      
      <RideFormSection 
        selectedRoute={selectedRoute}
        onRouteProcessed={handleRouteProcessed}
      />
    </main>
  )
}
