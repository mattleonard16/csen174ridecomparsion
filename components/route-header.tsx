import { Edit, RotateCcw } from 'lucide-react'

interface RouteHeaderProps {
  origin: string
  destination: string
  onEdit: () => void
  onReset: () => void
  className?: string
}

export default function RouteHeader({
  origin,
  destination,
  onEdit,
  onReset,
  className = '',
}: RouteHeaderProps) {
  const formatLocation = (location: string) => {
    const parts = location.split(',')
    return parts[0].trim()
  }

  return (
    <div className={`bg-white shadow-md rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-medium text-gray-900 truncate">
            {formatLocation(origin)} → {formatLocation(destination)}
          </h2>
        </div>
        <div className="flex items-center space-x-3 ml-4">
          <button
            onClick={onEdit}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={onReset}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            New Search
          </button>
        </div>
      </div>
    </div>
  )
}
