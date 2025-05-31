import { Clock, DollarSign, Users, AlertCircle } from "lucide-react"

type RideData = {
  price: string;
  waitTime: string;
  driversNearby: number;
  service: string;
}

type Results = {
  uber: RideData;
  lyft: RideData;
  taxi: RideData;
}

type RideComparisonResultsProps = {
  results: Results;
  insights: string;
}

export default function RideComparisonResults({ results, insights }: RideComparisonResultsProps) {
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
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold">Comparison Results</h2>

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
              <h3 className="text-lg font-bold">{service.name}</h3>
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

                <div className="pt-2">
                  <button
                    onClick={() => handleBooking(service.name)}
                    className={`w-full py-2 px-4 border-2 rounded ${service.borderColor} ${service.textColor} ${service.hoverBg} ${service.hoverText} transition-colors ${service.name === 'Taxi' ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={service.name === 'Taxi'}
                  >
                    {service.name === 'Taxi' ? `Call ${service.name}` : `Book with ${service.name}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}