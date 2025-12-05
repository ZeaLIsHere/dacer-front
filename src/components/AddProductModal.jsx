import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package } from 'lucide-react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useNotification } from '../contexts/NotificationContext'

export default function AddProductModal ({ onClose, userId }) {
  const { notifyProductAdded } = useNotification()
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
    setLoading(true)

    try {
      await addDoc(collection(db, 'products'), {
        nama: formData.nama,
        harga: parseInt(formData.harga),
        harga_modal: formData.harga_modal ? parseInt(formData.harga_modal) : 0,
        stok: parseInt(formData.stok),
        kategori: formData.kategori || 'Umum',
        batchSize: formData.batchSize ? parseInt(formData.batchSize) : 1,
        satuan: formData.satuan,
        userId,
        createdAt: new Date()
      })

      // Send product added notification
      notifyProductAdded(formData.nama, () => {
        // Navigate to stock page to view the new product
        console.log('View new product')
      })

      onClose()
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Gagal menambahkan produk')
    }

    setLoading(false)
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
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-secondary">Tambah Produk</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
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
                className="input-field"
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
                  className="input-field"
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
                  className="input-field"
                  placeholder="4000"
                />
              </div>
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
                  className="input-field"
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
                className="input-field"
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
                  className="input-field"
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
                  className="input-field"
                >
                  {satuanOptions.map(satuan => (
                    <option key={satuan} value={satuan}>{satuan}</option>
                  ))}
                </select>
              </div>
            </div>

            </form>
          </div>

          {/* Fixed Footer with Buttons */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-product-form"
                disabled={loading}
                className="flex-1 btn-primary"
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
