import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit3 } from 'lucide-react'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase'

export default function EditProductModal ({ product, onClose }) {
  const [formData, setFormData] = useState({
    nama: product.nama,
    harga: product.harga.toString(),
    harga_modal: product.harga_modal != null ? product.harga_modal.toString() : '',
    kategori: product.kategori || '',
    batchSize: product.batchSize ? product.batchSize.toString() : '',
    satuan: product.satuan || 'pcs'
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
      await updateDoc(doc(db, 'products', product.id), {
        nama: formData.nama,
        harga: parseInt(formData.harga),
        harga_modal: formData.harga_modal ? parseInt(formData.harga_modal) : 0,
        kategori: formData.kategori || 'Umum',
        batchSize: formData.batchSize ? parseInt(formData.batchSize) : 1,
        satuan: formData.satuan
      })

      onClose()
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Gagal memperbarui produk')
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
          className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-secondary">Edit Produk</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3">
            <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Produk *
                </label>
              <input
                type="text"
                name="nama"
                required
                value={formData.nama}
                onChange={handleChange}
                className="input-field"
                placeholder="Nama produk"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Harga Jual *
              </label>
              <input
                type="number"
                name="harga"
                required
                value={formData.harga}
                onChange={handleChange}
                className="input-field"
                placeholder="Harga jual"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Harga Modal
              </label>
              <input
                type="number"
                name="harga_modal"
                value={formData.harga_modal}
                onChange={handleChange}
                className="input-field"
                placeholder="Harga modal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <input
                type="text"
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                className="input-field"
                placeholder="Kategori produk"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ukuran Batch
                </label>
                <input
                  type="number"
                  name="batchSize"
                  value={formData.batchSize}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-xs text-yellow-700">
                  <strong>Catatan:</strong> Stok saat ini ({product.stok} {product.satuan}) tidak akan berubah.
                </p>
              </div>
            </form>
          </div>

          {/* Footer - Fixed Buttons */}
          <div className="border-t border-gray-200 p-3">
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
                form="edit-product-form"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
