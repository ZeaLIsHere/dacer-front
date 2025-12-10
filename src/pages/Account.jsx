import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Store, Edit2, Save, X, Camera, Lock, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import CreateStoreModal from '../components/CreateStoreModal'

export default function Account () {
  const { currentUser, logout } = useAuth()
  const { currentStore, updateStore } = useStore()
  const { showError } = useToast()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false)
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    ownerName: '',
    address: '',
    phone: '',
    description: ''
  })

  // Load store data into form
  useEffect(() => {
    if (currentStore) {
      setStoreForm({
        storeName: currentStore.store_name || '',
        ownerName: currentStore.owner_name || '',
        address: currentStore.address || '',
        phone: currentStore.phone || '',
        description: currentStore.description || ''
      })
    }
  }, [currentStore])

  const handleSave = async () => {
    if (!currentStore) return
    setSaving(true)
    try {
      await updateStore(currentStore.id, storeForm)
      setEditing(false)
    } catch (err) {
      console.error('Failed to update store:', err)
      showError('Gagal memperbarui toko')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setStoreForm({
      storeName: currentStore?.store_name || '',
      ownerName: currentStore?.owner_name || '',
      address: currentStore?.address || '',
      phone: currentStore?.phone || '',
      description: currentStore?.description || ''
    })
    setEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Akun</h1>
        <p className="text-gray-600">Kelola informasi akun dan toko Anda</p>
      </div>

      {/* User Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Pengguna
          </h2>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{currentUser?.name || currentUser?.email}</p>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{currentUser?.email}</span>
          </div>
        </div>
      </motion.div>

      {/* Store Info */}
      {currentStore ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Store className="w-5 h-5" />
              Informasi Toko
            </h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 hover:bg-green-100 rounded-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="p-2 hover:bg-red-100 rounded-lg disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Toko</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={storeForm.storeName}
                  onChange={e => setStoreForm({ ...storeForm, storeName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Pemilik</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={storeForm.ownerName}
                  onChange={e => setStoreForm({ ...storeForm, ownerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={storeForm.address}
                  onChange={e => setStoreForm({ ...storeForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telepon</label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={storeForm.phone}
                  onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={storeForm.description}
                  onChange={e => setStoreForm({ ...storeForm, description: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{currentStore.store_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span>{currentStore.owner_name}</span>
              </div>
              {currentStore.address && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Alamat:</p>
                  <p>{currentStore.address}</p>
                </div>
              )}
              {currentStore.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{currentStore.phone}</span>
                </div>
              )}
              {currentStore.description && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Deskripsi:</p>
                  <p>{currentStore.description}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
        >
          <Store className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="font-medium text-yellow-800 mb-1">Belum Ada Toko</h3>
          <p className="text-sm text-yellow-700 mb-4">Anda belum membuat toko. Buat toko terlebih dahulu untuk mengakses fitur lengkap.</p>
          <button
            onClick={() => setShowCreateStoreModal(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Buat Toko
          </button>
        </motion.div>
      )}

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </motion.div>

      {/* Create Store Modal (same as Settings) */}
      <CreateStoreModal
        isOpen={showCreateStoreModal}
        onClose={() => setShowCreateStoreModal(false)}
      />
    </div>
  )
}
