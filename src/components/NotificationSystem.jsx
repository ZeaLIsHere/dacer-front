import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  X,
  AlertTriangle,
  Package,
  Plus,
  TrendingUp,
  CheckCircle,
  Info
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useNotification } from "../contexts/NotificationContext"
import { db } from "../config/firebase"
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from "firebase/firestore"

export default function NotificationSystem () {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const {
    notifications,
    addNotification,
    removeNotification: removeNotif
  } = useNotification()
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const [showQuickStock, setShowQuickStock] = useState(null)

  useEffect(() => {
    if (!currentUser) return

    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", currentUser.uid)
    )

    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

      // Generate notifications based on product status
      const newNotifications = []

      // Check for critical issues that need attention
      const outOfStock = products.filter((product) => product.stok === 0)
      const lowStock = products.filter(
        (product) => product.stok > 0 && product.stok < 5
      )

      // Show simple pop-up notification to redirect to notifications page
      if (
        (outOfStock.length > 0 || lowStock.length > 0) &&
        !hasUnreadNotifications
      ) {
        setHasUnreadNotifications(true)

        const totalIssues = outOfStock.length + lowStock.length
        addNotification({
          type: "redirect-notification",
          title: "Ada Masalah Stok",
          message: `${totalIssues} produk perlu perhatian`,
          action: () => {
            navigate("/notifications")
          },
          actionText: "Lihat Detail",
          color: "yellow",
          persistent: false
        })
      }

      // Check for products with good sales potential (high price, good stock)
      const goodProducts = products.filter(
        (product) => product.stok >= 10 && product.harga >= 5000
      )
      if (goodProducts.length > 0) {
        const randomProduct =
          goodProducts[Math.floor(Math.random() * goodProducts.length)]
        newNotifications.push({
          id: `promote-${randomProduct.id}`,
          type: "promotion",
          title: "Produk Potensial",
          message: `${randomProduct.nama} cocok untuk dipromosikan`,
          product: randomProduct,
          action: "promote",
          actionText: "Promosikan",
          icon: TrendingUp,
          color: "green"
        })
      }
    })

    return unsubscribe
  }, [currentUser, addNotification, navigate, hasUnreadNotifications])

  const handleNotificationAction = async (notification) => {
    if (notification.action && typeof notification.action === "function") {
      notification.action()
    }
    // Remove notification after action (except for persistent ones)
    if (!notification.persistent) {
      removeNotif(notification.id)
    }
  }

  const handleQuickStockAdd = async (productId, quantity) => {
    try {
      const productRef = doc(db, "products", productId)
      await updateDoc(productRef, {
        stok: increment(quantity)
      })

      setShowQuickStock(null)
    } catch (error) {
      console.error("Error updating stock:", error)
    }
  }

  const removeNotification = (id) => {
    removeNotif(id)
  }

  if (!notifications || notifications.length === 0) return null

  return (
    <>
      <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => {
            // Icon mapping based on notification type
            const iconMap = {
              "stock-out": AlertTriangle,
              "stock-low": Package,
              "transaction-success": CheckCircle,
              "product-added": Plus,
              "stock-updated": Package,
              promotion: TrendingUp
            }

            const IconComponent = iconMap[notification.type] || Info

            const colorClasses = {
              red: "bg-red-50 border-red-200 text-red-800",
              yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
              green: "bg-green-50 border-green-200 text-green-800",
              blue: "bg-blue-50 border-blue-200 text-blue-800"
            }

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 300, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.8 }}
                className={`p-4 rounded-lg border-2 shadow-lg ${colorClasses[notification.color]} cursor-pointer hover:shadow-xl transition-all`}
                onClick={() => handleNotificationAction(notification)}
              >
                <div className="flex items-start space-x-3">
                  <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">
                      {notification.title}
                    </h4>
                    <p className="text-sm opacity-90 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <button className="text-xs font-medium underline hover:no-underline">
                        {notification.actionText}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                        className="text-xs opacity-60 hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Quick Stock Modal */}
      {showQuickStock && (
        <QuickStockModal
          product={showQuickStock}
          onClose={() => setShowQuickStock(null)}
          onAddStock={handleQuickStockAdd}
        />
      )}
    </>
  )
}

// Quick Stock Addition Modal
function QuickStockModal ({ product, onClose, onAddStock }) {
  const [quantity, setQuantity] = useState(10)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (quantity > 0) {
      onAddStock(product.id, quantity)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-secondary">
              Tambah Stok Cepat
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <h4 className="font-medium text-secondary">{product.nama}</h4>
                <p className="text-sm text-gray-600">
                  Stok saat ini: {product.stok}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Tambahan
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="flex-1 text-center border border-gray-300 rounded-lg py-2"
                  min="1"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Batal
              </button>
              <button type="submit" className="flex-1 btn-primary">
                Tambah {quantity} Item
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
