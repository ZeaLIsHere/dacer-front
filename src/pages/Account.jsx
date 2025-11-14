import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Save,
  Calendar,
  Shield,
  Check,
  X,
  Store,
  MapPin,
  Phone,
  Building
} from 'lucide-react'

export default function Account () {
  const { currentUser, changePassword } = useAuth()
  const { currentStore, stores, storeStats } = useStore()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter')
      return
    }

    if (!passwordForm.currentPassword) {
      setError('Password saat ini harus diisi')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setMessage('Password berhasil diubah')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Auto clear success message after 5 seconds
      setTimeout(() => {
        setMessage('')
      }, 5000)
    } catch (error) {
      console.error('Password change error:', error)
      
      // Handle specific Firebase errors
      if (error.code === 'auth/wrong-password') {
        setError('Password saat ini salah')
      } else if (error.code === 'auth/weak-password') {
        setError('Password baru terlalu lemah')
      } else if (error.code === 'auth/requires-recent-login') {
        setError('Silakan login ulang untuk mengubah password')
      } else {
        setError(`Gagal mengubah password: ${error.message || 'Terjadi kesalahan'}`)
      }
    }

    setLoading(false)
  }

  const formatDate = (date) => {
    if (!date) return 'Tidak tersedia'
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z\d]/.test(password)) score++
    
    if (score < 2) return { strength: 1, text: 'Lemah', color: 'text-red-600' }
    if (score < 4) return { strength: 2, text: 'Sedang', color: 'text-amber-600' }
    return { strength: 3, text: 'Kuat', color: 'text-blue-600' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-secondary mb-2">Akun Saya</h1>
        <p className="text-gray-600">Kelola informasi akun dan keamanan</p>
      </div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-secondary">Informasi Akun</h2>
            <p className="text-gray-600">Detail akun Anda</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-secondary">{currentUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Bergabung sejak</p>
              <p className="font-medium text-secondary">
                {formatDate(currentUser?.metadata?.creationTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Status Akun</p>
              <p className="font-medium text-success">Aktif & Terverifikasi</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Store Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card"
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-secondary">Informasi Toko</h2>
            <p className="text-gray-600">Detail toko yang sedang aktif</p>
          </div>
        </div>

        {currentStore ? (
          <div className="space-y-4">
            {/* Offline Mode Indicator */}
            {currentStore.isTemporary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-blue-800">Mode Offline</p>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Data toko disimpan secara lokal. Akan disinkronkan ketika Firestore tersedia.
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Store className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Nama Toko</p>
                <p className="font-medium text-secondary">{currentStore.storeName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Nama Pemilik</p>
                <p className="font-medium text-secondary">{currentStore.ownerName}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Alamat Toko</p>
                <p className="font-medium text-secondary">{currentStore.address}</p>
              </div>
            </div>

            {currentStore.phone && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Nomor Telepon</p>
                  <p className="font-medium text-secondary">{currentStore.phone}</p>
                </div>
              </div>
            )}

            {currentStore.email && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email Toko</p>
                  <p className="font-medium text-secondary">{currentStore.email}</p>
                </div>
              </div>
            )}

            {currentStore.description && (
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Deskripsi Toko</p>
                  <p className="font-medium text-secondary">{currentStore.description}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Toko Dibuat</p>
                <p className="font-medium text-secondary">
                  {formatDate(currentStore.createdAt?.toDate?.() || currentStore.createdAt)}
                </p>
              </div>
            </div>

            {/* Store Stats - Real-time data */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{currentStore.totalProducts || 0}</p>
                <p className="text-sm text-blue-700">Produk</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{storeStats.totalSales || 0}</p>
                <p className="text-sm text-blue-700">Penjualan</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  Rp {(storeStats.totalRevenue || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-blue-700">Pendapatan</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">Belum Ada Toko</h3>
            <p className="text-gray-400 mb-4">Anda belum memiliki toko yang terdaftar</p>
            <button className="btn-primary">
              Buat Toko Pertama
            </button>
          </div>
        )}

        {/* Multiple Stores Info */}
        {stores.length > 1 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>💡 Info:</strong> Anda memiliki {stores.length} toko terdaftar. 
              Toko yang sedang aktif: <strong>{currentStore?.storeName}</strong>. 
              Anda dapat beralih toko di menu Status Langganan.
            </p>
          </div>
        )}
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Lock className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-bold text-secondary">Ubah Password</h3>
            <p className="text-sm text-gray-600">Pastikan akun Anda tetap aman</p>
          </div>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-green-700 text-sm flex items-center">
              <Check className="w-4 h-4 mr-2" />
              {message}
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-700 text-sm flex items-center">
              <X className="w-4 h-4 mr-2" />
              {error}
            </p>
          </motion.div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Saat Ini
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="input-field pr-10"
                placeholder="Masukkan password saat ini"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="input-field pr-10"
                placeholder="Masukkan password baru (min. 6 karakter)"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {passwordForm.newPassword && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getPasswordStrength(passwordForm.newPassword).strength === 1 ? 'bg-red-500 w-1/3' :
                        getPasswordStrength(passwordForm.newPassword).strength === 2 ? 'bg-blue-500 w-2/3' :
                        'bg-blue-600 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${getPasswordStrength(passwordForm.newPassword).color}`}>
                    {getPasswordStrength(passwordForm.newPassword).text}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="input-field pr-10"
                placeholder="Ulangi password baru"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save size={20} />
                <span>Simpan Password Baru</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Security Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card bg-blue-50 border-blue-200"
      >
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Tips Keamanan</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Gunakan password yang kuat dengan kombinasi huruf, angka, dan simbol</li>
              <li>• Jangan gunakan password yang sama dengan akun lain</li>
              <li>• Ubah password secara berkala untuk menjaga keamanan</li>
              <li>• Jangan bagikan password Anda kepada siapa pun</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
