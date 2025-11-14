import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../config/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Clock,
  Receipt
} from 'lucide-react'

export default function TodayRevenue () {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [todaySales, setTodaySales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid)
    )

    const salesQuery = query(
      collection(db, 'sales'),
      where('userId', '==', currentUser.uid)
    )

    let allTransactions = []
    let loadedCollections = 0
    const totalCollections = 2

    const processData = () => {
      if (loadedCollections < totalCollections) return

      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const todaysSalesData = allTransactions.filter(sale => {
          if (!sale.timestamp && !sale.createdAt) return false
          const saleTimestamp = sale.timestamp || sale.createdAt
          let saleDate
          if (saleTimestamp?.toDate) saleDate = saleTimestamp.toDate()
          else if (saleTimestamp instanceof Date) saleDate = saleTimestamp
          else if (typeof saleTimestamp === 'string') saleDate = new Date(saleTimestamp)
          else return false
          return saleDate >= today && saleDate < tomorrow
        })
        
        todaysSalesData.sort((a, b) => {
          const timestampA = a.timestamp || a.createdAt
          const timestampB = b.timestamp || b.createdAt
          const dateA = timestampA?.toDate ? timestampA.toDate() : new Date(timestampA)
          const dateB = timestampB?.toDate ? timestampB.toDate() : new Date(timestampB)
          return dateB - dateA
        })
        
        setTodaySales(todaysSalesData)
        setLoading(false)
      } catch (error) {
        console.error('Error processing today sales:', error)
        setTodaySales([])
        setLoading(false)
      }
    }

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'transactions'
      }))
      allTransactions = allTransactions.filter(item => item.source !== 'transactions')
      allTransactions = [...allTransactions, ...transactionsData]
      loadedCollections = Math.max(loadedCollections, 1)
      processData()
    })

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'sales'
      }))
      allTransactions = allTransactions.filter(item => item.source !== 'sales')
      allTransactions = [...allTransactions, ...salesData]
      loadedCollections = Math.max(loadedCollections, 2)
      processData()
    })

    return () => {
      unsubscribeTransactions()
      unsubscribeSales()
    }
  }, [currentUser])

  const getTodayTotal = () => todaySales.reduce((t, s) => t + (s.totalAmount || s.price || 0), 0)
  const getTotalTransactions = () => todaySales.length
  const getTotalItems = () =>
    todaySales.reduce((t, s) => t + (s.items?.reduce((iT, i) => iT + i.quantity, 0) || 0), 0)

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Tidak diketahui'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Tidak diketahui'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B72FF]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold text-secondary">Detail Penjualan Hari Ini</h1>
          <p className="text-gray-600">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pendapatan</p>
              <p className="text-lg font-bold text-secondary">
                Rp {getTodayTotal().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-lg font-bold text-secondary">
                {getTotalTransactions()} transaksi
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Item Terjual</p>
              <p className="text-lg font-bold text-secondary">{getTotalItems()} item</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#3B72FF]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-secondary">Riwayat Transaksi</h3>
            <p className="text-sm text-gray-600">Semua transaksi hari ini</p>
          </div>
        </div>

        {todaySales.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">Belum ada transaksi hari ini</h3>
            <p className="text-gray-400">Transaksi akan muncul di sini setelah ada penjualan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaySales.map((sale, index) => (
              <motion.div key={sale.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {formatTime(sale.timestamp)}
                      </span>
                      <span className="px-2 py-1 bg-[#E8F0FF] text-[#3B72FF] text-xs rounded-full">
                        {sale.paymentMethod || 'Tunai'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {sale.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.nama} x {item.quantity}</span>
                          <span className="font-medium">Rp {(item.harga * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-[#3B72FF]">
                      Rp {(sale.totalAmount || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sale.items?.reduce((t, i) => t + i.quantity, 0) || 0} item
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
