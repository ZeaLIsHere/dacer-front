import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Calendar, BarChart3, PieChart, Activity, AlertCircle, AlertTriangle, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL } from '../apiClient'
import ProductCard from '../components/ProductCard'
import AddProductModal from '../components/AddProductModal'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const EMPTY_SUMMARY = {
  today: { totalRevenue: 0, totalTransactions: 0, totalItems: 0 },
  yesterday: { totalRevenue: 0, totalTransactions: 0, totalItems: 0 },
  week: { totalRevenue: 0, totalTransactions: 0, totalItems: 0 },
  month: { totalRevenue: 0, totalTransactions: 0, totalItems: 0 }
}

// Simple local insight generator to mirror old dashboard AI-like tips
function generateSimpleInsights (sales, products) {
  if (!Array.isArray(sales) || sales.length === 0 || !Array.isArray(products)) {
    return []
  }

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.price || s.total_amount || 0), 0)
  const totalTransactions = sales.length

  const productMap = {}
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      const id = item.id || item.productId || item.product_id
      if (!id) return
      if (!productMap[id]) {
        productMap[id] = { qty: 0, revenue: 0 }
      }
      productMap[id].qty += Number(item.quantity || item.qty || 0)
      productMap[id].revenue += Number(item.subtotal || 0)
    })
  })

  let bestProduct = null
  Object.entries(productMap).forEach(([id, stats]) => {
    if (!bestProduct || stats.revenue > bestProduct.stats.revenue) {
      const prod = products.find(p => p.id === id)
      bestProduct = { id, stats, product: prod }
    }
  })

  const insights = []

  if (totalRevenue > 0) {
    insights.push({
      title: 'Pendapatan hari ini',
      message: `Total pendapatan dari transaksi yang tercatat mencapai Rp ${totalRevenue.toLocaleString('id-ID')}.`,
      recommendation: 'Pertahankan performa penjualan dengan memastikan stok produk laris tetap aman.',
      priority: 'medium'
    })
  }

  if (bestProduct && bestProduct.product) {
    insights.push({
      title: 'Produk terlaris',
      message: `${bestProduct.product.nama || 'Produk'} menjadi salah satu penyumbang pendapatan terbesar.`,
      recommendation: 'Pertimbangkan untuk menambah stok atau membuat promosi khusus untuk produk ini.',
      priority: 'high'
    })
  }

  const lowStockProducts = products.filter(p => {
    const stok = Number(p.stok) || 0
    const batchSize = Number(p.batch_size) || 1
    return stok > 0 && stok <= batchSize
  })
  if (lowStockProducts.length > 0) {
    insights.push({
      title: 'Stok produk mulai menipis',
      message: `${lowStockProducts.length} produk memiliki stok yang hampir habis.`,
      recommendation: 'Segera lakukan restok untuk menghindari kehabisan barang saat permintaan naik.',
      priority: 'critical'
    })
  }

  return insights
}

