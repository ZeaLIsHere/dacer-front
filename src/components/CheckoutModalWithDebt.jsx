import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Calendar, DollarSign, CreditCard, ShoppingCart, AlertCircle } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useStore } from '../contexts/StoreContext'
import { useNotification } from '../contexts/NotificationContext'
import { collection, addDoc, serverTimestamp, updateDoc, doc, writeBatch, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import debtService from '../services/debtService'
import productService from '../services/productService'

export default function CheckoutModalWithDebt ({ onClose, userId }) {
  const { cart, getTotalPrice, getTotalItems, clearCart } = useCart()
  const { currentStore } = useStore()
  const { notifyTransactionSuccess, notifyStockOut, notifyLowStock } = useNotification()
  
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [isDebtTransaction, setIsDebtTransaction] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load customers on mount
  useEffect(() => {
    if (!userId) return

    const unsubscribe = debtService.subscribeToUserCustomers(userId, (data) => {
      setCustomers(data)
    })

    return () => unsubscribe()
  }, [userId])

  // Set default due date (7 days from now)
  useEffect(() => {
    if (isDebtTransaction && !dueDate) {
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 7)
      setDueDate(defaultDueDate.toISOString().split('T')[0])
    }
  }, [isDebtTransaction, dueDate])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentStore) {
      setError('Tidak ada toko yang dipilih')
      return
    }

    if (isDebtTransaction && !selectedCustomer) {
      setError('Pilih pelanggan untuk transaksi hutang')
      return
    }

    if (isDebtTransaction && !dueDate) {
      setError('Tanggal jatuh tempo wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Validasi stok terlebih dahulu
      const stockChecks = await Promise.all(
        cart.items.map(async (item) => {
          const productDoc = await getDoc(doc(db, 'products', item.id))
          if (!productDoc.exists()) {
            throw new Error(`Produk ${item.nama} tidak ditemukan`)
          }
          const currentStock = productDoc.data().stok || 0
          if (currentStock < item.quantity) {
            throw new Error(`Stok ${item.nama} tidak mencukupi. Tersedia: ${currentStock}`)
          }
          return { ...item, currentStock }
        })
      )

      // Mulai batch write
      const batch = writeBatch(db)
      
      // 1. Buat data transaksi
      const transactionData = {
        userId,
        storeId: currentStore.id,
        items: cart.items.map(item => ({
          productId: item.id,
          productName: item.nama,
          quantity: item.quantity,
          price: item.harga,
          subtotal: item.harga * item.quantity
        })),
        totalAmount: getTotalPrice(),
        totalItems: getTotalItems(),
        paymentMethod,
        isDebtTransaction,
        timestamp: serverTimestamp(),
        createdAt: new Date(),
        status: isDebtTransaction ? 'pending' : 'completed'
      }
      
      // 2. Tambahkan transaksi ke batch
      const transactionRef = doc(collection(db, 'transactions'))
      batch.set(transactionRef, transactionData)
      
      // 3. Update stok produk
      stockChecks.forEach((item) => {
        const productRef = doc(db, 'products', item.id)
        const newStock = item.currentStock - item.quantity
        batch.update(productRef, { stok: newStock })
        
        // Notifikasi stok habis atau hampir habis
        if (newStock === 0) {
          notifyStockOut(item.nama)
        } else if (newStock <= 5) {
          notifyLowStock(item.nama, newStock)
        }
      })
      
      // 4. Jika transaksi hutang, buat catatan hutang
      if (isDebtTransaction) {
        const debtData = {
          userId,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.nama,
          storeId: currentStore.id,
          transactionId: transactionRef.id,
          totalAmount: getTotalPrice(),
          paidAmount: 0,
          remainingAmount: getTotalPrice(),
          dueDate: new Date(dueDate),
          status: 'unpaid',
          description: `Transaksi ${getTotalItems()} item`,
          items: cart.items.map(item => ({
            productId: item.id,
            productName: item.nama,
            quantity: item.quantity,
            price: item.harga
          })),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        const debtRef = doc(collection(db, 'debts'))
        batch.set(debtRef, debtData)
      }
      
      // Eksekusi batch write
      await batch.commit()
      
      // Update transaction status to completed if not debt
      if (!isDebtTransaction) {
        await updateDoc(transactionRef, { status: 'completed' })
      }

      // Kirim notifikasi sukses
      notifyTransactionSuccess(
        getTotalPrice(), 
        isDebtTransaction ? 'hutang' : paymentMethod, 
        () => console.log('View transaction details')
      )

      // Clear cart and close modal
      clearCart()
      onClose()
    } catch (error) {
      console.error('Error processing transaction:', error)
      setError('Gagal memproses transaksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedCustomer(null)
    setPaymentMethod('cash')
    setIsDebtTransaction(false)
    setDueDate('')
    setError('')
    onClose()
  }

  if (!userId) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white w-full sm:max-w-lg mx-auto sm:rounded-2xl shadow-xl flex flex-col h-auto min-h-screen sm:min-h-0 sm:h-auto sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 sm:p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClose}
                  className="p-1 -ml-1 sm:hidden"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Checkout</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-2">
            {/* Cart Summary Card */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Ringkasan Belanja</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {cart.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {item.quantity}x {item.nama}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.harga * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          {/* Form Fields Card */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Transaction Type */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Transaksi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsDebtTransaction(false)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    !isDebtTransaction
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDebtTransaction(true)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    isDebtTransaction
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Hutang</span>
                </button>
              </div>
            </div>

            {/* Customer Selection (for debt) */}
            {isDebtTransaction && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pelanggan <span className="text-red-500">*</span>
                </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={selectedCustomer?.id || ''}
                      onChange={(e) => {
                        const customer = customers.find(c => c.id === e.target.value)
                        setSelectedCustomer(customer)
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="">Pilih pelanggan</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

            {/* Due Date (for debt) */}
            {isDebtTransaction && selectedCustomer && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jatuh Tempo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            {/* Payment Method (for cash) */}
            {!isDebtTransaction && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'cash'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Tunai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'transfer'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Transfer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Summary & Actions Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              {/* Total Summary */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total ({getTotalItems()} item)</span>
                  <span className="text-base font-bold text-blue-600">
                    {formatCurrency(getTotalPrice())}
                  </span>
                </div>
                
                {selectedDebt && (
                  <div className="bg-gray-50 rounded-lg p-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dibayar dengan Hutang</span>
                      <span className="font-medium">{formatCurrency(selectedDebt.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Sisa Bayar</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(getTotalPrice() - selectedDebt.amount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || (selectedDebt && selectedDebt.amount < getTotalPrice())}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-white transition-colors ${
                    loading || (selectedDebt && selectedDebt.amount < getTotalPrice())
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    'Bayar Sekarang'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
