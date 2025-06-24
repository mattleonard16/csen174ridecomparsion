import RideComparisonForm from "@/components/ride-comparison-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Comparative Rideshares
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Compare prices and wait times across rideshare services in real-time
          </p>
          
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

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 text-xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Real-time Pricing</h3>
              <p className="text-gray-600 text-sm">Get current surge pricing and accurate fare estimates</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-green-600 text-xl">🚗</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Smart Recommendations</h3>
              <p className="text-gray-600 text-sm">AI-powered suggestions for best value and fastest rides</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-purple-600 text-xl">📍</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Bay Area Optimized</h3>
              <p className="text-gray-600 text-sm">Specially tuned for San Francisco Bay Area routes</p>
            </div>
          </div>
        </div>

        <RideComparisonForm />
      </div>
    </main>
  )
}