"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import RideComparisonResults from "./ride-comparison-results"

export default function RideComparisonForm() {
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [insights, setInsights] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setResults(null)
    setInsights("")

    try {
      // Simulate API call with a timeout
      setTimeout(() => {
        // Generate simulated data
        const basePrice = 15 + Math.random() * 10
        const baseWaitTime = 2 + Math.floor(Math.random() * 5)
        
        const simulatedResults = {
          uber: {
            price: `$${(basePrice * 1.05).toFixed(2)}`,
            waitTime: `${baseWaitTime} min`,
            driversNearby: Math.floor(3 + Math.random() * 5),
          },
          lyft: {
            price: `$${(basePrice * 0.95).toFixed(2)}`,
            waitTime: `${baseWaitTime + 1} min`,
            driversNearby: Math.floor(2 + Math.random() * 4),
          },
          taxi: {
            price: `$${(basePrice * 1.2).toFixed(2)}`,
            waitTime: `${baseWaitTime + 3} min`,
            driversNearby: Math.floor(1 + Math.random() * 3),
          }
        }

        // Generate a simple recommendation
        const uberPrice = parseFloat(simulatedResults.uber.price.replace('$', ''))
        const lyftPrice = parseFloat(simulatedResults.lyft.price.replace('$', ''))
        const taxiPrice = parseFloat(simulatedResults.taxi.price.replace('$', ''))
        
        const uberWait = parseInt(simulatedResults.uber.waitTime.replace(" min", ""))
        const lyftWait = parseInt(simulatedResults.lyft.waitTime.replace(" min", ""))
        const taxiWait = parseInt(simulatedResults.taxi.waitTime.replace(" min", ""))
        
        // Simple scoring (lower is better)
        const uberScore = uberPrice * 0.7 + uberWait * 0.3
        const lyftScore = lyftPrice * 0.7 + lyftWait * 0.3
        const taxiScore = taxiPrice * 0.7 + taxiWait * 0.3
        
        const bestService = uberScore < lyftScore 
          ? (uberScore < taxiScore ? "Uber" : "Taxi") 
          : (lyftScore < taxiScore ? "Lyft" : "Taxi")
        
        setResults(simulatedResults)
        setInsights(`Based on price and wait time, ${bestService} appears to be your best option for this trip.`)
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      console.error("Error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <Input
              placeholder="Pickup location (e.g., 500 El Camino Real, Santa Clara)"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              required
              className="flex-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            <Input
              placeholder="Destination (e.g., San Francisco Airport)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="flex-1"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Finding rides..." : "Compare Rides"}
          </Button>
        </form>
      </Card>

      {results && <RideComparisonResults results={results} insights={insights} />}
    </div>
  )
}
