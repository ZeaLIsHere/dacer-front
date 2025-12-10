export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export async function apiFetch (path, options = {}) {
  const url = `${API_BASE_URL}${path}`

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }

  return res.json()
}
