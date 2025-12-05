import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  User, 
  Plus, 
  TrendingUp, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X 
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import debtService from '../services/debtService'
import CustomerModal from '../components/CustomerModal'
import DebtPaymentModal from '../components/DebtPaymentModal'
import CreateDebtFromCartModal from '../components/CreateDebtFromCartModal'
import { useAuth } from '../contexts/AuthContext'

export default function Debts () {
  const { currentUser } = useAuth()
  const location = useLocation()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDebt, setSelectedDebt] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCreateDebtModal, setShowCreateDebtModal] = useState(false)
  const [cartData, setCartData] = useState(null)

  // Load data
  useEffect(() => {
    if (!currentUser) return

    setLoading(true)
    const unsubscribeDebts = debtService.subscribeToUserDebts(currentUser.uid, (data) => {
      setDebts(data.map(debt => debtService.formatDebtForDisplay(debt)))
      setLoading(false)
    })

    return () => {
      unsubscribeDebts()
    }
  }, [currentUser])

  // Check for cart data from cashier
  useEffect(() => {
    if (location.state?.fromCashier && location.state?.cartData) {
      setCartData(location.state.cartData)
      setShowCreateDebtModal(true)
      
      // Clear the location state to prevent showing modal again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Analytics
  const analytics = debtService.getDebtAnalytics(debts)
  const overdueDebts = debtService.getOverdueDebts(debts)

  // Filter debts
  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
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

  const handlePaymentSuccess = () => {
    // Data will be updated automatically via real-time subscription
    setSelectedDebt(null)
    setShowPaymentModal(false)
  }

  const handleCreateDebtSuccess = () => {
    setCartData(null)
    setShowCreateDebtModal(false)
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manajemen Hutang</h1>
            <p className="text-gray-600 mt-1">Kelola hutang pelanggan dan pembayaran</p>
          </div>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
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
              {filteredDebts.map((debt, index) => (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={`p-3 rounded-lg border ${
                    debt.isOverdue 
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
                      <h3 className="font-semibold text-gray-800 text-sm">{debt.customerName}</h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        debt.status === 'paid' 
                          ? 'bg-green-100 text-green-700'
                          : debt.status === 'partially_paid'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {debt.statusText}
                      </span>
                      {debt.isOverdue && (
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
                      <span className="text-sm font-bold text-gray-800">{debt.displayAmount}</span>
                    </div>
                    {debt.paidAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Sudah Dibayar</span>
                        <span className="text-sm font-bold text-green-600">{debt.displayPaid}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Sisa Hutang</span>
                      <span className="text-sm font-bold text-blue-600">{debt.displayRemaining}</span>
                    </div>
                  </div>
                  
                  {/* Footer Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">Jatuh tempo: {debt.displayDueDate}</span>
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
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSuccess={() => setShowCustomerModal(false)}
      />

      <DebtPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        debt={selectedDebt}
        onSuccess={handlePaymentSuccess}
      />

      <CreateDebtFromCartModal
        isOpen={showCreateDebtModal}
        onClose={() => setShowCreateDebtModal(false)}
        cartData={cartData}
        onSuccess={handleCreateDebtSuccess}
      />
    </div>
  )
}
