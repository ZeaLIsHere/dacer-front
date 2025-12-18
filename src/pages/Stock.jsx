import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Package, TrendingUp, TrendingDown, AlertCircle, AlertTriangle, Edit2, Trash2, Plus, ArrowUpDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useToast } from '../contexts/ToastContext'
import { apiFetch } from '../apiClient'
import { formatCurrency } from '../utils/currencyFormatter'

export default function Stock () {
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const { showSuccess, showError, showProductUpdated, showProductDeleted } = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortBy, setSortBy] = useState('nama')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState('') // 'add' or 'set'
  const [bulkValue, setBulkValue] = useState('')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Load products
  useEffect(() => {
    if (!currentUser || !currentStore) return
    async function fetchProducts () {
      setLoading(true)
      try {
        const { data } = await apiFetch(`/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
        setProducts(data?.products || [])
      } catch (err) {
        console.error('Failed to load products:', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentUser, currentStore])

  const handleSaveProduct = async () => {
    if (!selectedProduct) return
    try {
      await apiFetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: currentUser.id,
          storeId: currentStore.id,
          nama: selectedProduct.nama,
          harga: Number(selectedProduct.harga) || 0,
          harga_modal: Number(selectedProduct.harga_modal) || 0,
          stok: Number(selectedProduct.stok) || 0,
          kategori: selectedProduct.kategori || '',
          batch_size: Number(selectedProduct.batch_size) || 1,
          satuan: selectedProduct.satuan || ''
        })
      })

      const refreshData = await apiFetch(`/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
      setProducts(refreshData.data?.products || [])
      setShowEditModal(false)
      setSelectedProduct(null)
      if (showProductUpdated) {
        showProductUpdated(selectedProduct.nama)
      } else {
        showSuccess('Produk berhasil diperbarui')
      }
    } catch (err) {
      console.error('Update product error:', err)
      showError('Gagal memperbarui produk')
    }
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Hapus produk "${productName}" dari sistem?`)) return

    try {
      await apiFetch(`/api/products/${productId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          userId: currentUser.id,
          storeId: currentStore.id
        })
      })

      // Refresh products after delete
      const refreshData = await apiFetch(`/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
      setProducts(refreshData.data?.products || [])
      if (showProductDeleted) {
        showProductDeleted(productName)
      } else {
        showSuccess(`Produk "${productName}" berhasil dihapus`)
      }
    } catch (err) {
      console.error('Delete product error:', err)
      showError('Gagal menghapus produk')
    }
  }

  // Get unique categories
  const categories = [...new Set(products.map(p => p.kategori).filter(Boolean))]

  // Filter and sort
  const filtered = products
    .filter(p => {
      const matchesSearch = p.nama.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || p.kategori === categoryFilter
      let matchesStock = stockFilter === 'all'
      if (stockFilter === 'low') matchesStock = p.stok > 0 && p.stok <= 5
      if (stockFilter === 'out') matchesStock = p.stok === 0
      if (stockFilter === 'available') matchesStock = p.stok > 5
      return matchesSearch && matchesCategory && matchesStock
    })
    .sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      if (sortBy === 'harga' || sortBy === 'stok') {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      } else {
        aVal = String(aVal || '').toLowerCase()
        bVal = String(bVal || '').toLowerCase()
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getStockStatus = (stok) => {
    if (stok === 0) return { color: 'text-red-600 bg-red-100', icon: AlertCircle, label: 'Habis' }
    if (stok <= 5) return { color: 'text-yellow-600 bg-yellow-100', icon: TrendingDown, label: 'Rendah' }
    return { color: 'text-green-600 bg-green-100', icon: TrendingUp, label: 'Tersedia' }
  }

  const openEditModal = (product) => {
    setSelectedProduct({ ...product })
    setShowEditModal(true)
  }

  const handleSelectProduct = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === filtered.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filtered.map(p => p.id))
    }
  }

  // Import/Export CSV functions
  const exportToCSV = () => {
    const headers = ['ID', 'Nama Produk', 'Kategori', 'Stok', 'Harga Jual', 'Harga Modal', 'Satuan', 'Batch Size']
    const csvData = products.map(p => [
      p.id,
      p.nama,
      p.kategori || '',
      p.stok,
      p.harga,
      p.harga_modal,
      p.satuan || '',
      p.batch_size || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `stock_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const importFromCSV = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      
      const importedProducts = []
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        if (values.length >= headers.length) {
          importedProducts.push({
            nama: values[headers.indexOf('Nama Produk')] || values[1],
            kategori: values[headers.indexOf('Kategori')] || values[2] || '',
            stok: Number(values[headers.indexOf('Stok')] || values[3]) || 0,
            harga: Number(values[headers.indexOf('Harga Jual')] || values[4]) || 0,
            harga_modal: Number(values[headers.indexOf('Harga Modal')] || values[5]) || 0,
            satuan: values[headers.indexOf('Satuan')] || values[6] || '',
            batch_size: Number(values[headers.indexOf('Batch Size')] || values[7]) || 1
          })
        }
      }
      
      // Create products in backend
      try {
        await Promise.all(importedProducts.map(product => 
          apiFetch('/api/products', {
            method: 'POST',
            body: JSON.stringify({
              userId: currentUser.id,
              storeId: currentStore.id,
              ...product
            })
          })
        ))
        // Refresh products
        const data = await apiFetch(`/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
        setProducts(data.data?.products || [])
        showSuccess(`${importedProducts.length} produk berhasil diimpor`)
      } catch (err) {
        console.error('Import error:', err)
        showError('Gagal mengimpor produk')
      }
    }
    reader.readAsText(file)
  }

  const handleBulkUpdate = async () => {
    if (!bulkAction || !bulkValue || selectedProducts.length === 0) return
    try {
      await Promise.all(selectedProducts.map(id => {
        const product = products.find(p => p.id === id)
        let newStock = product.stok
        if (bulkAction === 'add') {
          newStock = Number(product.stok) + Number(bulkValue)
        } else if (bulkAction === 'set') {
          newStock = Number(bulkValue)
        }
        return apiFetch(`/api/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            userId: currentUser.id,
            storeId: currentStore.id,
            nama: product.nama,
            harga: product.harga,
            harga_modal: product.harga_modal,
            stok: newStock,
            kategori: product.kategori,
            batch_size: product.batch_size,
            satuan: product.satuan
          })
        })
      }))
      // Refresh
      const data = await apiFetch(`/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
      setProducts(data.data?.products || [])
      setShowBulkModal(false)
      setBulkAction('')
      setBulkValue('')
      setSelectedProducts([])
      showSuccess('Stok berhasil diperbarui')
    } catch (err) {
      console.error('Bulk update error:', err)
      showError('Gagal memperbarui stok')
    }
  }

  // Summary metrics to mirror old Stock page cards
  const totalProducts = products.length
  const outOfStockCount = products.filter(p => Number(p.stok) === 0).length
  const lowStockCount = products.filter(p => Number(p.stok) > 0 && Number(p.stok) <= 5).length
  const totalStock = products.reduce((total, p) => total + (Number(p.stok) || 0), 0)

  return (
    <div className="p-4 md:p-6 max-7xl mx-auto space-y-6">
      <div>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-blue-700 mb-2">Manajemen Stok</h1>
          <p className="text-gray-600">Kelola stok produk Anda</p>
        </div>

        {/* Action buttons under title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-2 mb-4">
          <button
            type="button"
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center sm:justify-start"
          >
            <Package className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Stock Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Total Produk</p>
            <p className="text-lg font-bold text-blue-700">{totalProducts}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-600">Stok Habis</p>
            <p className="text-lg font-bold text-red-600">{outOfStockCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600">Stok Menipis</p>
            <p className="text-lg font-bold text-yellow-600">{lowStockCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Total Stok</p>
            <p className="text-lg font-bold text-green-600">{totalStock}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari produk..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
          >
            <option value="all">Semua Stok</option>
            <option value="available">Tersedia (&gt;5)</option>
            <option value="low">Rendah (1-5)</option>
            <option value="out">Habis (0)</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Urut:</span>
            <button
              onClick={() => handleSort('nama')}
              className={`px-2 py-1 rounded text-sm ${sortBy === 'nama' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Nama
            </button>
            <button
              onClick={() => handleSort('stok')}
              className={`px-2 py-1 rounded text-sm ${sortBy === 'stok' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Stok
            </button>
            <button
              onClick={() => handleSort('harga')}
              className={`px-2 py-1 rounded text-sm ${sortBy === 'harga' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Harga
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between">
            <span className="text-sm text-blue-700">{selectedProducts.length} produk dipilih</span>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Bulk Update Stok
            </button>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">Memuat produk...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                ? 'Tidak ada produk yang sesuai'
                : 'Belum ada produk'}
            </h3>
            <p className="text-gray-400">
              {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                ? 'Coba ubah kata kunci pencarian atau filter'
                : 'Tambahkan produk di halaman Dashboard atau impor dari CSV'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filtered.length && filtered.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Modal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filtered.map(product => {
                    const status = getStockStatus(product.stok)
                    const StatusIcon = status.icon
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{product.nama}</div>
                            <div className="text-sm text-gray-500">{product.satuan}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{product.kategori || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium">{product.stok}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(product.harga)}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(product.harga_modal)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit produk"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.nama)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Hapus produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Update Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBulkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Bulk Update Stok</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Aksi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBulkAction('add')}
                      className={`p-2 rounded-lg border ${
                        bulkAction === 'add' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Tambah Stok
                    </button>
                    <button
                      onClick={() => setBulkAction('set')}
                      className={`p-2 rounded-lg border ${
                        bulkAction === 'set' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Set Stok
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {bulkAction === 'add' ? 'Jumlah Tambah' : 'Jumlah Stok'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Masukkan jumlah"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bulkValue}
                    onChange={e => setBulkValue(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowBulkModal(false)
                      setBulkAction('')
                      setBulkValue('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBulkUpdate}
                    disabled={!bulkAction || !bulkValue}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4">Edit Produk</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Produk</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.nama}
                    onChange={e => setSelectedProduct({ ...selectedProduct, nama: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Stok</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.stok}
                      onChange={e => setSelectedProduct({ ...selectedProduct, stok: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Satuan</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.satuan}
                      onChange={e => setSelectedProduct({ ...selectedProduct, satuan: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Harga Jual</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.harga}
                      onChange={e => setSelectedProduct({ ...selectedProduct, harga: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Harga Modal</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProduct.harga_modal}
                      onChange={e => setSelectedProduct({ ...selectedProduct, harga_modal: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.kategori}
                    onChange={e => setSelectedProduct({ ...selectedProduct, kategori: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Batch Size</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.batch_size}
                    onChange={e => setSelectedProduct({ ...selectedProduct, batch_size: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
