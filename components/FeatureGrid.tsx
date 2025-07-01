'use client'

const FEATURES = [
  {
    id: 'real-time',
    icon: '⚡',
    title: 'Real-time Pricing',
    description: 'Get current surge pricing and accurate fare estimates across all services',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 'smart-recommendations',
    icon: '🧠',
    title: 'Smart Recommendations',
    description: 'AI-powered suggestions for best value and fastest rides based on live data',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    id: 'bay-area',
    icon: '📍',
    title: 'Bay Area Optimized',
    description: 'Specially tuned algorithms for San Francisco Bay Area routes and traffic patterns',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600'
  }
]

export default function FeatureGrid() {
  return (
    <section className="snap-start min-h-screen flex items-center border-t border-slate-200 bg-slate-50">
      <div className="container mx-auto px-4 max-w-5xl w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Why Choose Our Platform
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Advanced features designed to save you time and money on every ride
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <div 
              key={feature.id}
              className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200`}>
                <span className={`${feature.iconColor} text-xl sm:text-2xl`}>
                  {feature.icon}
                </span>
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-200 text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Live data updated every 30 seconds</span>
          </div>
        </div>
      </div>
    </section>
  )
} 