import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../config/firebase'
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { Package, Plus, Edit3, Trash2, AlertTriangle, Search } from 'lucide-react'
import StockUpdateModal from '../components/StockUpdateModal'
import EditProductModal from '../components/EditProductModal'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'

export default function Stock () {
  const { currentUser } = useAuth()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      try {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Sort by stock level (low stock first)
        productsData.sort((a, b) => (a.stok || 0) - (b.stok || 0))
        
        setProducts(productsData)
        setFilteredProducts(productsData)
        setLoading(false)
      } catch (error) {
        console.error('Error processing products data:', error)
        setLoading(false)
      }
    }, (error) => {
      console.error('Error fetching products:', error)
      setLoading(false)
      
      if (error.code === 'permission-denied') {
        console.log('Permission denied for products collection')
      }
    })

    return unsubscribe
  }, [currentUser])

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.kategori || 'Umum').toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [products, searchTerm])

  const handleStockUpdate = (product) => {
    setSelectedProduct(product)
    setShowStockModal(true)
  }

  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleDeleteProduct = (product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return
    
    setDeleteLoading(true)
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id))
      setShowDeleteModal(false)
      setProductToDelete(null)
      setTimeout(() => {
        alert(`✅ Produk "${productToDelete.nama}" berhasil dihapus dari sistem.`)
      }, 300)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('❌ Gagal menghapus produk. Silakan coba lagi.')
    }
    setDeleteLoading(false)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setProductToDelete(null)
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Habis', color: 'text-red-600 bg-red-50' }
    if (stock <= 5) return { label: 'Menipis', color: 'text-blue-600 bg-blue-50' } // 🔵 diganti biru
    if (stock <= 20) return { label: 'Normal', color: 'text-blue-700 bg-blue-100' } // 🔵
    return { label: 'Banyak', color: 'text-green-600 bg-green-50' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Manajemen Stok</h1>
        <p className="text-gray-600">Kelola stok produk Anda</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Cari produk atau kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white shadow-sm"
        />
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">Total Produk</p>
          <p className="text-lg font-bold text-blue-700">{products.length}</p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-gray-600">Stok Habis</p>
          <p className="text-lg font-bold text-red-600">
            {products.filter(p => p.stok === 0).length}
          </p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">Stok Menipis</p>
          <p className="text-lg font-bold text-blue-600">
            {products.filter(p => p.stok > 0 && p.stok <= 5).length}
          </p>
        </div>

        <div className="card text-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600">Total Stok</p>
          <p className="text-lg font-bold text-green-600">
            {products.reduce((total, p) => total + p.stok, 0)}
          </p>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {searchTerm ? 'Tidak ada produk yang sesuai' : 'Belum ada produk'}
          </h3>
          <p className="text-gray-400">
            {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Tambahkan produk di halaman Dashboard'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product, index) => {
            const stockStatus = getStockStatus(product.stok)

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="card p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h3 className="font-semibold text-blue-700 text-sm truncate">{product.nama}</h3>
                    <p className="text-xs text-blue-600 font-bold">Rp {product.harga.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500">Stok: {product.stok} {product.satuan}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEditProduct(product)}
                    className="flex items-center justify-center px-2 py-1 bg-blue-500 text-white rounded-md text-xs"
                    aria-label={`Edit ${product.nama}`}
                  >
                    <Edit3 size={14} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStockUpdate(product)}
                    className="flex-1 flex items-center justify-center px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold"
                    aria-label={`Tambah stok ${product.nama}`}
                  >
                    <Plus size={16} />
                    <span className="ml-1 text-xs">Stok</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDeleteProduct(product)}
                    className="flex items-center justify-center px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs border border-red-200"
                    aria-label={`Hapus ${product.nama}`}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showStockModal && selectedProduct && (
          <StockUpdateModal
            product={selectedProduct}
            onClose={() => {
              setShowStockModal(false)
              setSelectedProduct(null)
            }}
          />
        )}
        
        {showEditModal && selectedProduct && (
          <EditProductModal
            product={selectedProduct}
            onClose={() => {
              setShowEditModal(false)
              setSelectedProduct(null)
            }}
          />
        )}
      </AnimatePresence>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDeleteProduct}
        product={productToDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
