import { render, screen } from '@testing-library/react'
import RideComparisonResults from '@/components/ride-comparison-results'

describe('RideComparisonResults', () => {
  const mockResults = {
    uber: {
      price: '$25.50',
      waitTime: '5 min',
      driversNearby: 4,
      service: 'UberX',
    },
    lyft: {
      price: '$23.75',
      waitTime: '6 min',
      driversNearby: 3,
      service: 'Lyft Standard',
    },
    taxi: {
      price: '$30.00',
      waitTime: '8 min',
      driversNearby: 2,
      service: 'Yellow Cab',
    },
  }

  const mockInsights =
    'Based on price and wait time, Lyft appears to be your best option for this trip.'

  it('renders the results with all ride services', () => {
    render(<RideComparisonResults results={mockResults} insights={mockInsights} />)

    expect(screen.getByText('UberX')).toBeInTheDocument()
    expect(screen.getByText('Lyft Standard')).toBeInTheDocument()
    expect(screen.getByText('Yellow Cab')).toBeInTheDocument()
  })

  it('displays the correct pricing information', () => {
    render(<RideComparisonResults results={mockResults} insights={mockInsights} />)

    expect(screen.getByText('$25.50')).toBeInTheDocument()
    expect(screen.getByText('$23.75')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
  })

  it('shows the insights message', () => {
    render(<RideComparisonResults results={mockResults} insights={mockInsights} />)

    expect(screen.getByText(mockInsights)).toBeInTheDocument()
  })

  it('displays wait times and driver availability', () => {
    render(<RideComparisonResults results={mockResults} insights={mockInsights} />)

    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(screen.getByText('6 min')).toBeInTheDocument()
    expect(screen.getByText('8 min')).toBeInTheDocument()
    expect(screen.getByText('4 drivers nearby')).toBeInTheDocument()
    expect(screen.getByText('3 drivers nearby')).toBeInTheDocument()
    expect(screen.getByText('2 drivers nearby')).toBeInTheDocument()
  })

  it('displays service icons correctly', () => {
    render(<RideComparisonResults results={mockResults} insights={mockInsights} />)

    // Assuming you have icons for each service
    expect(screen.getByTestId('uber-icon')).toBeInTheDocument()
    expect(screen.getByTestId('lyft-icon')).toBeInTheDocument()
    expect(screen.getByTestId('taxi-icon')).toBeInTheDocument()
  })

  it('formats prices consistently', () => {
    render(<RideComparisonResults results={mockResults} insights={mockInsights} />)

    const prices = screen.getAllByText(/\$\d+\.\d{2}/)
    expect(prices).toHaveLength(3)
  })

  it('handles edge case with zero drivers nearby', () => {
    const edgeCaseResults = {
      ...mockResults,
      uber: {
        ...mockResults.uber,
        driversNearby: 0,
      },
    }

    render(<RideComparisonResults results={edgeCaseResults} insights={mockInsights} />)

    expect(screen.getByText('0 drivers nearby')).toBeInTheDocument()
  })
})
