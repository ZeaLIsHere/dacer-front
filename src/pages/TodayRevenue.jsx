import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, DollarSign, Calendar, BarChart3, Clock, Receipt } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { API_BASE_URL } from '../apiClient'
import { formatCurrency } from '../utils/currencyFormatter'

export default function TodayRevenue () {
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const navigate = useNavigate()
  const [todaySummary, setTodaySummary] = useState(null)
  const [todaySales, setTodaySales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser || !currentStore) return
    async function fetchToday () {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/sales/summary?userId=${currentUser.id}&storeId=${currentStore.id}`)
        const { data } = await res.json()
        setTodaySummary(data.summary?.today || null)

        // sales array from backend, filter to today just in case
        const allSales = data.sales || []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todaysSales = allSales.filter(sale => {
          if (!sale.timestamp) return false
          const saleDate = new Date(sale.timestamp)
          return saleDate >= today && saleDate < tomorrow
        })
        // sort desc by time
        todaysSales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setTodaySales(todaysSales)
      } catch (err) {
        console.error('Failed to load today revenue:', err)
        setTodaySummary(null)
        setTodaySales([])
      } finally {
        setLoading(false)
      }
    }
    fetchToday()
  }, [currentUser, currentStore])

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Tidak diketahui'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header dengan tombol kembali dan tanggal */}
      <div className="flex items-center space-x-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold text-blue-700 mb-1">Detail Penjualan Hari Ini</h1>
          <p className="text-gray-600">{formatDate(new Date())}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Memuat data...</div>
      ) : !todaySummary ? (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Belum ada penjualan hari ini</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full inline-block mb-3">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold">{formatCurrency(todaySummary.totalRevenue)}</h3>
                <p className="text-gray-500">Total Pendapatan</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full inline-block mb-3">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold">{todaySummary.totalTransactions}</h3>
                <p className="text-gray-500">Transaksi</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full inline-block mb-3">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold">{todaySummary.totalItems}</h3>
                <p className="text-gray-500">Item Terjual</p>
              </div>
            </div>
          </motion.div>

          {/* Riwayat Transaksi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Riwayat Transaksi</h3>
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
                  <motion.div
                    key={sale.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {formatTime(sale.timestamp)}
                          </span>
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                            {sale.payment_method || 'tunai'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {sale.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.nama} x {item.qty}</span>
                              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(sale.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sale.total_items || (sale.items?.reduce((t, i) => t + (i.qty || 0), 0) || 0)} item
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
