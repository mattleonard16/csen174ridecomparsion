import { Clock, DollarSign, Users, AlertCircle, Share2, Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import PriceAlert from "./price-alert"

type RideData = {
  price: string;
  waitTime: string;
  driversNearby: number;
  service: string;
  surgeMultiplier?: string;
}

type Results = {
  uber: RideData;
  lyft: RideData;
  taxi: RideData;
}

type RideComparisonResultsProps = {
  results: Results;
  insights: string;
  surgeInfo?: {
    isActive: boolean;
    reason: string;
    multiplier: number;
  } | null;
  timeRecommendations?: string[];
  pickup?: string;
  destination?: string;
}

export default function RideComparisonResults({ 
  results, 
  insights, 
  surgeInfo, 
  timeRecommendations = [], 
  pickup = "", 
  destination = "" 
}: RideComparisonResultsProps) {
  const [showPriceAlert, setShowPriceAlert] = useState(false)
  const [priceAlerts, setPriceAlerts] = useState<Array<{ threshold: number; timestamp: Date }>>([])

  // Function to generate booking URLs
  const getBookingUrl = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'uber':
        return 'https://m.uber.com/looking'
      case 'lyft':
        return 'https://www.lyft.com/'
      default:
        return '#'
    }
  }

  const handleBooking = (serviceName: string) => {
    const url = getBookingUrl(serviceName)
    if (url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Share ride comparison results
  const handleShare = async () => {
    const bestPrice = services.reduce((best, current) => {
      const currentPrice = Number.parseFloat(current.data.price.replace("$", ""))
      const bestPriceVal = Number.parseFloat(best.data.price.replace("$", ""))
      return currentPrice < bestPriceVal ? current : best
    }, services[0])

    const routeInfo = pickup && destination ? `${pickup} → ${destination}` : 'ride comparison'
    const shareData = {
      title: 'Ride Comparison Results',
      text: `${routeInfo}: Best option is ${bestPrice.name} at ${bestPrice.data.price} with ${bestPrice.data.waitTime} wait time. Compare more rides with RideCompare!`,
      url: window.location.href
    }

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        // Show toast or alert
        alert('Ride comparison copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${window.location.href}`)
        alert('Ride comparison copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
      }
    }
  }

  // Share ETA with family/friends
  const handleShareETA = async (serviceName: string, waitTime: string) => {
    const estimatedPickupTime = new Date(Date.now() + parseInt(waitTime) * 60000)
    const timeString = estimatedPickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    const etaMessage = pickup && destination 
      ? `I'm taking a ${serviceName} from ${pickup.split(',')[0]} to ${destination.split(',')[0]}. Estimated pickup at ${timeString}. I'll update you when I'm on my way!`
      : `I'm taking a ${serviceName}. Estimated pickup at ${timeString}. I'll update you when I'm on my way!`

    const shareData = {
      title: 'My Ride ETA',
      text: etaMessage,
    }

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(etaMessage)
        alert('ETA message copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing ETA:', error)
      try {
        await navigator.clipboard.writeText(etaMessage)
        alert('ETA message copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
      }
    }
  }

  // Handle price alert setting
  const handleSetPriceAlert = (threshold: number) => {
    const newAlert = { threshold, timestamp: new Date() }
    setPriceAlerts(prev => [...prev, newAlert])
    
    // Store in localStorage for persistence
    const existingAlerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]')
    existingAlerts.push({
      ...newAlert,
      pickup: pickup?.split(',')[0],
      destination: destination?.split(',')[0],
      route: pickup && destination ? `${pickup.split(',')[0]} → ${destination.split(',')[0]}` : 'Route'
    })
    localStorage.setItem('priceAlerts', JSON.stringify(existingAlerts))
  }

  const services = [
    {
      name: "Uber",
      data: results.uber,
      color: "bg-black",
      textColor: "text-black",
      hoverBg: "hover:bg-black",
      hoverText: "hover:text-white",
      borderColor: "border-black",
    },
    {
      name: "Lyft",
      data: results.lyft,
      color: "bg-pink-600",
      textColor: "text-pink-600",
      hoverBg: "hover:bg-pink-600",
      hoverText: "hover:text-white",
      borderColor: "border-pink-600",
    },
    {
      name: "Taxi",
      data: results.taxi,
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      hoverBg: "hover:bg-yellow-500",
      hoverText: "hover:text-black",
      borderColor: "border-yellow-500",
    },
  ]

  // Find the best option based on price
  const bestPrice = services.reduce((best, current) => {
    const currentPrice = Number.parseFloat(current.data.price.replace("$", ""))
    const bestPrice = Number.parseFloat(best.data.price.replace("$", ""))
    return currentPrice < bestPrice ? current : best
  }, services[0])

  // Find the best option based on wait time
  const bestWaitTime = services.reduce((best, current) => {
    const currentTime = Number.parseInt(current.data.waitTime.replace(" min", ""))
    const bestTime = Number.parseInt(best.data.waitTime.replace(" min", ""))
    return currentTime < bestTime ? current : best
  }, services[0])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Share Results
        </button>
        <button
          onClick={() => setShowPriceAlert(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Bell className="h-4 w-4" />
          Price Alert
        </button>
      </div>

      <div className="mt-8 space-y-6">
        <h2 className="text-2xl font-bold">Comparison Results</h2>

        {/* Surge Information */}
        {surgeInfo && surgeInfo.isActive && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
              <div className="text-orange-800">
                <strong>Surge Pricing Active:</strong> {surgeInfo.reason} ({surgeInfo.multiplier.toFixed(1)}x multiplier)
              </div>
            </div>
          </div>
        )}

        {insights && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <div className="text-blue-800">
                <strong>Recommendation:</strong> {insights}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
            >
              <div className={`h-2 ${service.color}`}></div>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{service.name}</h3>
                  {service.data.surgeMultiplier && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                      {service.data.surgeMultiplier} surge
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Price</span>
                    </div>
                    <span className={`font-bold ${service.name === bestPrice.name ? "text-green-600" : ""}`}>
                      {service.data.price}
                      {service.name === bestPrice.name && " (Best)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Wait Time</span>
                    </div>
                    <span className={`font-bold ${service.name === bestWaitTime.name ? "text-green-600" : ""}`}>
                      {service.data.waitTime}
                      {service.name === bestWaitTime.name && " (Best)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Drivers Nearby</span>
                    </div>
                    <span className="font-bold">{service.data.driversNearby}</span>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handleBooking(service.name)}
                      className={`w-full py-2 px-4 border-2 rounded ${service.borderColor} ${service.textColor} ${service.hoverBg} ${service.hoverText} transition-colors ${service.name === 'Taxi' ? 'cursor-default' : 'cursor-pointer'}`}
                      disabled={service.name === 'Taxi'}
                    >
                      {service.name === 'Taxi' ? `Call ${service.name}` : `Book with ${service.name}`}
                    </button>
                    
                    {/* ETA Sharing Button */}
                    <button
                      onClick={() => handleShareETA(service.name, service.data.waitTime)}
                      className="w-full py-1 px-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <Share2 className="h-3 w-3" />
                      Share ETA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Time Recommendations */}
        {timeRecommendations.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <div className="text-green-800">
              <strong>Best Time Tips:</strong>
              <ul className="mt-2 space-y-1">
                {timeRecommendations.map((tip, index) => (
                  <li key={index} className="text-sm">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Price Alert Modal */}
      {showPriceAlert && (
        <PriceAlert
          currentBestPrice={Number.parseFloat(bestPrice.data.price.replace("$", ""))}
          onSetAlert={handleSetPriceAlert}
          onClose={() => setShowPriceAlert(false)}
        />
      )}
    </div>
  )
}