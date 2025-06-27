import { useState } from 'react'
import { Bell, X } from 'lucide-react'

interface PriceAlertProps {
  currentBestPrice: number
  onSetAlert: (threshold: number) => void
  onClose: () => void
}

export default function PriceAlert({ currentBestPrice, onSetAlert, onClose }: PriceAlertProps) {
  const [threshold, setThreshold] = useState(Math.max(currentBestPrice - 5, 5))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (threshold >= currentBestPrice) {
      alert('Alert threshold must be lower than current best price!')
      return
    }

    setIsSubmitting(true)
    try {
      onSetAlert(threshold)

      // Request notification permission if not already granted
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      alert(`Price alert set! You'll be notified when rides drop below $${threshold.toFixed(2)}`)
      onClose()
    } catch (error) {
      console.error('Error setting price alert:', error)
      alert('Failed to set price alert. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Set Price Alert</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Current best price: <strong>${currentBestPrice.toFixed(2)}</strong>
          </p>
          <p className="text-sm text-gray-500">
            We&apos;ll notify you when any ride option drops below your threshold.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-2">
              Alert me when prices drop below:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                id="threshold"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max={currentBestPrice - 0.01}
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Setting...' : 'Set Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
