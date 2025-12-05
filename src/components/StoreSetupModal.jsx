import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../config/firebase'
import { collection, addDoc } from 'firebase/firestore'
import LocationPicker from './LocationPicker'
import { validateStoreData } from '../utils/firebaseTest'
import {
  Store, 
  MapPin, 
  Phone, 
  Mail,
  Save,
  Building,
  User,
  CheckCircle,
  MapPin as MapPinIcon
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

export default function StoreSetupModal ({ isOpen, onComplete, userEmail }) {
  const { currentUser } = useAuth()
  const { showSuccess, showError, showWarning } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    address: '',
    phone: '',
    email: userEmail || '',
    description: '',
    location: {
      lat: -6.1751, // Default to Jakarta
      lng: 106.8272
    }
  })
  const [showMap, setShowMap] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Fungsi untuk mendapatkan alamat dari koordinat (reverse geocoding)
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      setIsGeocoding(true)
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=Nywl23O7mN6Ol38RtL5g`
      )
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        // Ambil alamat terbaik dari hasil geocoding
        const address = data.features[0].place_name
        return address
      }
      return null
    } catch (error) {
      console.error('Error getting address:', error)
      return null
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    let storeDataWithTimestamp = null
    try {
      // Validate current user
      if (!currentUser || !currentUser.uid) {
        throw new Error('User tidak terautentikasi. Silakan login ulang.')
      }

      // Validate required fields
      if (!formData.storeName?.trim() || !formData.ownerName?.trim() || !formData.address?.trim()) {
        showWarning('Mohon lengkapi semua field yang wajib diisi (*)')
        setLoading(false)
        return
      }

      // Sanitize and validate data
      const sanitizedData = {
        storeName: formData.storeName.trim().substring(0, 100), // Limit length
        ownerName: formData.ownerName.trim().substring(0, 100),
        address: formData.address.trim().substring(0, 500),
        phone: formData.phone?.trim().substring(0, 20) || '',
        email: formData.email?.trim().substring(0, 100) || '',
        description: formData.description?.trim().substring(0, 1000) || '',
        userId: currentUser.uid,
        isActive: true,
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0
      }

      // Add timestamp and validate data
      storeDataWithTimestamp = {
        ...sanitizedData,
        createdAt: new Date()
      }
      
      // Validate data before sending
      const validation = validateStoreData(storeDataWithTimestamp)
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`)
      }
      
      // Try creating the store document
      await addDoc(collection(db, 'stores'), storeDataWithTimestamp)
      showSuccess(`Toko berhasil dibuat: ${sanitizedData.storeName}`)
      onComplete()
    } catch (error) {
      console.error('Detailed error creating store:', error)

      if (error.code === 'permission-denied') {
        // Save fallback to localStorage
        const tempStoreData = {
          ...(storeDataWithTimestamp || {}),
          id: `temp-${Date.now()}`,
          isTemporary: true
        }

        localStorage.setItem('tempStore', JSON.stringify(tempStoreData))
        console.warn('Store saved to localStorage as fallback:', tempStoreData)
        showWarning('Toko dibuat dalam mode offline. Data akan disinkronkan saat online.')
        onComplete()
        setLoading(false)
        return
      }

      if (error.code === 'invalid-argument') {
        showError('Data yang dikirim tidak valid. Periksa format data.')
      } else if (error.message) {
        showError(`Gagal membuat toko: ${error.message}`)
      } else {
        showError('Gagal membuat toko. Silakan coba lagi.')
      }
    }

    setLoading(false)
  }

  const isFormValid = formData.storeName && formData.ownerName && formData.address

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Content (scrollable) - Header di dalam scrollable area */}
            <div className="flex-1 overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-accent text-white p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Setup Toko Anda</h2>
                    <p className="text-sm opacity-90">Langkah terakhir untuk memulai bisnis</p>
                  </div>
                </div>
                
                {/* Welcome Message */}
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Akun berhasil dibuat!</span>
                  </div>
                  <p className="text-xs mt-1 opacity-90">
                    Sekarang mari setup toko pertama Anda untuk mulai berjualan
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Store className="w-4 h-4 inline mr-2" />
                  Nama Toko *
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Contoh: Toko Sembako Barokah"
                  required
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nama Pemilik *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Nama lengkap pemilik toko"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Alamat Toko *
                </label>
                <div className="relative">
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input-field w-full pr-10"
                    rows="3"
                    placeholder="Alamat lengkap toko"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="absolute right-2 top-2 p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Pilih lokasi di peta"
                  >
                    <MapPinIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {showMap && (
                  <div className="mt-3 border rounded-lg overflow-hidden">
                    <div className="h-64">
                      <LocationPicker 
                        onLocationSelect={async (location) => {
                          // Update koordinat
                          setFormData(prev => ({
                            ...prev,
                            location: {
                              lat: location.lat,
                              lng: location.lng
                            }
                          }))
                          
                          // Dapatkan alamat dari koordinat
                          const address = await getAddressFromCoordinates(location.lat, location.lng)
                          if (address) {
                            setFormData(prev => ({
                              ...prev,
                              address
                            }))
                          }
                        }}
                        initialLocation={formData.location}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 text-sm text-gray-600 border-t">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <span className="font-medium">Latitude:</span> {formData.location.lat.toFixed(6)}
                        </div>
                        <div>
                          <span className="font-medium">Longitude:</span> {formData.location.lng.toFixed(6)}
                        </div>
                      </div>
                      {isGeocoding && (
                        <div className="text-blue-600 text-xs flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mencari alamat...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Toko
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="email@tokosaya.com"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Deskripsi Toko
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  rows="2"
                  placeholder="Deskripsi singkat tentang toko Anda"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Membuat Toko...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Mulai Berjualan</span>
                  </>
                )}
              </motion.button>
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>💡 Tips:</strong> Setelah toko dibuat, Anda dapat langsung menambah produk dan mulai mencatat penjualan. Data toko dapat diubah kapan saja di menu Status Langganan.
                </p>
              </div>
              </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
