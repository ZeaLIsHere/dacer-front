import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { db } from '../config/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { ShoppingCart, Search, Filter } from 'lucide-react'
import ProductGrid from '../components/ProductGrid'
import CartModal from '../components/CartModal'
import CheckoutModal from '../components/CheckoutModal'

export default function Cashier () {
  const { currentUser } = useAuth()
  const { cart, getTotalItems } = useCart()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [categories, setCategories] = useState(['Semua'])

  useEffect(() => {
    if (!currentUser) return

    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setProducts(productsData)
      setFilteredProducts(productsData)
      
      // Extract unique categories
      const uniqueCategories = ['Semua', ...new Set(productsData.map(p => p.kategori || 'Umum'))]
      setCategories(uniqueCategories)
      
      setLoading(false)
    })

    return unsubscribe
  }, [currentUser])

  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nama.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(product => 
        (product.kategori || 'Umum') === selectedCategory
      )
    }

    filtered = filtered.filter(product => product.stok > 0)

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory])

  const handleCheckout = () => {
    if (cart.items.length === 0) return
    setShowCart(false)
    setShowCheckout(true)
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Kasir</h1>
        <p className="text-[#6B7280]">Pilih produk untuk dijual</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent"
            style={{ 
              borderColor: '#D1D5DB',
              backgroundColor: '#F9FAFB',
              color: '#1F2937'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B72FF'
              e.target.style.boxShadow = '0 0 0 2px rgba(59, 114, 255, 0.2)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#D1D5DB'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="flex-shrink-0 text-[#6B7280]" size={20} />
          {categories.map(category => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: selectedCategory === category ? '#3B72FF' : '#E5E7EB',
                color: selectedCategory === category ? 'white' : '#1F2937'
              }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" />
          <h3 className="text-lg font-medium mb-2 text-[#6B7280]">
            {searchTerm || selectedCategory !== 'Semua' 
              ? 'Tidak ada produk yang sesuai' 
              : 'Tidak ada produk tersedia'
            }
          </h3>
          <p className="text-[#9CA3AF] opacity-70">
            {searchTerm || selectedCategory !== 'Semua'
              ? 'Coba ubah pencarian atau filter'
              : 'Tambahkan produk di halaman Dashboard'
            }
          </p>
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <CartModal
            onClose={() => setShowCart(false)}
            onCheckout={handleCheckout}
          />
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            onClose={() => setShowCheckout(false)}
            userId={currentUser?.uid}
          />
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCart(true)}
        className="fixed bottom-24 right-4 bg-[#3B72FF] text-white p-4 rounded-full shadow-lg z-40"
      >
        <ShoppingCart size={24} />
        {getTotalItems() > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-[#2563EB] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          >
            {getTotalItems()}
          </motion.span>
        )}
      </motion.button>
    </div>
  )
}
