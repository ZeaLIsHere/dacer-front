import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from "./AuthContext"
import { API_BASE_URL, apiFetch } from '../apiClient'

const StoreContext = createContext()

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}

export function StoreProvider({ children }) {
  const { currentUser } = useAuth()
  const [stores, setStores] = useState([])
  const [currentStore, setCurrentStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [storeStats, setStoreStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalProducts: 0,
    todayRevenue: 0
  })

  // Fetch stores from backend API ketika user login
  useEffect(() => {
    async function fetchStores() {
      if (!currentUser) {
        setStores([])
        setCurrentStore(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/stores?userId=${currentUser.id}`)
        if (!response.ok) {
          console.error('Gagal mengambil data toko')
          setStores([])
          setCurrentStore(null)
        } else {
          const data = await response.json()
          const storeList = data.stores || []
          setStores(storeList)
          // pilih store pertama sebagai currentStore jika belum ada
          if (storeList.length > 0 && !currentStore) {
            setCurrentStore(storeList[0])
          }
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
        setStores([])
        setCurrentStore(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [currentUser])

  // Create store via backend API
  async function createStore(storeData) {
    if (!currentUser) {
      throw new Error('User belum login')
    }

    const payload = {
      userId: currentUser.id,
      name: storeData.name,
      owner_name: storeData.ownerName || storeData.owner_name || currentUser.name || '',
      address: storeData.address || '',
      phone: storeData.phone || '',
      email: storeData.email || currentUser.email,
      description: storeData.description || ''
    }

    const response = await fetch(`${API_BASE_URL}/api/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Gagal membuat toko')
    }

    const data = await response.json()
    const newStore = data.store
    setStores(prev => [...prev, newStore])
    setCurrentStore(newStore)
    return newStore
  }

  // Update store via backend API
  async function updateStore(storeId, updateData) {
    if (!currentUser) {
      throw new Error('User belum login')
    }

    const payload = {
      userId: currentUser.id,
      name: updateData.name,
      owner_name: updateData.ownerName || updateData.owner_name,
      address: updateData.address,
      phone: updateData.phone,
      email: updateData.email,
      description: updateData.description,
      is_active: updateData.is_active
    }

    const data = await apiFetch(`/api/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })

    const updatedStore = data.store

    setStores(prev => prev.map(store => store.id === storeId ? updatedStore : store))
    if (currentStore && currentStore.id === storeId) {
      setCurrentStore(updatedStore)
    }

    return updatedStore
  }

  const value = {
    stores,
    currentStore,
    setCurrentStore,
    loading,
    storeStats,
    createStore,
    updateStore
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}
