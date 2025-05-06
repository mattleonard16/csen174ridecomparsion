import '@testing-library/jest-dom'

// Extend expect with custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received !== null
    if (pass) {
      return {
        message: () => `expected ${received} not to be in the document`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be in the document`,
        pass: false,
      }
    }
  },
}) 