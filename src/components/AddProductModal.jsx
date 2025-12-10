import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package } from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'
import { useStore } from '../contexts/StoreContext'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL } from '../apiClient'

export default function AddProductModal ({ onClose, userId }) {
  const { notifyProductAdded } = useNotification()
  const { currentStore } = useStore()
  const { showWarning, showError, showProductAdded } = useToast()

  const [formData, setFormData] = useState({
    nama: '',
    harga: '',
    harga_modal: '',
    stok: '',
    kategori: '',
    batchSize: '',
    satuan: 'pcs'
  })
  const [loading, setLoading] = useState(false)

  const satuanOptions = [
    'pcs', 'kg', 'gram', 'liter', 'ml', 'pack', 'box', 'karton', 'renteng', 'lusin'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId || !currentStore?.id) {
      showWarning('User atau toko belum siap. Pastikan sudah memilih toko di Account/Settings terlebih dahulu.')
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      showError('Sesi login tidak ditemukan. Silakan login ulang sebelum menambah produk.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        userId,
        storeId: currentStore.id,
        nama: formData.nama,
        harga: Number(formData.harga) || 0,
        harga_modal: formData.harga_modal ? Number(formData.harga_modal) || 0 : 0,
        stok: Number(formData.stok) || 0,
        kategori: formData.kategori || 'Umum',
        batch_size: formData.batchSize ? Number(formData.batchSize) || 1 : 1,
        satuan: formData.satuan || 'pcs'
      }

      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-auth-token': token
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Gagal menambahkan produk')
      }

      // optional: const { data } = await res.json()

      // Tampilkan toast sukses + notification center item seperti di frontend lama
      if (showProductAdded) {
        showProductAdded(formData.nama)
      }

      notifyProductAdded(formData.nama, () => {
        // di masa depan bisa arahkan ke halaman stok
      })

      onClose()
    } catch (error) {
      console.error('Error adding product:', error)
      showError(error.message || 'Gagal menambahkan produk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-10 p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md max-h-[75vh] flex flex-col mb-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Tambah Produk</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form id="add-product-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  name="nama"
                  required
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Indomie Goreng"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Jual *
                  </label>
                  <input
                    type="number"
                    name="harga"
                    required
                    value={formData.harga}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Modal
                  </label>
                  <input
                    type="number"
                    name="harga_modal"
                    value={formData.harga_modal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="4000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Awal *
                  </label>
                  <input
                    type="number"
                    name="stok"
                    required
                    value={formData.stok}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <input
                  type="text"
                  name="kategori"
                  value={formData.kategori}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Makanan, Minuman, dll"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ukuran Batch
                  </label>
                  <input
                    type="number"
                    name="batchSize"
                    value={formData.batchSize}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contoh: 1 renteng = 12 pcs
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satuan
                  </label>
                  <select
                    name="satuan"
                    value={formData.satuan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {satuanOptions.map(satuan => (
                      <option key={satuan} value={satuan}>{satuan}</option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-product-form"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

