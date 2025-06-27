/**
 * reCAPTCHA v3 Integration for Bot Protection
 * 
 * Setup Instructions:
 * 1. Go to https://www.google.com/recaptcha/admin/create
 * 2. Choose reCAPTCHA v3
 * 3. Add your domain (localhost for testing)
 * 4. Add keys to your .env.local file:
 *    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
 *    RECAPTCHA_SECRET_KEY=your_secret_key
 */

// Test keys (always pass validation - use for development)
const TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
const TEST_SECRET_KEY = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'

// Get reCAPTCHA keys from environment
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || TEST_SITE_KEY
export const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || TEST_SECRET_KEY

/**
 * Load reCAPTCHA v3 script
 */
export function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.grecaptcha) {
      resolve()
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    script.async = true
    script.defer = true

    script.onload = () => {
      // Wait for grecaptcha to be ready
      const checkReady = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            resolve()
          })
        } else {
          setTimeout(checkReady, 100)
        }
      }
      checkReady()
    }

    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA script'))
    }

    document.head.appendChild(script)
  })
}

/**
 * Execute reCAPTCHA v3 and get token
 */
export async function executeRecaptcha(action: string = 'submit'): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA can only be executed in browser environment')
  }

  // Ensure reCAPTCHA is loaded
  await loadRecaptchaScript()

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then((token: string) => {
          resolve(token)
        })
        .catch((error: Error) => {
          reject(error)
        })
    })
  })
}

/**
 * Verify reCAPTCHA token on server side
 */
export async function verifyRecaptchaToken(
  token: string,
  expectedAction: string = 'submit',
  minimumScore: number = 0.5
): Promise<{
  success: boolean
  score?: number
  action?: string
  error?: string
}> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${data['error-codes']?.join(', ') || 'Unknown error'}`
      }
    }

    // Check action matches
    if (data.action !== expectedAction) {
      return {
        success: false,
        error: `Action mismatch: expected '${expectedAction}', got '${data.action}'`
      }
    }

    // Check score threshold
    if (data.score < minimumScore) {
      return {
        success: false,
        score: data.score,
        action: data.action,
        error: `Score too low: ${data.score} < ${minimumScore}`
      }
    }

    return {
      success: true,
      score: data.score,
      action: data.action
    }

  } catch (error) {
    return {
      success: false,
      error: `reCAPTCHA verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * reCAPTCHA configuration
 */
export const RECAPTCHA_CONFIG = {
  // Score thresholds (0.0 = bot, 1.0 = human)
  STRICT_THRESHOLD: 0.7,    // High security
  NORMAL_THRESHOLD: 0.5,    // Balanced
  LENIENT_THRESHOLD: 0.3,   // Low friction
  
  // Actions
  ACTIONS: {
    RIDE_COMPARISON: 'ride_comparison',
    FORM_SUBMIT: 'form_submit',
    API_REQUEST: 'api_request'
  }
} as const

// Type declarations for window.grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
} 