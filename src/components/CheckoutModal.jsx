import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useNotification } from '../contexts/NotificationContext'
import { useStore } from '../contexts/StoreContext'
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import storeStatsService from '../services/storeStatsService'

export default function CheckoutModal ({ onClose, userId }) {
  const { cart, getTotalPrice, getTotalItems, clearCart } = useCart()
  const { notifyStockOut, notifyLowStock, notifyTransactionSuccess } = useNotification()
  const { currentStore } = useStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('tunai')
  const [transactionData, setTransactionData] = useState(null)

  // Check stock levels and send notifications
  const checkStockLevelsAndNotify = async (soldItems) => {
    try {
      for (const item of soldItems) {
        // Get current stock after update
        const productRef = doc(db, 'products', item.id)
        const productSnap = await getDoc(productRef)
        
        if (productSnap.exists()) {
          const productData = productSnap.data()
          const currentStock = productData.stok || 0
          
          // Create product object for notifications
          const product = {
            id: item.id,
            nama: item.nama,
            stok: currentStock,
            satuan: productData.satuan || 'pcs'
          }
          
          // Send notifications based on stock level
          if (currentStock === 0) {
            notifyStockOut(product, () => {
              // Navigate to stock page
              window.location.href = '/stock'
            })
          } else if (currentStock <= 5) {
            notifyLowStock(product, () => {
              // Navigate to stock page
              window.location.href = '/stock'
            })
          }
        }
      }
    } catch (error) {
      console.error('Error checking stock levels:', error)
    }
  }

  const handleCheckout = async () => {
    setLoading(true)
    setError('')

    try {
      // Save transaction data before clearing cart
      const currentTransactionData = {
        items: cart.items,
        totalPrice: getTotalPrice(),
        totalItems: getTotalItems(),
        paymentMethod
      }
      setTransactionData(currentTransactionData)

      // QRIS via Midtrans Snap
      if (paymentMethod === 'qris') {
        if (!window.snap) {
          throw new Error('Layanan pembayaran tidak tersedia')
        }

        const orderId = `ORDER-${Date.now()}`
        const grossAmount = getTotalPrice()

        const response = await fetch('http://localhost:5000/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId,
            grossAmount,
            customer: {
              firstName: currentStore?.name || 'Customer',
              email: currentStore?.email || 'customer@example.com',
              phone: currentStore?.phone || '08123456789'
            }
          })
        })

        if (!response.ok) {
          throw new Error('Gagal memulai pembayaran QRIS')
        }

        const data = await response.json()
        const snapToken = data.snapToken

        if (!snapToken) {
          throw new Error('Token pembayaran tidak tersedia')
        }

        await new Promise((resolve, reject) => {
          window.snap.pay(snapToken, {
            onSuccess: () => {
              resolve()
            },
            onPending: () => {
              resolve()
            },
            onError: (err) => {
              reject(err)
            },
            onClose: () => {
              setLoading(false)
              resolve()
            }
          })
        })
      }
      // 1. Update stok produk
      const updatePromises = cart.items.map(async (item) => {
        const productRef = doc(db, 'products', item.id)
        await updateDoc(productRef, {
          stok: increment(-item.quantity)
        })
      })

      await Promise.all(updatePromises)

      // Simpan transaksi ke collection 'sales' untuk konsistensi dengan Dashboard
      await addDoc(collection(db, 'sales'), {
        userId,
        items: cart.items.map(item => ({
          productId: item.id,
          nama: item.nama,
          harga: item.harga,
          quantity: item.quantity,
          subtotal: item.harga * item.quantity
        })),
        price: getTotalPrice(), // Field name konsisten dengan Dashboard
        totalAmount: getTotalPrice(), // Field name konsisten dengan TodayRevenue
        totalItems: getTotalItems(),
        paymentMethod,
        timestamp: serverTimestamp(), // Field name konsisten dengan filter
        createdAt: serverTimestamp(),
        status: 'completed'
      })

      // Juga simpan ke collection 'transactions' untuk TodayRevenue
      await addDoc(collection(db, 'transactions'), {
        userId,
        items: cart.items.map(item => ({
          productId: item.id,
          nama: item.nama,
          harga: item.harga,
          quantity: item.quantity,
          subtotal: item.harga * item.quantity
        })),
        totalAmount: getTotalPrice(),
        totalItems: getTotalItems(),
        paymentMethod,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: 'completed'
      })

      // Update store statistics
      if (userId) {
        await storeStatsService.updateStoreStats(userId, {
          totalAmount: getTotalPrice(),
          price: getTotalPrice()
        })
      }

      // Check stock levels and send notifications
      await checkStockLevelsAndNotify(cart.items)
      
      // Send transaction success notification
      notifyTransactionSuccess(getTotalPrice(), paymentMethod, () => {
        // Navigate to statistics or transaction history
        console.log('View transaction details')
      })
      
      // Clear cart dan show success
      clearCart()
      setSuccess(true)
      
      // Auto close
      setTimeout(() => {
        onClose()
      }, 3000)

    } catch (error) {
      console.error('Checkout error:', error)
      setError(error.message || 'Terjadi kesalahan saat memproses pembayaran')
      // Save transaction data before clearing cart (for error case too)
      if (!transactionData) {
        setTransactionData({
          items: cart.items,
          totalPrice: getTotalPrice(),
          totalItems: getTotalItems(),
          paymentMethod
        })
      }
      setLoading(false)
      return
    }

    setLoading(false)
  }

  if (success) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl p-8 w-full max-w-sm text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-bold text-secondary mb-2">Pembayaran Berhasil!</h2>
            
            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Total Pendapatan:</span>
                <span className="text-lg font-bold text-success">
                  Rp {transactionData?.totalPrice.toLocaleString('id-ID') || '0'}
                </span>
              </div>
              
              {/* Product Breakdown */}
              <div className="border-t border-gray-200 pt-3 mb-3">
                <p className="text-xs text-gray-500 mb-2">Detail Produk:</p>
                {transactionData?.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">
                      {item.nama} x{item.quantity}
                    </span>
                    <span className="font-medium text-gray-800">
                      Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Metode Pembayaran:</span>
                <span className="text-sm font-medium text-gray-800">
                  {transactionData?.paymentMethod === 'qris' ? 'QRIS' : 'Tunai'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Item:</span>
                <span className="text-sm font-medium text-gray-800">
                  {transactionData?.totalItems || 0} item
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Waktu:</span>
                <span className="text-sm font-medium text-gray-800">
                  {new Date().toLocaleString('id-ID', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-4 text-center">
              Transaksi {transactionData?.paymentMethod === 'qris' ? 'via QRIS' : 'secara tunai'} telah berhasil diproses.
              <br />
              <span className="text-success font-medium">
                Pendapatan Anda bertambah Rp {transactionData?.totalPrice.toLocaleString('id-ID') || '0'}!
              </span>
            </p>
            <p className="text-sm text-gray-500">Menutup otomatis dalam 3 detik...</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-secondary">Konfirmasi Pembayaran</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Order Summary */}
              <div>
                <h3 className="font-semibold text-secondary mb-3">Ringkasan Pesanan</h3>
                <div className="space-y-2">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.nama}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} x Rp {item.harga.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">
                        Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-background p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-secondary">Total Pembayaran:</span>
                  <span className="text-xl font-bold text-primary">
                    Rp {getTotalPrice().toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getTotalItems()} item
                </p>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h3 className="font-semibold text-secondary mb-3">Metode Pembayaran</h3>
                <div className="space-y-3">
                  {/* Cash Payment */}
                  <div 
                    onClick={() => setPaymentMethod('tunai')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'tunai' 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'tunai' ? 'text-primary' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-secondary">Tunai</p>
                        <p className="text-sm text-gray-600">Pembayaran langsung</p>
                      </div>
                    </div>
                  </div>

                  {/* QRIS Payment */}
                  <div 
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'qris' 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded ${paymentMethod === 'qris' ? 'bg-primary' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="font-medium text-secondary">QRIS</p>
                        <p className="text-sm text-gray-600">Scan QR Code untuk bayar</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QRIS Code Display */}
                {paymentMethod === 'qris' && (
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-3">Berikan QR Code kepada pembeli untuk melakukan pembayaran</p>
                    <div className="flex justify-center">
                      <img 
                        src="/qris.jpg" 
                        alt="QRIS Payment Code" 
                        className="w-64 h-auto rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'block'
                        }}
                      />
                      <div className="hidden p-8 bg-gray-100 rounded-lg">
                        <p className="text-gray-500">QR Code tidak tersedia</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Total: Rp {getTotalPrice().toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 
                  (paymentMethod === 'qris' ? 'Memproses QRIS...' : 'Memproses...') : 
                  (paymentMethod === 'qris' ? 'Konfirmasi Pembayaran QRIS' : 'Bayar Tunai')
                }
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

//ok
