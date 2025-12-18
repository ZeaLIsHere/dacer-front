export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Retry configuration
const MAX_RETRIES = 3
const BASE_DELAY = 1000 // 1 second

// Function to calculate delay with exponential backoff
const getDelay = (retryCount) => {
  return BASE_DELAY * Math.pow(2, retryCount)
}

// Function to check if error is retryable
const isRetryableError = (status) => {
  return status === 429 || status >= 500
}

export async function apiFetch(path, options = {}) {
  let lastError
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const url = `${API_BASE_URL}${path}`
    
    // Get token from localStorage
    const token = localStorage.getItem('authToken')

    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(options.headers || {})
        },
        ...options
      })

      if (res.ok) {
        return res.json()
      }

      // If it's not a retryable error, throw immediately
      if (!isRetryableError(res.status)) {
        const text = await res.text()
        throw new Error(`API error ${res.status}: ${text}`)
      }

      // For retryable errors, wait and retry
      if (attempt < MAX_RETRIES) {
        const delay = getDelay(attempt)
        console.warn(`Rate limited or server error. Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Final attempt failed, throw the error
      const text = await res.text()
      throw new Error(`API error ${res.status}: ${text}`)
      
    } catch (error) {
      lastError = error
      
      // If it's not a retryable error or last attempt, throw
      if (!error.message.includes('429') || attempt === MAX_RETRIES) {
        throw error
      }
      
      // Wait before retry
      if (attempt < MAX_RETRIES) {
        const delay = getDelay(attempt)
        console.warn(`Request failed. Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}
