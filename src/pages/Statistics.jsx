import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Activity,
  Award,
  Star,
  ShoppingCart,
  Lightbulb
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL } from '../apiClient'
import { formatCurrency } from '../utils/currencyFormatter'

export default function Statistics () {
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const { showNetworkError, showError } = useToast()
  const [summary, setSummary] = useState(null)
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState('week') // all, today, week, month, year, custom
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [dateRangeError, setDateRangeError] = useState('')

  useEffect(() => {
    if (!currentUser || !currentStore) {
      setSummary(null)
      setSales([])
      setProducts([])
      setLoading(false)
      return
    }

    async function fetchData () {
      setLoading(true)
      try {
        const [summaryRes, productsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/sales/summary?userId=${currentUser.id}&storeId=${currentStore.id}`),
          fetch(`${API_BASE_URL}/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
        ])

        if (!summaryRes.ok || !productsRes.ok) {
          throw new Error('Failed to load statistics')
        }

        const summaryData = await summaryRes.json()
        const productsData = await productsRes.json()

        setSummary(summaryData.data?.summary || null)
        setSales(summaryData.data?.sales || [])
        setProducts(productsData.data?.products || [])
      } catch (err) {
        console.error('Failed to load statistics:', err)
        setSummary(null)
        setSales([])
        setProducts([])

        if (showNetworkError) {
          showNetworkError()
        } else {
          showError('Gagal memuat data statistik. Periksa koneksi atau coba lagi.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser, currentStore])

  const validateDateRange = (start, end) => {
    if (!start || !end) {
      setDateRangeError('')
      return true
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    if (startDate > endDate) {
      setDateRangeError('Tanggal "Dari" tidak boleh lebih besar dari tanggal "Sampai"')
      return false
    }

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (startDate > today) {
      setDateRangeError('Tanggal "Dari" tidak boleh lebih besar dari hari ini')
      return false
    }
    if (endDate > today) {
      setDateRangeError('Tanggal "Sampai" tidak boleh lebih besar dari hari ini')
      return false
    }

    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (startDate < oneYearAgo) {
      setDateRangeError('Rentang tanggal maksimal 1 tahun dari hari ini')
      return false
    }

    setDateRangeError('')
    return true
  }

  const handleDateRangeChange = (field, value) => {
    const newRange = { ...customDateRange, [field]: value }
    setCustomDateRange(newRange)
    if (newRange.start && newRange.end) {
      validateDateRange(newRange.start, newRange.end)
    } else {
      setDateRangeError('')
    }
  }

  const getFilteredSales = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return sales.filter(sale => {
      if (!sale.timestamp) return false
      const saleDate = new Date(sale.timestamp)

      switch (filterPeriod) {
        case 'all':
          return true
        case 'today':
          return saleDate >= today
        case 'week': {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return saleDate >= weekAgo
        }
        case 'month': {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          return saleDate >= monthStart
        }
        case 'year': {
          const yearStart = new Date(now.getFullYear(), 0, 1)
          return saleDate >= yearStart
        }
        case 'custom': {
          if (!customDateRange.start || !customDateRange.end) return true
          if (dateRangeError) return true
          const startDate = new Date(customDateRange.start)
          const endDate = new Date(customDateRange.end)
          endDate.setHours(23, 59, 59, 999)
          return saleDate >= startDate && saleDate <= endDate
        }
        default:
          return true
      }
    })
  }

  const filteredSales = getFilteredSales()

  const getTotalRevenue = () => {
    return filteredSales.reduce((total, sale) => total + Number(sale.total_amount || 0), 0)
  }

  const getTotalTransactions = () => filteredSales.length

  const getAverageTransaction = () => {
    const total = getTotalRevenue()
    const count = getTotalTransactions()
    return count > 0 ? total / count : 0
  }

  const getTotalProfit = () => {
    // Approximate profit: sum over items (sale price - cost) * qty
    const productMap = products.reduce((map, p) => {
      map[p.id] = p
      return map
    }, {})

    return filteredSales.reduce((total, sale) => {
      if (!Array.isArray(sale.items)) return total
      const saleProfit = sale.items.reduce((s, item) => {
        const prod = productMap[item.id]
        const qty = item.qty || item.quantity || 1
        const price = Number(item.harga || item.price || 0)
        const cost = prod ? Number(prod.harga_modal || 0) : 0
        return s + (price - cost) * qty
      }, 0)
      return total + saleProfit
    }, 0)
  }

  const getTopProducts = () => {
    const productSales = {}

    filteredSales.forEach(sale => {
      if (!Array.isArray(sale.items)) return
      sale.items.forEach(item => {
        const name = item.nama || item.productName || 'Produk Tanpa Nama'
        const qty = item.qty || item.quantity || 1
        const revenue = Number(item.subtotal || 0)

        if (!productSales[name]) {
          productSales[name] = { name, qty: 0, revenue: 0 }
        }
        productSales[name].qty += qty
        productSales[name].revenue += revenue
      })
    })

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  const getSalesByDate = () => {
    const salesByDate = {}

    filteredSales.forEach(sale => {
      if (!sale.timestamp) return
      const d = new Date(sale.timestamp)
      const key = d.toLocaleDateString('id-ID')
      const revenue = Number(sale.total_amount || 0)
      salesByDate[key] = (salesByDate[key] || 0) + revenue
    })

    return Object.entries(salesByDate)
      .sort(([a], [b]) => {
        const [da, ma, ya] = a.split('/')
        const [db, mb, yb] = b.split('/')
        return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`)
      })
      .slice(-7)
  }

  const getBusiestDay = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weekSales = sales.filter(sale => {
      if (!sale.timestamp) return false
      const date = new Date(sale.timestamp)
      return date >= weekAgo
    })

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const dayCount = {}

    weekSales.forEach(sale => {
      const d = new Date(sale.timestamp)
      const dayName = dayNames[d.getDay()]
      dayCount[dayName] = (dayCount[dayName] || 0) + 1
    })

    const entries = Object.entries(dayCount)
    if (!entries.length) return null
    const [day, count] = entries.sort(([, a], [, b]) => b - a)[0]
    return { day, count }
  }

  const getAISuggestions = () => {
    const busiest = getBusiestDay()
    if (!busiest) return []

    const suggestions = []
    const avgTransaction = getAverageTransaction()
    const topProducts = getTopProducts()

    if (['Sabtu', 'Minggu'].includes(busiest.day)) {
      suggestions.push({
        title: 'Optimasi Jadwal Weekend',
        content: `Hari ${busiest.day} adalah hari tersibuk dengan ${busiest.count} transaksi. Pastikan stok produk terlaris mencukupi dan pertimbangkan jam operasional lebih panjang di weekend.`,
        type: 'schedule'
      })
    } else {
      suggestions.push({
        title: 'Pola Hari Kerja',
        content: `Hari ${busiest.day} menunjukkan aktivitas tinggi (${busiest.count} transaksi). Manfaatkan dengan promo khusus atau bundle produk di hari tersebut.`,
        type: 'schedule'
      })
    }

    if (topProducts.length > 0) {
      const top = topProducts[0]
      suggestions.push({
        title: 'Fokus Produk Unggulan',
        content: `${top.name} adalah produk dengan omzet tertinggi (${formatCurrency(top.revenue)}). Pastikan stok aman dan pertimbangkan varian atau paket bundling.`,
        type: 'product'
      })
    }

    if (avgTransaction > 10000) {
      suggestions.push({
        title: 'Strategi Premium',
        content: `Rata-rata nilai transaksi ${formatCurrency(avgTransaction)} cukup tinggi. Pertimbangkan peningkatan margin atau penambahan produk premium.`,
        type: 'pricing'
      })
    } else {
      suggestions.push({
        title: 'Strategi Volume',
        content: `Rata-rata nilai transaksi ${formatCurrency(avgTransaction)} relatif rendah. Fokus ke volume dengan diskon kuantitas atau promo bundling.`,
        type: 'volume'
      })
    }

    if (topProducts.length >= 3) {
      suggestions.push({
        title: 'Variasi Produk Baik',
        content: `Ada ${topProducts.length} produk yang berkontribusi signifikan pada omzet. Analisis peluang cross-selling di antara produk-produk ini.`,
        type: 'diversity'
      })
    }

    return suggestions
  }

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'all': return 'Semua'
      case 'today': return 'Hari Ini'
      case 'week': return '7 Hari Terakhir'
      case 'month': return 'Bulan Ini'
      case 'year': return 'Tahun Ini'
      case 'custom': return 'Periode Kustom'
      default: return 'Semua Data'
    }
  }

  const exportToCSV = () => {
    const filteredSales = getFilteredSales()
    
    if (filteredSales.length === 0) {
      if (showError) {
        showError('Tidak ada data untuk diexport pada periode ini')
      }
      return
    }

    // Prepare CSV data
    const headers = ['No', 'Order ID', 'Tanggal', 'Total', 'Items', 'Metode Pembayaran', 'Status']
    const rows = filteredSales.map((sale, index) => [
      index + 1,
      sale.order_id || '-',
      new Date(sale.timestamp).toLocaleString('id-ID'),
      formatCurrency(Number(sale.total_amount || 0)),
      sale.total_items || 0,
      sale.payment_method || 'tunai',
      sale.payment_status || 'completed'
    ])

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const periodLabel = getPeriodLabel()
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `Statistik_${periodLabel}_${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const salesByDate = getSalesByDate()
  const topProducts = getTopProducts()
  const suggestions = getAISuggestions()
  const totalRevenue = getTotalRevenue()
  const totalProfit = getTotalProfit()

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Data & Statistik</h1>
        <p className="text-gray-600">Analisis penjualan dan performa bisnis Anda</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !summary ? (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Belum ada data statistik</p>
        </div>
      ) : (
        <>
      {/* Filter Periode & Export Button */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Filter Periode</h3>
            <span className="text-sm text-gray-500">({getPeriodLabel()})</span>
          </div>
          {isFilterOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <motion.div
          initial={false}
          animate={{
            height: isFilterOpen ? 'auto' : 0,
            opacity: isFilterOpen ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'today', label: 'Hari Ini' },
                { value: 'week', label: '7 Hari' },
                { value: 'month', label: 'Bulan Ini' },
                { value: 'year', label: 'Tahun Ini' },
                { value: 'custom', label: 'Kustom' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => setFilterPeriod(period.value)}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    filterPeriod === period.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {filterPeriod === 'custom' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dari</label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={e => handleDateRangeChange('start', e.target.value)}
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                        dateRangeError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={e => handleDateRangeChange('end', e.target.value)}
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                        dateRangeError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                {dateRangeError && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <X className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-700">{dateRangeError}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pendapatan</p>
              <p className="text-lg font-bold text-gray-800 font-mono">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Profit (perkiraan)</p>
              <p className="text-lg font-bold text-gray-800 font-mono">{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-lg font-bold text-gray-800 font-mono">{getTotalTransactions()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Produk</p>
              <p className="text-lg font-bold text-gray-800">{products.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grafik Penjualan 7 Hari Terakhir */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Grafik Penjualan (7 Hari Terakhir)</h3>
          </div>
        </div>
        {salesByDate.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada data penjualan untuk periode ini.</p>
        ) : (
          <div className="space-y-2">
            {(() => {
              const maxRevenue = Math.max(...salesByDate.map(([, rev]) => rev)) || 1
              return salesByDate.map(([date, revenue]) => (
                <div key={date} className="flex items-center space-x-3">
                  <span className="w-24 text-xs text-gray-600">{date}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-blue-500"
                      style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="w-28 text-xs font-mono text-gray-700 text-right">
                    {formatCurrency(Math.round(revenue))}
                  </span>
                </div>
              ))
            })()}
          </div>
        )}
      </div>

      {/* Top Produk */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-800">Produk Terlaris</h3>
          </div>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada produk terjual pada periode ini.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div
                key={p.name}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    {idx === 0 ? (
                      <Award className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Star className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.qty} item terjual</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-mono font-semibold text-gray-800">{formatCurrency(p.revenue)}</p>
                  <p className="text-xs text-gray-500">Omzet</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insight / Saran */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-800">Insight & Rekomendasi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((s, idx) => (
              <div
                key={`${s.title}-${idx}`}
                className="border border-amber-100 rounded-lg p-3 bg-amber-50/50"
              >
                <p className="text-sm font-semibold text-gray-800 mb-1">{s.title}</p>
                <p className="text-xs text-gray-700 leading-snug">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Export CSV Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Export Data Statistik</h3>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Export data statistik penjualan ke file CSV untuk analisis lebih lanjut atau dokumentasi.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Cara Menggunakan:</h4>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Pilih periode data yang ingin diexport menggunakan <strong>Filter Periode</strong> di atas</li>
              <li>Klik tombol <strong>Export CSV</strong> di bawah ini</li>
              <li>File CSV akan otomatis terdownload dengan nama <code className="bg-blue-100 px-1 rounded">Statistik_[Periode]_[Tanggal].csv</code></li>
              <li>Buka file CSV menggunakan Excel, Google Sheets, atau aplikasi spreadsheet lainnya</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-600">
              <strong>Periode saat ini:</strong> <span className="text-blue-600 font-semibold">{getPeriodLabel()}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <strong>Total data:</strong> {getFilteredSales().length} transaksi
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={exportToCSV}
          disabled={getFilteredSales().length === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
        >
          <Package className="w-5 h-5" />
          {getFilteredSales().length === 0 ? 'Tidak Ada Data untuk Diexport' : 'Export CSV'}
        </button>
      </div>
        </>
      )}
    </div>
  )
}

