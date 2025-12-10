import React from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../contexts/StoreContext'
import BottomNavigation from './BottomNavigation'
import TopBar from './TopBar'
import NotificationSystem from './NotificationSystem'

export default function Layout ({ children }) {
  const location = useLocation()
  const { loading } = useStore()

  // Show loading indicator if stores are still loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Menyiapkan data toko...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="pt-20 md:pt-24 px-4 pb-6"
      >
        {children}
      </motion.main>
      <BottomNavigation />
      <NotificationSystem />
    </div>
  )
}
