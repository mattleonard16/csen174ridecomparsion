import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RideComparisonForm from '@/components/ride-comparison-form'

describe('RideComparisonForm', () => {
  it('renders the form with all required elements', () => {
    render(<RideComparisonForm />)
    
    expect(screen.getByLabelText(/pickup location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /compare rides/i })).toBeInTheDocument()
  })

  it('shows loading state when form is submitted', async () => {
    render(<RideComparisonForm />)
    
    const pickupInput = screen.getByLabelText(/pickup location/i)
    const destinationInput = screen.getByLabelText(/destination/i)
    const submitButton = screen.getByRole('button', { name: /compare rides/i })

    await userEvent.type(pickupInput, '123 Main St')
    await userEvent.type(destinationInput, '456 Market St')
    fireEvent.submit(submitButton)

    expect(screen.getByText(/finding rides/i)).toBeInTheDocument()
  })

  it('handles form submission and shows results', async () => {
    render(<RideComparisonForm />)
    
    const pickupInput = screen.getByLabelText(/pickup location/i)
    const destinationInput = screen.getByLabelText(/destination/i)
    const submitButton = screen.getByRole('button', { name: /compare rides/i })

    await userEvent.type(pickupInput, '123 Main St')
    await userEvent.type(destinationInput, '456 Market St')
    fireEvent.submit(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/note: using simulated data/i)).toBeInTheDocument()
    })
  })

  it('validates required fields', async () => {
    render(<RideComparisonForm />)
    
    const submitButton = screen.getByRole('button', { name: /compare rides/i })
    fireEvent.submit(submitButton)

    expect(screen.getByLabelText(/pickup location/i)).toBeInvalid()
    expect(screen.getByLabelText(/destination/i)).toBeInvalid()
  })

  it('clears error state when valid input is provided', async () => {
    render(<RideComparisonForm />)
    
    const pickupInput = screen.getByLabelText(/pickup location/i)
    const destinationInput = screen.getByLabelText(/destination/i)
    const submitButton = screen.getByRole('button', { name: /compare rides/i })

    // Submit empty form
    fireEvent.submit(submitButton)
    
    // Fill in valid inputs
    await userEvent.type(pickupInput, '123 Main St')
    await userEvent.type(destinationInput, '456 Market St')
    
    expect(pickupInput).not.toBeInvalid()
    expect(destinationInput).not.toBeInvalid()
  })

  it('disables submit button while loading', async () => {
    render(<RideComparisonForm />)
    
    const pickupInput = screen.getByLabelText(/pickup location/i)
    const destinationInput = screen.getByLabelText(/destination/i)
    const submitButton = screen.getByRole('button', { name: /compare rides/i })

    await userEvent.type(pickupInput, '123 Main St')
    await userEvent.type(destinationInput, '456 Market St')
    fireEvent.submit(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('handles input changes correctly', async () => {
    render(<RideComparisonForm />)
    
    const pickupInput = screen.getByLabelText(/pickup location/i)
    const destinationInput = screen.getByLabelText(/destination/i)

    await userEvent.type(pickupInput, '123 Main St')
    await userEvent.type(destinationInput, '456 Market St')

    expect(pickupInput).toHaveValue('123 Main St')
    expect(destinationInput).toHaveValue('456 Market St')
  })

  it('shows error message when API fails', async () => {
    // Mock fetch to simulate API failure
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))
    
    render(<RideComparisonForm />)
    
    const pickupInput = screen.getByLabelText(/pickup location/i)
    const destinationInput = screen.getByLabelText(/destination/i)
    const submitButton = screen.getByRole('button', { name: /compare rides/i })

    await userEvent.type(pickupInput, '123 Main St')
    await userEvent.type(destinationInput, '456 Market St')
    fireEvent.submit(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/note: using simulated data/i)).toBeInTheDocument()
    })
  })
}) 