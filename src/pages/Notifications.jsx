import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, AlertTriangle, TrendingUp, Package, Star, Calendar, ChevronRight } from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'
import { formatCurrency } from '../utils/currencyFormatter'

export default function Notifications () {
  const { notifications, markAllAsRead } = useNotification()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    markAllAsRead()
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [markAllAsRead])

  const stats = useMemo(() => {
    const isError = (n) => n.color === 'red' || n.type === 'stock-out' || n.type === 'error'
    const isWarning = (n) => n.color === 'yellow' || n.type === 'stock-low' || n.type === 'warning'
    const isSuccess = (n) => n.color === 'green' || n.type === 'transaction-success' || n.type === 'success' || n.type === 'debt-paid'

    const error = notifications.filter(isError).length
    const warning = notifications.filter(isWarning).length
    const success = notifications.filter(isSuccess).length
    const total = notifications.length

    return { error, warning, success, total }
  }, [notifications])

  const getVisualType = (notification) => {
    if (notification.color === 'red' || notification.type === 'stock-out' || notification.type === 'error') return 'error'
    if (notification.color === 'yellow' || notification.type === 'stock-low' || notification.type === 'warning') return 'warning'
    if (notification.color === 'green' || notification.type === 'transaction-success' || notification.type === 'success' || notification.type === 'debt-paid') return 'success'
    return 'info'
  }

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getIconComponent = (type) => {
    switch (type) {
      case 'error':
        return AlertTriangle
      case 'warning':
        return Package
      case 'success':
        return Star
      case 'info':
        return TrendingUp
      default:
        return Bell
    }
  }

  const getIconColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Notifikasi</h1>
        <p className="text-blue-500">Pantau status bisnis Anda</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-600">Stok Habis / Error</p>
          <p className="text-lg font-bold text-blue-700">{stats.error}</p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-600">Peringatan</p>
          <p className="text-lg font-bold text-blue-700">{stats.warning}</p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-600">Kabar Baik</p>
          <p className="text-lg font-bold text-green-600">{stats.success}</p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-600">Total</p>
          <p className="text-lg font-bold text-blue-600">{stats.total}</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Tidak ada notifikasi</h3>
          <p className="text-gray-400">Semua dalam kondisi baik!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const type = getVisualType(notification)
            const Icon = getIconComponent(type)
            const timeLabel = notification.timestamp
              ? new Date(notification.timestamp).toLocaleString('id-ID')
              : 'Baru saja'

            const isClickable = !!notification.action

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border rounded-lg p-4 ${getNotificationStyle(type)} ${
                  isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
                onClick={isClickable ? notification.action : undefined}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 ${getIconColor(type)}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-blue-700 text-sm">{notification.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{timeLabel}</span>
                        {isClickable && <ChevronRight className="w-4 h-4 text-blue-400" />}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                    {notification.actionText && (
                      <p className="text-xs text-blue-700 font-medium">👆 {notification.actionText}</p>
                    )}

                    {notification.multiAction && Array.isArray(notification.actions) && notification.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notification.actions.map((act, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              act.action && act.action()
                            }}
                            className={`px-3 py-1 rounded text-xs font-medium border bg-white hover:bg-gray-50 ${
                              act.color === 'green'
                                ? 'text-green-700 border-green-200'
                                : act.color === 'blue'
                                ? 'text-blue-700 border-blue-200'
                                : act.color === 'purple'
                                ? 'text-purple-700 border-purple-200'
                                : 'text-gray-700 border-gray-200'
                            }`}
                          >
                            {act.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {notifications.some((n) => {
        const t = getVisualType(n)
        return t === 'error' || t === 'warning'
      }) && (
        <div className="card">
          <h3 className="font-semibold text-blue-700 mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Panduan Tindakan
          </h3>
          <div className="space-y-3 text-sm">
            {notifications.some((n) => getVisualType(n) === 'error') && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium mb-1">🚨 Stok Habis / Error - Perlu Tindakan Segera</p>
                <p className="text-red-600">
                  Gunakan notifikasi ini untuk langsung menangani stok habis atau error penting lain.
                </p>
              </div>
            )}
            {notifications.some((n) => getVisualType(n) === 'warning') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 font-medium mb-1">⚠️ Peringatan - Informasi Penting</p>
                <p className="text-yellow-600">
                  Notifikasi peringatan membantu Anda mengantisipasi masalah sebelum terjadi.
                </p>
              </div>
            )}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 font-medium mb-1">💡 Tips</p>
              <p className="text-blue-600">
                Notifikasi dengan tombol aksi dapat diklik untuk langsung menuju halaman atau fitur terkait.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
