import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RideComparisonResults({ results, insights }) {
  const services = [
    {
      name: "Uber",
      data: results.uber,
      color: "bg-black",
    },
    {
      name: "Lyft",
      data: results.lyft,
      color: "bg-pink-600",
    },
    {
      name: "Taxi",
      data: results.taxi,
      color: "bg-yellow-500",
    },
  ]

  // Find the best option based on price
  const bestPrice = services.reduce((best, current) => {
    const currentPrice = parseFloat(current.data.price.replace("$", ""))
    const bestPrice = parseFloat(best.data.price.replace("$", ""))
    return currentPrice < bestPrice ? current : best
  }, services[0])

  // Find the best option based on wait time
  const bestWaitTime = services.reduce((best, current) => {
    const currentTime = parseInt(current.data.waitTime.replace(" min", ""))
    const bestTime = parseInt(best.data.waitTime.replace(" min", ""))
    return currentTime < bestTime ? current : best
  }, services[0])

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold">Comparison Results</h2>

      {insights && (
        <Alert className="bg-blue-50 border-blue-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-4 text-blue-600"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          <AlertDescription className="text-blue-800 pl-7">
            <strong>Recommendation:</strong> {insights}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.name} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`h-2 ${service.color}`}></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{service.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500"><circle cx="12" cy="12" r="10"/><path d="M16 12h-6"/><path d="M12 16V8"/></svg>
                    <span>Price</span>
                  </div>
                  <span className={`font-bold ${service.name === bestPrice.name ? "text-green-600" : ""}`}>
                    {service.data.price}
                    {service.name === bestPrice.name && " (Best)"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Wait Time</span>
                  </div>
                  <span className={`font-bold ${service.name === bestWaitTime.name ? "text-green-600" : ""}`}>
                    {service.data.waitTime}
                    {service.name === bestWaitTime.name && " (Best)"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Drivers Nearby</span>
                  </div>
                  <span className="font-bold">{service.data.driversNearby}</span>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    className={`w-full border-2 ${
                      service.color === "bg-black"
                        ? "border-black text-black hover:bg-black hover:text-white"
                        : service.color === "bg-pink-600"
                          ? "border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white"
                          : "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                    }`}
                  >
                    Book with {service.name}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
