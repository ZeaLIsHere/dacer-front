import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { db } from '../config/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Plus, TrendingUp, Package, DollarSign, AlertTriangle } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import AddProductModal from '../components/AddProductModal'
import SalesInsights from '../components/SalesInsights'
import StockMonitorSystem from '../components/StockMonitorSystem'

export default function Dashboard () {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { showSuccess, showError } = useToast()
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [_insights, _setInsights] = useState(null)

  useEffect(() => {
    if (!currentUser) return

    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    )

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      try {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setProducts(productsData)
        setLoading(false)
      } catch (error) {
        console.error('Error processing products data:', error)
        setLoading(false)
      }
    }, (error) => {
      console.error('Error fetching products:', error)
      setProducts([])
      setLoading(false)
    })

    const salesQuery = query(
      collection(db, 'sales'),
      where('userId', '==', currentUser.uid)
    )

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      try {
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setSales(salesData)
      } catch (error) {
        console.error('Error processing sales data:', error)
        setSales([])
      }
    }, (error) => {
      console.error('Error fetching sales:', error)
      setSales([])
    })

    return () => {
      unsubscribeProducts()
      unsubscribeSales()
    }
  }, [currentUser])


  const handleSell = useCallback((product) => {
    if (!product) {
      showError('Produk tidak valid')
      return
    }
    
    if (product.stok <= 0) {
      showError('Stok habis!')
      return
    }

    try {
      addItem({
        id: product.id,
        nama: product.nama,
        harga: product.harga,
        satuan: product.satuan || 'pcs'
      })
      showSuccess(`${product.nama} ditambahkan ke keranjang!`)
      navigate('/cashier')
    } catch (error) {
      console.error('Error in handleSell:', error)
      showError('Terjadi kesalahan saat menambahkan produk ke keranjang')
    }
  }, [addItem, navigate, showSuccess, showError])

  const _getTotalRevenue = () => {
    return sales.reduce((total, sale) => total + (sale.price || sale.totalAmount || 0), 0)
  }

  const getTodayRevenue = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return sales.filter(sale => {
      if (!sale.timestamp) return false
      const saleDate = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp)
      return saleDate >= today && saleDate < tomorrow
    }).reduce((total, sale) => total + (sale.price || sale.totalAmount || 0), 0)
  }

  const getTodayTransactions = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return sales.filter(sale => {
      if (!sale.timestamp) return false
      const saleDate = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp)
      return saleDate >= today && saleDate < tomorrow
    }).length
  }

  const getTotalProducts = () => products.length

  const getLowStockProducts = () => products.filter(product => product.stok <= 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B72FF]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Kelola bisnis Anda dengan mudah</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/today-revenue')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)' }}>
              <DollarSign className="w-5 h-5" style={{ color: '#22C55E' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Pendapatan Hari Ini</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Rp {getTodayRevenue().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 114, 255, 0.1)' }}>
              <Package className="w-5 h-5" style={{ color: '#3B72FF' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Produk</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{getTotalProducts()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 114, 255, 0.1)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#3B72FF' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Penjualan Hari Ini</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {getTodayTransactions()} transaksi
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Stok Menipis</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{getLowStockProducts().length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <SalesInsights sales={sales} products={products} />

      {/* Products Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Produk Anda</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg"
          style={{ backgroundColor: '#3B72FF' }}
        >
          <Plus size={16} />
          <span>Tambah</span>
        </motion.button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Belum ada produk</h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>Tambahkan produk pertama Anda untuk memulai</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ backgroundColor: '#3B72FF', color: 'white' }}
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
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} onSell={handleSell} />
            </motion.div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          userId={currentUser.uid}
        />
      )}

      <StockMonitorSystem />
    </div>
  )
}
