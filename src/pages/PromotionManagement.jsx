// In src/pages/PromotionManagement.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Tag, Calendar, DollarSign, Package, X, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { API_BASE_URL } from '../apiClient'

const PromotionManagement = () => {
  const { showError, showSuccess } = useToast()
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_quantity: '',
    start_date: '',
    end_date: '',
    applicable_products: []
  })

  // Fetch data function
  const fetchData = async () => {
    if (!currentUser || !currentStore) return
    try {
      const [promoRes, productRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/promotions?userId=${currentUser.id}&storeId=${currentStore.id}`),
        fetch(`${API_BASE_URL}/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
      ])
      const promoData = await promoRes.json()
      const productData = await productRes.json()
      setPromotions(promoData.data?.promotions || [])
      setProducts(productData.data?.products || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      showError('Gagal mendapatkan data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkApply = async (promotion) => {
    if (!promotion || !products.length) return
    try {
      // Apply to all products (or selected products in the future)
      const updatedProducts = products.map(p => {
        let newPrice = p.harga
        if (promotion.discount_type === 'percentage') {
          newPrice = p.harga * (1 - promotion.discount_value / 100)
        } else if (promotion.discount_type === 'fixed') {
          newPrice = Math.max(0, p.harga - promotion.discount_value)
        }
        return { ...p, harga: Math.round(newPrice) }
      })
      // Update each product via backend
      await Promise.all(updatedProducts.map(p => 
        fetch(`${API_BASE_URL}/api/products/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            storeId: currentStore.id,
            nama: p.nama,
            harga: p.harga,
            harga_modal: p.harga_modal,
            stok: p.stok,
            kategori: p.kategori,
            batch_size: p.batch_size,
            satuan: p.satuan
          })
        })
      ))
      // Refresh products
      const res = await fetch(`${API_BASE_URL}/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
      const data = await res.json()
      setProducts(data.data?.products || [])
      showSuccess('Promosi berhasil diterapkan ke semua produk')
    } catch (err) {
      console.error('Bulk apply error:', err)
      showError('Gagal menerapkan promosi')
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [currentUser, currentStore])

  // Handle submit function
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser || !currentStore) return

    try {
      const payload = {
        userId: currentUser.id,
        storeId: currentStore.id,
        ...formData,
        discount_value: Number(formData.discount_value) || 0,
        min_quantity: Number(formData.min_quantity) || 1,
        applicable_products: selectedProductId ? [selectedProductId] : []
      }

      if (editingPromotion) {
        const res = await fetch(`${API_BASE_URL}/api/promotions/${editingPromotion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Failed to update promotion')
        showSuccess('Promosi berhasil diperbarui')
      } else {
        const res = await fetch(`${API_BASE_URL}/api/promotions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Failed to create promotion')
        showSuccess('Promosi berhasil dibuat')
      }

      // Reset form and refresh data
      setShowForm(false)
      setEditingPromotion(null)
      setSelectedProductId('')
      setFormData({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_quantity: '',
        start_date: '',
        end_date: '',
        applicable_products: []
      })
      await fetchData()
    } catch (error) {
      console.error('Error saving promotion:', error)
      showError('Gagal menyimpan promosi')
    }
  }

  // Handle product selection
  const handleProductSelection = (productId) => {
    setSelectedProductId(productId)
  }

  // Handle form field change
  const handleFieldChange = (e) => {
    const { name, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  // Handle form toggle
  const toggleForm = () => {
    const willShow = !showForm
    setShowForm(willShow)
    if (willShow && !editingPromotion) {
      setSelectedProductId('')
      setFormData({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_quantity: '',
        start_date: '',
        end_date: '',
        applicable_products: []
      })
    }
  }

  // Handle edit promotion
  const handleEditPromotion = (promotion) => {
    setShowForm(true)
    setEditingPromotion(promotion)
    const firstProductId = Array.isArray(promotion.applicable_products) && promotion.applicable_products.length > 0
      ? promotion.applicable_products[0]
      : ''
    setSelectedProductId(firstProductId)
    setFormData({
      name: promotion.name || '',
      description: promotion.description || '',
      discount_type: promotion.discount_type || 'percentage',
      discount_value: promotion.discount_value ?? '',
      min_quantity: promotion.min_quantity ?? '',
      start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
      applicable_products: promotion.applicable_products || []
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus promosi ini?')) return
    try {
      await fetch(`${API_BASE_URL}/api/promotions/${id}`, { method: 'DELETE' })
      setPromotions(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Delete promotion error:', err)
      showError('Gagal menghapus promosi')
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Promosi</h1>
          <p className="text-gray-600 text-sm">Atur diskon dan promosi untuk produk Anda</p>
        </div>
        <button
          onClick={() => {
            setEditingPromotion(null)
            toggleForm()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Tutup Form' : 'Buat Promosi'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Promosi</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFieldChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Diskon</label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleFieldChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Diskon</label>
              <input
                type="number"
                name="discount_value"
                min="0"
                value={formData.discount_value}
                onChange={handleFieldChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Jumlah Item</label>
              <input
                type="number"
                name="min_quantity"
                min="1"
                value={formData.min_quantity}
                onChange={handleFieldChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleFieldChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleFieldChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFieldChange}
              rows={2}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Product selection dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Produk <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductId || ''}
              onChange={(e) => handleProductSelection(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Pilih Produk</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.nama} (Stok: {product.stok}, Batch: {product.batch_size})
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={!selectedProductId}
          >
            {editingPromotion ? 'Update Promosi' : 'Buat Promosi'}
          </button>
        </form>
      )}

      {/* Promotion List */}
      <div className="space-y-4">
        {promotions.map(promo => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{promo.name}</h3>
                {promo.description && <p className="text-sm text-gray-600 mt-1">{promo.description}</p>}
                <div className="mt-2 text-sm">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `Rp ${promo.discount_value}`}
                  </span>
                  {promo.min_quantity > 1 && (
                    <span className="ml-2 text-gray-500">Min. {promo.min_quantity} item</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkApply(promo)}
                  className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  title="Terapkan ke semua produk"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditPromotion(promo)}
                  className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default PromotionManagement


