// Utility functions for logging and error handling
// Replaces console.log and alert usage throughout the application

/**
 * Application logger with different levels
 */
export const logger = {
  info: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data || '')
    }
  },

  warn: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data || '')
    }
  },

  error: (message, error = null) => {
    console.error(`[ERROR] ${message}`, error || '')

    // In production, you might want to send to error tracking service
    if (process.env.NODE_ENV === 'production' && error) {
      // Example: Send to Sentry, LogRocket, etc.
      // errorTrackingService.captureException(error, { extra: { message } })
    }
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  }
}

/**
 * Formats error messages for user display
 */
export const formatErrorMessage = (error) => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui'

  // Firebase specific errors
  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'Email tidak ditemukan'
      case 'auth/wrong-password':
        return 'Password salah'
      case 'auth/email-already-in-use':
        return 'Email sudah digunakan'
      case 'auth/weak-password':
        return 'Password terlalu lemah'
      case 'auth/invalid-email':
        return 'Format email tidak valid'
      case 'permission-denied':
        return 'Akses ditolak'
      case 'unavailable':
        return 'Layanan sedang tidak tersedia'
      case 'deadline-exceeded':
        return 'Koneksi timeout'
      default:
        return error.message || 'Terjadi kesalahan'
    }
  }

  return error.message || 'Terjadi kesalahan'
}

/**
 * Handles async operations with proper error handling
 */
export const handleAsyncOperation = async (
  operation,
  successMessage = null,
  errorMessage = 'Operasi gagal'
) => {
  try {
    const result = await operation()

    if (successMessage) {
      logger.info(successMessage, result)
    }

    return { success: true, data: result }
  } catch (error) {
    logger.error(`${errorMessage}: ${formatErrorMessage(error)}`, error)
    return { success: false, error: formatErrorMessage(error) }
  }
}

/**
 * Debounced function executor
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction (...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Safe JSON parsing with fallback
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    logger.warn('Failed to parse JSON', { jsonString, error: error.message })
    return fallback
  }
}

/**
 * Safe localStorage operations
 */
export const storage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : fallback
    } catch (error) {
      logger.warn(`Failed to get localStorage item: ${key}`, error)
      return fallback
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error(`Failed to set localStorage item: ${key}`, error)
      return false
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      logger.warn(`Failed to remove localStorage item: ${key}`, error)
      return false
    }
  }
}

/**
 * Validates input data
 */
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  password: (password) => {
    return password && password.length >= 6
  },

  required: (value) => {
    return value !== null && value !== undefined && value !== ''
  },

  number: (value) => {
    return !isNaN(value) && isFinite(value)
  },

  positiveNumber: (value) => {
    return validators.number(value) && parseFloat(value) > 0
  },

  price: (value) => {
    return validators.positiveNumber(value) && parseFloat(value) >= 0
  }
}

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currency = 'IDR') => {
  try {
    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
    return formatter.format(amount)
  } catch (error) {
    logger.warn('Currency formatting failed, using fallback', error)
    return `Rp ${amount.toLocaleString('id-ID')}`
  }
}

/**
 * Format date for display
 */
export const formatDate = (date, options = {}) => {
  try {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }

    const formatOptions = { ...defaultOptions, ...options }

    if (date?.toDate) {
      // Firestore Timestamp
      return date.toDate().toLocaleDateString('id-ID', formatOptions)
    }

    return new Date(date).toLocaleDateString('id-ID', formatOptions)
  } catch (error) {
    logger.warn('Date formatting failed', error)
    return 'Tanggal tidak valid'
  }
}

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clean up text input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove < and > characters
}

/**
 * Check if running in development mode
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development'
}

/**
 * Performance monitoring utilities
 */
export const performance = {
  start: (label) => {
    if (isDevelopment()) {
      console.time(label)
    }
  },

  end: (label) => {
    if (isDevelopment()) {
      console.timeEnd(label)
    }
  },

  measure: async (label, operation) => {
    if (isDevelopment()) {
      console.time(label)
    }

    try {
      const result = await operation()
      return result
    } finally {
      if (isDevelopment()) {
        console.timeEnd(label)
      }
    }
  }
}

export default {
  logger,
  formatErrorMessage,
  handleAsyncOperation,
  debounce,
  safeJsonParse,
  storage,
  validators,
  formatCurrency,
  formatDate,
  generateId,
  sanitizeInput,
  isDevelopment,
  performance
}
