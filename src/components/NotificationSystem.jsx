import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { API_BASE_URL } from '../apiClient'

function NotificationSystem () {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Icon sesuai tipe, mirip halaman Notifications
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  // Fetch notifications from backend API
  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications?userId=${currentUser.id}`)
        const { data } = await response.json()
        setNotifications(data || [])
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [currentUser])

  // Jangan tampilkan popup jika tidak ada user atau tidak ada notifikasi
  if (!currentUser || (!isLoading && notifications.length === 0)) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-gray-200">
      <div className="bg-blue-600 text-white p-3 font-semibold flex items-center gap-2">
        <Bell className="w-4 h-4" />
        <span>Notifikasi</span>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Memuat notifikasi...</div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className="p-3 border-b border-gray-100 hover:bg-gray-50 flex gap-2"
            >
              <div className="mt-1">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {notification.title}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {notification.message}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  {new Date(notification.timestamp || notification.created_at).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationSystem
