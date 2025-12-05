import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Calendar, DollarSign, CheckCircle, AlertCircle, Package, Plus } from 'lucide-react'
import debtService from '../services/debtService'
import CustomerModal from './CustomerModal'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'

export default function CreateDebtFromCartModal ({ isOpen, onClose, cartData, onSuccess }) {
  const { currentUser } = useAuth()
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load customers
  useEffect(() => {
    if (!isOpen || !currentUser) return

    const unsubscribe = debtService.subscribeToUserCustomers(currentUser.uid, (data) => {
      setCustomers(data)
    })

    return () => unsubscribe()
  }, [isOpen, refreshKey, currentUser])

  // Set default due date (7 days from now)
  useEffect(() => {
    if (isOpen && !dueDate) {
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 7)
      setDueDate(defaultDueDate.toISOString().split('T')[0])
    }
  }, [isOpen, dueDate])

  const handleCustomerSuccess = () => {
    setShowCustomerModal(false)
    setRefreshKey(prev => prev + 1) // Refresh customer list
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedCustomer) {
      setError('Pilih pelanggan terlebih dahulu')
      return
    }

    if (!dueDate) {
      setError('Tanggal jatuh tempo wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create debt record
      await debtService.createDebt({
        userId: currentUser.uid,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.nama,
        storeId: 'default-store', // You might want to get this from context
        totalAmount: cartData.totalAmount,
        paidAmount: 0,
        remainingAmount: cartData.totalAmount,
        dueDate: new Date(dueDate),
        description: `Transaksi ${cartData.totalItems} item dari kasir`,
        items: cartData.items.map(item => ({
          productId: item.id,
          productName: item.nama,
          quantity: item.quantity,
          price: item.harga
        }))
      })

      // Create transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        storeId: 'default-store',
        items: cartData.items.map(item => ({
          productId: item.id,
          productName: item.nama,
          quantity: item.quantity,
          price: item.harga,
          subtotal: item.harga * item.quantity
        })),
        totalAmount: cartData.totalAmount,
        totalItems: cartData.totalItems,
        paymentMethod: 'debt',
        isDebtTransaction: true,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.nama,
        dueDate: new Date(dueDate),
        status: 'unpaid',
        timestamp: serverTimestamp(),
        createdAt: new Date()
      })

      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error('Error creating debt:', error)
      setError('Gagal membuat hutang. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedCustomer(null)
    setDueDate('')
    setError('')
    onClose()
  }

  if (!isOpen || !cartData) return null

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <motion.div
          key="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Buat Hutang</h2>
                <p className="text-sm text-gray-600">Dari keranjang kasir</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Ringkasan Transaksi</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cartData.items.map((item, index) => (
                <div key={`${item.id || 'item'}-${index}`} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.nama}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.harga * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total ({cartData.totalItems} item)</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(cartData.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Customer Selection */}
            <div>
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
                  <option value="">Pilih Pelanggan</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.nama} {customer.telepon && `(${customer.telepon})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between mt-2">
                {customers.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Belum ada pelanggan. Tambah pelanggan baru.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {customers.length} pelanggan tersedia
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Pelanggan</span>
                </button>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Jatuh Tempo <span className="text-red-500">*</span>
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

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !selectedCustomer || !dueDate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>Buat Hutang</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSuccess={handleCustomerSuccess}
      />
    </AnimatePresence>
  )
}
