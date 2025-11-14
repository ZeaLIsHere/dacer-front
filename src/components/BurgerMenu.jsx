import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Mail
} from 'lucide-react'

export default function BurgerMenu () {
  const { logout, currentUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Tutup menu ketika klik di luar area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to log out', error)
    }
  }

  const menuItems = [
    {
      icon: User,
      label: 'Akun',
      path: '/account',
      description: 'Informasi akun & password'
    },
    {
      icon: Settings,
      label: 'Status Langganan',
      path: '/settings',
      description: 'Lihat status dan opsi langganan'
    }
  ]

  return (
    <div className="relative" ref={menuRef}>
      {/* Tombol Burger */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 transition-colors relative"
        style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Latar belakang blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Konten menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-72 rounded-xl shadow-lg border z-50 overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              {/* Header User Info */}
              <div
                className="p-4 text-white"
                style={{
                  background: 'linear-gradient(90deg, #3B72FF 0%, #5B8FFF 100%)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Selamat datang!</p>
                    <p className="text-sm opacity-90 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Item Menu */}
              <div className="py-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 px-4 py-3 transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 114, 255, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(59, 114, 255, 0.15)' }}
                        >
                          <Icon
                            className="w-4 h-4"
                            style={{ color: 'var(--color-primary)' }}
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className="font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {item.label}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>

              {/* Divider */}
              <div
                className="border-t"
                style={{ borderColor: 'var(--color-border)' }}
              ></div>

              {/* Logout */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 transition-colors"
                style={{ color: 'var(--color-error)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 0, 0, 0.15)' }}
                >
                  <LogOut className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium" style={{ color: 'var(--color-error)' }}>
                    Keluar
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-error)', opacity: 0.7 }}
                  >
                    Logout dari akun
                  </p>
                </div>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
