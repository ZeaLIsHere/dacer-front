import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Plus, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Printer 
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL } from '../apiClient'
import { formatCurrency } from '../utils/currencyFormatter'

export default function Debts () {
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const location = useLocation()
  const { showSuccess, showError } = useToast()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDebt, setSelectedDebt] = useState(null)
  const [showCreateDebtModal, setShowCreateDebtModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('tunai') // 'tunai' | 'qris'
  const [cartData, setCartData] = useState(null)
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false)
  const [lastPaymentData, setLastPaymentData] = useState(null)

  // Load data
  useEffect(() => {
    // Jika user atau store belum siap, jangan stuck di loading
    if (!currentUser || !currentStore) {
      setDebts([])
      setLoading(false)
      return
    }

    async function fetchDebts () {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/debts?userId=${currentUser.id}&storeId=${currentStore.id}`)
        const { data } = await res.json()
        setDebts(data?.debts || [])
      } catch (err) {
        console.error('Failed to load debts:', err)
        setDebts([])
      } finally {
        setLoading(false)
      }
    }
    fetchDebts()
  }, [currentUser, currentStore])

  // Check for cart data from cashier
  useEffect(() => {
    if (location.state?.fromCashier && location.state?.cartData) {
      setCartData(location.state.cartData)
      setShowCreateDebtModal(true)
      
      // Clear the location state to prevent showing modal again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Analytics (mirroring old debtService.getDebtAnalytics)
  const totalDebt = debts.reduce((sum, d) => sum + Number(d.amount || 0), 0)
  const totalPaid = debts.reduce((sum, d) => sum + Number(d.amount_paid || 0), 0)
  const totalRemaining = totalDebt - totalPaid
  const totalDebts = debts.length
  const unpaidDebts = debts.filter(d => d.status === 'unpaid').length
  const partiallyPaidDebts = debts.filter(d => d.status === 'partially_paid').length
  const paidDebts = debts.filter(d => d.status === 'paid').length
  const overdueDebts = debts.filter(d => d.status !== 'paid' && d.due_date && new Date(d.due_date) < new Date())
  const overdueAmount = overdueDebts.reduce((sum, d) => sum + (Number(d.amount || 0) - Number(d.amount_paid || 0)), 0)

  const analytics = {
    totalDebt,
    totalPaid,
    totalRemaining,
    totalDebts,
    unpaidDebts,
    partiallyPaidDebts,
    paidDebts,
    overdueAmount
  }

  // Filter debts
  const filteredDebts = debts.filter(debt => {
    const customerName = debt.customer_name || debt.customerName || ''
    const description = debt.description || ''
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || debt.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'partially_paid':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'unpaid':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const handlePayment = (debt) => {
    setSelectedDebt(debt)
    setShowPaymentModal(true)
  }

  const handlePayDebt = async () => {
    if (!selectedDebt || !paymentAmount || paymentAmount <= 0) return
    try {
      // Jika metode QRIS, jalankan Midtrans terlebih dahulu
      if (paymentMethod === 'qris') {
        if (!window.snap) {
          throw new Error('Layanan pembayaran QRIS tidak tersedia')
        }

        const checkoutRes = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            storeId: currentStore.id,
            amount: Number(paymentAmount),
            customer: {
              firstName: selectedDebt.customer_name || selectedDebt.customerName || 'Customer',
              email: 'customer@example.com',
              phone: '08123456789'
            }
          })
        })

        if (!checkoutRes.ok) throw new Error('Gagal memulai pembayaran QRIS')

        const checkoutData = await checkoutRes.json()
        const snapToken = checkoutData?.data?.snapToken
        if (!snapToken) throw new Error('Token pembayaran QRIS tidak tersedia')

        await new Promise((resolve, reject) => {
          window.snap.pay(snapToken, {
            onSuccess: () => resolve(),
            onPending: () => resolve(),
            onError: (err) => reject(err),
            onClose: () => resolve()
          })
        })
      }

      const newAmountPaid = Number(selectedDebt.amount_paid) + Number(paymentAmount)
      const payload = {
        amount_paid: newAmountPaid,
        status: newAmountPaid >= Number(selectedDebt.amount) ? 'paid' : 'partially_paid'
      }
      const res = await fetch(`${API_BASE_URL}/api/debts/${selectedDebt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update debt')
      // Refresh list
      const updated = await fetch(`${API_BASE_URL}/api/debts?userId=${currentUser.id}&storeId=${currentStore.id}`)
      const updatedData = await updated.json()
      setDebts(updatedData.data?.debts || [])

      // Simpan data pembayaran untuk struk
      const paymentData = {
        debtId: selectedDebt.id,
        timestamp: new Date(),
        customerName: selectedDebt.customer_name || selectedDebt.customerName,
        description: selectedDebt.description,
        payment_method: paymentMethod,
        totalDebt: Number(selectedDebt.amount),
        paidBefore: Number(selectedDebt.amount_paid),
        amountPaid: Number(paymentAmount),
        remaining: Number(selectedDebt.amount) - newAmountPaid,
        status: newAmountPaid >= Number(selectedDebt.amount) ? 'Lunas' : 'Sebagian'
      }
      setLastPaymentData(paymentData)

      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentMethod('tunai')
      setSelectedDebt(null)
      showSuccess('Pembayaran berhasil dicatat')
      setLastPaymentData({
        debtId: selectedDebt.id,
        customerName: selectedDebt.customer_name || selectedDebt.customerName,
        amountPaid: Number(paymentAmount),
        remaining: Number(selectedDebt.amount) - newAmountPaid
      })
      setShowPaymentSuccessModal(true)
    } catch (err) {
      console.error('Payment error:', err)
      showError('Gagal membayar hutang')
    }
  }

  const handleCreateDebtSuccess = () => {
    setCartData(null)
    setShowCreateDebtModal(false)
  }

  // Print receipt function untuk pembayaran hutang
  const printDebtReceipt = (paymentData) => {
    const receiptContent = `
      <html>
        <head>
          <title>Struk Pembayaran Hutang - ${currentStore?.nama || 'Kasir'}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
            .footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 20px; text-align: center; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${currentStore?.nama || 'Kasir'}</h2>
            <p>${currentStore?.alamat || ''}</p>
            <p>Telp: ${currentStore?.telepon || ''}</p>
            <p>=====================</p>
          </div>
          
          <div>
            <p>No: ${paymentData.debtId || 'N/A'}</p>
            <p>Tanggal: ${new Date(paymentData.timestamp).toLocaleString('id-ID')}</p>
            <p>Kasir: ${currentUser?.nama || 'Admin'}</p>
            <p>Pelanggan: ${paymentData.customerName}</p>
            ${paymentData.description ? `<p>Deskripsi: ${paymentData.description}</p>` : ''}
            <p>Metode: ${paymentData.payment_method}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Detail Pembayaran:</h3>
            <div class="item">
              <span>Total Hutang:</span>
              <span>{formatCurrency(Number(paymentData.totalDebt))}</span>
            </div>
            <div class="item">
              <span>Sudah Dibayar (sebelumnya):</span>
              <span>{formatCurrency(Number(paymentData.paidBefore))}</span>
            </div>
            <div class="item">
              <span>Dibayar Sekarang:</span>
              <span>{formatCurrency(Number(paymentData.amountPaid))}</span>
            </div>
          </div>
          
          <div class="total">
            <div class="item">
              <span><strong>Sisa Hutang:</strong></span>
              <span><strong>{formatCurrency(Number(paymentData.remaining))}</strong></span>
            </div>
            <div class="item">
              <span>Status:</span>
              <span><strong>${paymentData.status}</strong></span>
            </div>
          </div>
          
          <div class="footer">
            <p>=====================</p>
            <p>Terima kasih atas pembayaran Anda</p>
            <p>Simpan struk ini sebagai bukti pembayaran</p>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(receiptContent)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data hutang...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-2">Manajemen Hutang</h1>
          <p className="text-gray-600">Kelola hutang pelanggan dan pembayaran</p>
        </div>

        <div className="flex justify-center sm:justify-end mb-4">
          <button
            onClick={() => {
              setCartData(null)
              setShowCreateDebtModal(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Hutang</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Total Hutang</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(analytics.totalDebt)}</p>
            <p className="text-xs text-gray-600 mt-1">{analytics.totalDebts} transaksi</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xs text-gray-500">Belum Lunas</span>
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(analytics.totalRemaining)}</p>
            <p className="text-xs text-gray-600 mt-1">{analytics.unpaidDebts + analytics.partiallyPaidDebts} aktif</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs text-gray-500">Jatuh Tempo</span>
            </div>
            <p className="text-xl font-bold text-orange-600">{overdueDebts.length}</p>
            <p className="text-xs text-gray-600 mt-1">{formatCurrency(analytics.overdueAmount)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Lunas</span>
            </div>
            <p className="text-xl font-bold text-green-600">{analytics.paidDebts}</p>
            <p className="text-xs text-gray-600 mt-1">{formatCurrency(analytics.totalPaid)}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pelanggan atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua Status</option>
                <option value="unpaid">Belum Bayar</option>
                <option value="partially_paid">Sebagian</option>
                <option value="paid">Lunas</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Debts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Daftar Hutang</h2>
          
          {filteredDebts.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada data hutang</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Coba ubah filter atau pencarian' 
                  : 'Mulai dengan menambah pelanggan dan transaksi hutang'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDebts.map((debt, index) => {
                const customerName = debt.customer_name || debt.customerName || '-'
                const amount = Number(debt.amount || 0)
                const paid = Number(debt.amount_paid || 0)
                const remaining = amount - paid
                const isOverdue = debt.status !== 'paid' && debt.due_date && new Date(debt.due_date) < new Date()
                const statusText = debt.status === 'paid'
                  ? 'Lunas'
                  : debt.status === 'partially_paid'
                    ? 'Sebagian'
                    : 'Belum Bayar'
                const dueDateText = debt.due_date
                  ? new Date(debt.due_date).toLocaleDateString('id-ID')
                  : '-'

                return (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={`p-3 rounded-lg border ${
                    isOverdue 
                      ? 'bg-red-50 border-red-200' 
                      : debt.status === 'paid'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(debt.status)}
                      <h3 className="font-semibold text-gray-800 text-sm">{customerName}</h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        debt.status === 'paid' 
                          ? 'bg-green-100 text-green-700'
                          : debt.status === 'partially_paid'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {statusText}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Terlambat
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  {debt.description && (
                    <p className="text-xs text-gray-600 mb-2">{debt.description}</p>
                  )}
                  
                  {/* Amount Info */}
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Total Hutang</span>
                      <span className="text-sm font-bold text-gray-800">{formatCurrency(amount)}</span>
                    </div>
                    {paid > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Sudah Dibayar</span>
                        <span className="text-sm font-bold text-green-600">{formatCurrency(paid)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Sisa Hutang</span>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(remaining)}</span>
                    </div>
                  </div>
                  
                  {/* Footer Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">Jatuh tempo: {dueDateText}</span>
                    </div>
                    
                    {debt.status !== 'paid' && (
                      <button
                        onClick={() => handlePayment(debt)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Bayar</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )})}
            </div>
          )}
        </div>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedDebt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Bayar Utang</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Pelanggan</p>
                  <p className="font-medium">{selectedDebt.customer_name}</p>
                </div>
                {selectedDebt.description && (
                  <div>
                    <p className="text-sm text-gray-600">Deskripsi</p>
                    <p className="text-sm">{selectedDebt.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Utang</p>
                    <p className="font-medium">{formatCurrency(Number(selectedDebt.amount))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sudah Dibayar</p>
                    <p className="font-medium text-green-600">{formatCurrency(Number(selectedDebt.amount_paid))}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah Pembayaran</label>
                  <input
                    type="number"
                    min="0"
                    max={Number(selectedDebt.amount) - Number(selectedDebt.amount_paid)}
                    placeholder="Masukkan jumlah"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                  />
                  {paymentAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      Sisa setelah bayar: {formatCurrency(Number(selectedDebt.amount) - Number(selectedDebt.amount_paid) - Number(paymentAmount))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                  <div className="space-y-3">
                    {/* Tunai */}
                    <div
                      onClick={() => setPaymentMethod('tunai')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'tunai'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <DollarSign className={`w-5 h-5 ${paymentMethod === 'tunai' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">Tunai</p>
                          <p className="text-sm text-gray-600">Pembayaran langsung</p>
                        </div>
                      </div>
                    </div>

                    {/* QRIS */}
                    <div
                      onClick={() => setPaymentMethod('qris')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'qris'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className={`w-5 h-5 ${paymentMethod === 'qris' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">QRIS</p>
                          <p className="text-sm text-gray-600">Scan QR Code untuk bayar</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPaymentAmount('')
                      setPaymentMethod('tunai')
                      setSelectedDebt(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePayDebt}
                    disabled={!paymentAmount || paymentAmount <= 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Bayar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Debt from Cart / Manual Modal */}
      <AnimatePresence>
        {showCreateDebtModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateDebtModal(false)
              setCartData(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Buat Hutang Baru</h2>
              <CreateDebtForm
                currentUser={currentUser}
                currentStore={currentStore}
                cartData={cartData}
                onSuccess={async () => {
                  // refresh debts
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/debts?userId=${currentUser.id}&storeId=${currentStore.id}`)
                    const { data } = await res.json()
                    setDebts(data?.debts || [])
                  } catch (e) {
                    console.error('Failed to refresh debts after create:', e)
                  }
                  handleCreateDebtSuccess()
                }}
                onClose={() => {
                  setShowCreateDebtModal(false)
                  setCartData(null)
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Success Modal */}
      <AnimatePresence>
        {showPaymentSuccessModal && lastPaymentData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Pembayaran Berhasil!</h2>
                <p className="text-gray-600 mb-1">Hutang #{lastPaymentData.debtId}</p>
                <p className="text-sm text-gray-500 mb-6">Dibayar: {formatCurrency(Number(lastPaymentData.amountPaid))}</p>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPaymentSuccessModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Selesai
                  </button>
                  <button
                    onClick={() => printDebtReceipt(lastPaymentData)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Printer className="w-4 h-4 inline mr-2" />
                    Print Struk
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateDebtForm ({ currentUser, currentStore, cartData, onSuccess, onClose }) {
  const [customerName, setCustomerName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState(cartData?.totalAmount || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showSuccess, showError } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser || !currentStore) return

    const numericAmount = Number(amount || 0)
    if (!customerName || numericAmount <= 0) return

    setIsSubmitting(true)
    try {
      // Create debt record
      const debtPayload = {
        userId: currentUser.id,
        storeId: currentStore.id,
        customer_name: customerName,
        description,
        amount: numericAmount,
        amount_paid: 0,
        status: 'unpaid',
        due_date: dueDate || null,
        items: cartData?.items || null,
        total_items: cartData?.totalItems || null
      }

      const debtRes = await fetch(`${API_BASE_URL}/api/debts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtPayload)
      })

      if (!debtRes.ok) {
        const errorText = await debtRes.text()
        throw new Error(`Failed to create debt: ${errorText}`)
      }

      const debtData = await debtRes.json()

      // Create sales record if cart data exists (from cashier)
      if (cartData && cartData.items) {
        const salesPayload = {
          userId: currentUser.id,
          storeId: currentStore.id,
          customer_name: customerName,
          payment_method: 'hutang',
          total_amount: numericAmount,
          total_items: cartData.totalItems,
          items: cartData.items.map(item => ({
            id: item.id,
            nama: item.nama,
            kategori: item.kategori,
            quantity: item.quantity,
            harga: item.harga,
            subtotal: item.subtotal
          })),
          debt_id: debtData.debt?.id || debtData.id // Link to debt record
        }

        const salesRes = await fetch(`${API_BASE_URL}/api/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(salesPayload)
        })

        if (!salesRes.ok) {
          const errorText = await salesRes.text()
          console.warn('Sales record creation failed:', errorText)
        }
      }

      await onSuccess()
      showSuccess('Hutang berhasil dibuat')
    } catch (err) {
      console.error('Create debt error:', err)
      showError(err.message || 'Gagal membuat hutang')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nama Pelanggan</label>
        <input
          type="text"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Deskripsi</label>
        <textarea
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Jumlah Hutang</label>
          <input
            type="number"
            min="0"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
          {cartData && (
            <p className="text-xs text-gray-500 mt-1">Diambil dari total keranjang: {formatCurrency(cartData.totalAmount)}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jatuh Tempo</label>
          <input
            type="date"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Hutang'}
        </button>
      </div>
    </form>
  )
}

