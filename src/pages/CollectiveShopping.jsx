import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useToast } from '../contexts/ToastContext'
import { apiFetch } from '../apiClient'
import { formatCurrency } from '../utils/currencyFormatter'

export default function CollectiveShopping () {
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const { showSuccess, showError } = useToast()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentUser || !currentStore) {
        setLoading(false)
        return
      }
      try {
        const { data } = await apiFetch(`/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
        setProducts(data?.products || [])
      } catch (err) {
        console.error('Error fetching products for collective shopping:', err)
        showError('Gagal memuat data produk untuk belanja kolektif')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentUser, currentStore, showError])

  const lowStockProducts = useMemo(
    () => (products || []).filter((p) => (p.stok || 0) <= 5),
    [products]
  )

  const buildOfferFromProduct = (product) => {
    const originalPrice = product.harga || 0
    const discountPercentage = 20
    const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100))
    const batchSize = product.batch_size && product.batch_size > 1 ? product.batch_size : 1
    const quantityToBuy = batchSize * 2
    const savingsPerUnit = originalPrice - discountedPrice
    const totalSavings = savingsPerUnit * quantityToBuy
    const expectedProfit = (originalPrice - discountedPrice) * quantityToBuy

    return {
      productId: product.id,
      productName: product.nama,
      originalPrice,
      discountedPrice,
      discountPercentage,
      minOrder: quantityToBuy,
      quantityToBuy,
      totalSavings,
      expectedProfit,
      currentStock: product.stok || 0,
      category: product.kategori || 'Umum',
      unit: product.satuan || 'unit',
      interestedMerchants: 2
    }
  }

  const handleCollectiveJoin = async (offer) => {
    if (!offer) return
    
    try {
      // Update product stock by adding the purchased quantity
      await apiFetch(`/api/products/${offer.productId}`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: currentUser.id,
          storeId: currentStore.id,
          stok: offer.currentStock + offer.quantityToBuy
        })
      })
      
      // Update local state to reflect the change
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === offer.productId 
            ? { ...product, stok: product.stok + offer.quantityToBuy }
            : product
        )
      )
      
      showSuccess(
        `Belanja kolektif berhasil! ${offer.productName} • Stok bertambah ${offer.quantityToBuy} unit • Hemat ${formatCurrency(offer.totalSavings)}`
      )
    } catch (err) {
      console.error('Error updating product stock:', err)
      showError('Gagal memperbarui stok produk. Silakan coba lagi.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Belanja Kolektif</h1>
        <p className="text-gray-600">Fitur belanja kolektif yang bertujuan untuk mendapat profit maksimal</p>
        <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
          Aktif ketika terdapat stok menipis/kosong
        </div>
      </div>

      {/* My Low Stock Products / Produk Perlu Restok */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-800">Produk Perlu Restok</h3>
              <p className="text-sm text-blue-600">Stok  5 unit - Trigger otomatis untuk penawaran kolektif</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((product) => (
              <span
                key={product.id}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
              >
                {product.nama} ({product.stok} tersisa)
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Collective offers */}
      {lowStockProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lowStockProducts.map((product) => {
            const offer = buildOfferFromProduct(product)

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-3">
                    <h3 className="font-semibold text-blue-700 text-lg truncate">{product.nama}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Stok tersisa: <span className="font-bold">{product.stok}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Harga jual saat ini:{' '}
                      <span className="font-semibold">
                        {formatCurrency(offer.originalPrice)}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Diskon kolektif</p>
                    <p className="text-lg font-bold text-green-600">{offer.discountPercentage}%</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 items-center">
                  <div>
                    <p className="text-xs text-gray-500">Harga grosir / unit</p>
                    <p className="font-semibold">
                      {formatCurrency(offer.discountedPrice)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimal order:{' '}
                      <span className="font-medium">
                        {offer.minOrder} {offer.unit}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Estimasi keuntungan jika ikut</p>
                    <p className="font-semibold text-blue-700">
                      {formatCurrency(offer.expectedProfit)}
                    </p>
                    <p className="text-xs text-gray-400">
                      (Hemat {formatCurrency(offer.totalSavings)} untuk{' '}
                      {offer.quantityToBuy} unit)
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleCollectiveJoin(offer)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all"
                  >
                    Ikut Belanja
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {lowStockProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          Tidak ada produk dengan stok  5. Semua stok dalam kondisi aman.
        </div>
      )}
    </div>
  )
}
