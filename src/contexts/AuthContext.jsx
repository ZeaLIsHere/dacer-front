import React, { createContext, useContext, useEffect, useState } from 'react'
import { API_BASE_URL } from '../apiClient'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Gagal mendaftar')
    }

    const data = await response.json()
    localStorage.setItem('authToken', data.token)
    setCurrentUser(data.user)
    return data.user
  }

  async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Email atau password salah')
    }

    const data = await response.json()
    localStorage.setItem('authToken', data.token)
    setCurrentUser(data.user)
    return data.user
  }

  function logout() {
    localStorage.removeItem('authToken')
    setCurrentUser(null)
  }

  function updatePassword(password) {
    // Belum diimplementasi di backend
    return Promise.reject(new Error('Fitur ganti password belum tersedia'))
  }

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          localStorage.removeItem('authToken')
          setCurrentUser(null)
        } else {
          const data = await response.json()
          setCurrentUser(data.user)
        }
      } catch (error) {
        console.error('Gagal mengecek status auth:', error)
        localStorage.removeItem('authToken')
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    logout,
    updatePassword,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