export default function Dashboard () {
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const navigate = useNavigate()
  const { showNetworkError, showError } = useToast()
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [insights, setInsights] = useState([])
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch summary and products for analytics
  useEffect(() => {
    // Jika user atau store belum siap, jangan stuck di loading
    if (!currentUser || !currentStore) {
      setSummary(EMPTY_SUMMARY)
      setSales([])
      setInsights([])
      setError(null)
      setLoading(false)
      return
    }

    async function fetchData () {
      setLoading(true)
      setError(null)
      try {
        const [summaryRes, productsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/sales/summary?userId=${currentUser.id}&storeId=${currentStore.id}`),
          fetch(`${API_BASE_URL}/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
        ])
        if (!summaryRes.ok || !productsRes.ok) throw new Error('Failed to fetch data')
        const summaryData = await summaryRes.json()
        const productsData = await productsRes.json()

        const salesData = summaryData.data.sales || []
        const productList = productsData.data?.products || []

        setSummary(summaryData.data.summary || EMPTY_SUMMARY)
        setSales(salesData)
        setProducts(productList)

        const analyticsPayload = {
          sales: salesData.map(s => ({
            id: s.id,
            productId: s.items?.[0]?.id,
            price: s.total_amount,
            timestamp: s.timestamp,
            totalItems: s.total_items,
            items: s.items
          })),
          products: productList
        }

        // Untuk saat ini, selalu gunakan generator lokal agar tidak tergantung endpoint /api/analytics
        setInsights(generateSimpleInsights(analyticsPayload.sales, analyticsPayload.products))
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError('Gagal memuat data dashboard')

        if (showNetworkError) {
          showNetworkError()
        } else {
          showError('Gagal memuat data dashboard. Periksa koneksi atau coba lagi.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentUser, currentStore])

  // Process data for charts
  const weeklyChartData = useMemo(() => {
    if (!sales.length) return []
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    const today = new Date()
    const weekData = days.map((day, idx) => {
      const date = new Date(today)
      date.setDate(today.getDate() - today.getDay() + idx)
      const daySales = sales.filter(s => {
        const saleDate = new Date(s.timestamp)
        return saleDate.toDateString() === date.toDateString()
      })
      return {
        day,
        revenue: daySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
        transactions: daySales.length
      }
    })
    return weekData
  }, [sales])

  const categoryData = useMemo(() => {
    if (!sales.length) return []
    const categoryMap = {}
    sales.forEach(sale => {
      sale.items?.forEach(item => {
        const cat = item.kategori || 'Lainnya'
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(item.subtotal || 0)
      })
    })
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
  }, [sales])

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  // Helper functions to mirror old dashboard metrics
  const getTodayRevenue = () => {
    if (!sales.length) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return sales
      .filter(sale => {
        if (!sale.timestamp) return false
        const saleDate = new Date(sale.timestamp)
        return saleDate >= today && saleDate < tomorrow
      })
      .reduce((total, sale) => total + Number(sale.total_amount || 0), 0)
  }

  const getTodayTransactions = () => {
    if (!sales.length) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return sales.filter(sale => {
      if (!sale.timestamp) return false
      const saleDate = new Date(sale.timestamp)
      return saleDate >= today && saleDate < tomorrow
    }).length
  }

  const getTotalProducts = () => products.length

  const getLowStockProducts = () => {
    if (!products.length) return []
    return products.filter(product => {
      const stok = Number(product.stok) || 0
      const batchSize = Number(product.batch_size) || 1

      if (stok === 0) return true
      if (stok <= 0.5 * batchSize) return true
      return false
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Gunakan fallback agar tidak pernah baca properti dari null
  const safeSummary = summary || EMPTY_SUMMARY

  // Stats cards adapted to mirror old Firebase dashboard metrics
  const statCards = [
    {
      key: 'today-revenue',
      title: 'Total Pendapatan Hari Ini',
      value: `Rp ${getTodayRevenue().toLocaleString('id-ID')}`,
      change: `${getTodayTransactions()} transaksi`,
      icon: DollarSign,
      color: 'bg-green-100 text-green-700',
      trend: getTodayTransactions() > 0 ? 'up' : 'neutral',
      subtitle: 'Tap untuk lihat detail',
      clickable: true,
      onClick: () => navigate('/today-revenue')
    },
    {
      key: 'total-products',
      title: 'Total Produk',
      value: getTotalProducts(),
      change: '',
      icon: Package,
      color: 'bg-blue-100 text-blue-700',
      trend: 'neutral',
      subtitle: 'Produk terdaftar di toko',
      clickable: false
    },
    {
      key: 'today-transactions',
      title: 'Penjualan Hari Ini',
      value: `${getTodayTransactions()} transaksi`,
      change: '',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-700',
      trend: getTodayTransactions() > 0 ? 'up' : 'neutral',
      subtitle: 'Total transaksi hari ini',
      clickable: false
    },
    {
      key: 'low-stock',
      title: 'Stok Menipis',
      value: getLowStockProducts().length,
      change: '',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-700',
      trend: getLowStockProducts().length > 0 ? 'down' : 'neutral',
      subtitle: 'Produk yang perlu restock',
      clickable: false
    }
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Dashboard</h1>
        <p className="text-gray-600">Kelola bisnis Anda dengan mudah</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white rounded-lg shadow-sm border p-4 ${card.clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={card.clickable && card.onClick ? card.onClick : undefined}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              {card.change !== '' && (
                <div className="flex items-center gap-1">
                  {card.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : card.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    card.trend === 'up' ? 'text-green-600' : card.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {card.change}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-gray-500 text-sm mb-1">{card.title}</h3>
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Produk Anda */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Produk Anda</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
            style={{ backgroundColor: '#3B82F6' }}
          >
            <Plus size={16} />
            <span>Tambah</span>
          </motion.button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2 text-gray-700">Belum ada produk</h3>
            <p className="mb-4 text-gray-500">Tambahkan produk pertama Anda untuk memulai</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#3B82F6' }}
            >
              Tambah Produk
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Penjualan Minggu Ini
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Penjualan per Kategori
          </h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Belum ada data kategori</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Insight & Rekomendasi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 6).map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
                className={`p-4 rounded-lg border ${
                  insight.priority === 'critical' ? 'border-red-200 bg-red-50' :
                  insight.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                  insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                <p className="text-xs text-gray-700 mb-2">{insight.message}</p>
                {insight.recommendation && (
                  <p className="text-xs text-gray-600 italic">{insight.recommendation}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Sales Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Transaksi Terbaru
          </h2>
        </div>
        <div className="overflow-x-auto">
          {sales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.slice(0, 10).map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{sale.order_id}</td>
                    <td className="px-4 py-3 text-sm">{new Date(sale.timestamp).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm">{sale.total_items} item</td>
                    <td className="px-4 py-3 text-sm font-medium">Rp {Number(sale.total_amount).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm capitalize">{sale.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          userId={currentUser?.id}
        />
      )}
    </div>
  )
}
