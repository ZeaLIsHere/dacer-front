import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Store, X } from 'lucide-react'
import BurgerMenu from './BurgerMenu'
import { useNotification } from '../contexts/NotificationContext'

export default function TopBar () {
  const { unreadCount } = useNotification()

  return (
    <div className="fixed top-0 left-0 right-0 shadow-sm border-b z-50 transition-all duration-300" 
         style={{ 
           backgroundColor: 'var(--color-background)', 
           borderColor: 'var(--color-text-secondary)' 
         }}>
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img 
              src="/logo.png" 
              alt="DagangCerdas Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to Store icon if logo fails to load
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="w-8 h-8 bg-primary rounded-lg items-center justify-center hidden">
              <Store className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>DagangCerdas</h1>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          <Link to="/notifications" className="relative">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 transition-colors relative"
              style={{ 
                color: 'var(--color-text-secondary)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.div>
          </Link>

          <BurgerMenu />
        </div>
      </div>
    </div>
  )
}
