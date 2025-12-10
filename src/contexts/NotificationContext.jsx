import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NotificationContext = createContext()

export function useNotification () {
  return useContext(NotificationContext)
}

export function NotificationProvider ({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      read: false,
      timestamp: new Date(),
      ...notification
    }
    
    setNotifications(prev => [...prev, newNotification])
    // unreadCount will be auto-calculated by useEffect
    
    // Auto remove after 10 seconds if no action required
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id)
      }, 10000)
    }
  }

  // Auto-calculate unread count whenever notifications change
  useEffect(() => {
    const unreadCount = notifications.filter(notif => !notif.read).length
    setUnreadCount(unreadCount)
  }, [notifications])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ))
  }

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    // unreadCount will be auto-calculated by useEffect
  }, [])

  const clearAllNotifications = () => {
    setNotifications([])
    // unreadCount will be auto-calculated by useEffect
  }

  // Predefined notification types
  const notifyStockOut = (product, onAction) => {
    addNotification({
      type: 'stock-out',
      title: 'Stok Habis',
      message: `${product.nama} sudah habis`,
      product,
      action: onAction,
      actionText: 'Tambah Stok',
      color: 'red',
      persistent: true
    })
  }

  const notifyLowStock = (product, onAction) => {
    addNotification({
      type: 'stock-low',
      title: 'Stok Menipis',
      message: `${product.nama} tinggal ${product.stok} item`,
      product,
      action: onAction,
      actionText: 'Tambah Stok',
      color: 'yellow',
      persistent: true
    })
  }

  const notifyLowStockWithPromotion = (product, onCreatePromotion, onCreateDiscount, onCreateBundle) => {
    addNotification({
      type: 'stock-low-promo',
      title: 'Stok Menipis - Buat Promosi?',
      message: `${product.nama} tinggal ${product.stok} item. Buat promosi untuk mempercepat penjualan?`,
      product,
      actions: [
        { text: 'Buat Promosi', action: onCreatePromotion, color: 'blue' },
        { text: 'Buat Diskon', action: onCreateDiscount, color: 'green' },
        { text: 'Buat Bundle', action: onCreateBundle, color: 'purple' }
      ],
      color: 'orange',
      persistent: true,
      multiAction: true
    })
  }

  const notifyTransactionSuccess = (total, method, onViewDetails) => {
    addNotification({
      type: 'transaction-success',
      title: 'Transaksi Berhasil',
      message: `Pembayaran Rp ${total.toLocaleString('id-ID')} ${method === 'qris' ? 'via QRIS' : 'tunai'} berhasil`,
      action: onViewDetails,
      actionText: 'Lihat Detail',
      color: 'green',
      persistent: false
    })
  }

  const notifyProductAdded = (productName, onViewProduct) => {
    addNotification({
      type: 'product-added',
      title: 'Produk Ditambahkan',
      message: `${productName} berhasil ditambahkan ke inventory`,
      action: onViewProduct,
      actionText: 'Lihat Produk',
      color: 'blue',
      persistent: false
    })
  }

  const notifyStockUpdated = (productName, newStock, onViewProduct) => {
    addNotification({
      type: 'stock-updated',
      title: 'Stok Diperbarui',
      message: `${productName} sekarang memiliki ${newStock} item`,
      action: onViewProduct,
      actionText: 'Lihat Produk',
      color: 'blue',
      persistent: false
    })
  }

  const notifyDebtCreated = (customerName, amount, onViewDebt) => {
    addNotification({
      type: 'debt-created',
      title: 'Hutang Baru Dicatat',
      message: `Hutang untuk ${customerName || 'Pelanggan'} sebesar Rp ${Number(amount || 0).toLocaleString('id-ID')} telah dibuat`,
      action: onViewDebt,
      actionText: 'Lihat Hutang',
      color: 'orange',
      persistent: false
    })
  }

  const notifyDebtPaid = (customerName, amountPaid, remaining, onViewDebt) => {
    addNotification({
      type: 'debt-paid',
      title: remaining > 0 ? 'Pembayaran Hutang Tercatat' : 'Hutang Lunas',
      message: remaining > 0
        ? `${customerName || 'Pelanggan'} membayar Rp ${Number(amountPaid || 0).toLocaleString('id-ID')}. Sisa Rp ${Number(remaining || 0).toLocaleString('id-ID')}.`
        : `Hutang ${customerName || 'Pelanggan'} lunas. Pembayaran Rp ${Number(amountPaid || 0).toLocaleString('id-ID')}.`,
      action: onViewDebt,
      actionText: 'Lihat Hutang',
      color: remaining > 0 ? 'blue' : 'green',
      persistent: false
    })
  }

  const value = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    // Helper functions
    notifyStockOut,
    notifyLowStock,
    notifyLowStockWithPromotion,
    notifyTransactionSuccess,
    notifyProductAdded,
    notifyStockUpdated,
    notifyDebtCreated,
    notifyDebtPaid
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
