import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../config/firebase'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs } from 'firebase/firestore'
import { AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

export default function CollectiveShopping () {
  const { currentUser } = useAuth()
  const [myProducts, setMyProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    // Get user's products to find low stock items
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
        
        // Filter low stock products (stok <= 5)
        const lowStockProducts = productsData.filter(product => (product.stok || 0) <= 5)
        setMyProducts(lowStockProducts)
        setLoading(false)
      } catch (error) {
        console.error('Error processing products data:', error)
        setMyProducts([])
        setLoading(false)
      }
    }, (error) => {
      console.error('Error fetching products for collective shopping:', error)
      setMyProducts([])
      setLoading(false)
      
      if (error.code === 'permission-denied') {
        console.log('Permission denied for products collection in collective shopping')
      }
    })

    return unsubscribe
  }, [currentUser])
  const { showSuccess, showError } = useToast()

  // Integrated collective shopping function
  const _handleCollectiveShoppingJoin = async (offer) => {
    try {
      const savings = offer.originalPrice - offer.discountedPrice
      const orderQuantity = Math.max(offer.minOrder, Math.ceil(offer.currentStock / 2)) 
      
      const orderData = {
        productId: offer.productId,
        productName: offer.productName,
        quantity: orderQuantity,
        unitPrice: offer.discountedPrice,
        totalPrice: offer.discountedPrice * orderQuantity,
        savings: savings * orderQuantity,
        category: offer.category,
        unit: offer.unit,
        merchantsJoined: offer.interestedMerchants + 1,
        orderType: 'collective_purchase'
      }

      await processInventoryRestock({
        productName: offer.productName,
        quantity: orderQuantity,
        bulkPrice: offer.discountedPrice,
        category: offer.category
      })

      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'collective_purchase',
        items: [{
          nama: offer.productName,
          quantity: orderQuantity,
          harga: offer.discountedPrice,
          totalPrice: orderData.totalPrice
        }],
        totalAmount: orderData.totalPrice,
        paymentMethod: 'collective',
        supplier: 'Collective Shopping Network',
        timestamp: serverTimestamp(),
        collectiveData: {
          merchantsJoined: orderData.merchantsJoined,
          originalPrice: offer.originalPrice,
          discountPercentage: offer.discountPercentage,
          totalSavings: orderData.savings
        }
      })

      showSuccess(`Belanja Kolektif Berhasil! ${offer.productName} • Qty ${orderQuantity} • Hemat Rp ${orderData.savings.toLocaleString('id-ID')}`)
    } catch (error) {
      console.error('Error processing collective shopping:', error)
      showError('Gagal memproses belanja kolektif. Silakan coba lagi.')
    }
  }

  const processInventoryRestock = async (item) => {
    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', currentUser.uid),
        where('nama', '==', item.productName)
      )

      const existingProducts = await getDocs(productsQuery)

      if (!existingProducts.empty) {
        const existingProduct = existingProducts.docs[0]
        const currentStock = existingProduct.data().stok || 0
        const newStock = currentStock + item.quantity

        await updateDoc(doc(db, 'products', existingProduct.id), {
          stok: newStock,
          lastRestocked: serverTimestamp(),
          lastRestockQuantity: item.quantity,
          lastRestockPrice: item.bulkPrice,
          lastRestockSource: 'collective_purchase'
        })
      } else {
        const newProductData = {
          userId: currentUser.uid,
          nama: item.productName,
          kategori: item.category || 'Lainnya',
          harga: Math.round(item.bulkPrice * 1.3),
          stok: item.quantity,
          createdAt: serverTimestamp(),
          lastRestocked: serverTimestamp(),
          lastRestockQuantity: item.quantity,
          lastRestockPrice: item.bulkPrice,
          lastRestockSource: 'collective_purchase',
          addedViaCollective: true
        }

        await addDoc(collection(db, 'products'), newProductData)
      }
    } catch (error) {
      console.error(`Error processing restock for ${item.productName}:`, error)
      throw error
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

      {/* My Low Stock Products */}
      {myProducts.length > 0 && (
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
              <p className="text-sm text-blue-600">Stok ≤ 5 unit - Trigger otomatis untuk penawaran kolektif</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {myProducts.map((product, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {product.nama} ({product.stok} tersisa)
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Collective offers */}
      {myProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myProducts.map((product) => {
            const originalPrice = product.harga || 0
            const discountPercentage = 20
            const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100))
            const minOrder = product.batchSize && product.batchSize > 1 ? product.batchSize * 5 : 10
            const quantityToBuy = minOrder
            const savingsPerUnit = originalPrice - discountedPrice
            const totalSavings = savingsPerUnit * quantityToBuy
            const expectedProfit = (product.harga - discountedPrice) * quantityToBuy

            const offer = {
              productId: product.id,
              productName: product.nama,
              originalPrice,
              discountedPrice,
              discountPercentage,
              minOrder,
              currentStock: product.stok || 0,
              category: product.kategori || 'Umum',
              unit: product.satuan || 'unit',
              interestedMerchants: 2
            }

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
                      Harga jual saat ini: <span className="font-semibold">Rp {originalPrice.toLocaleString('id-ID')}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Diskon kolektif</p>
                    <p className="text-lg font-bold text-green-600">{discountPercentage}%</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 items-center">
                  <div>
                    <p className="text-xs text-gray-500">Harga grosir / unit</p>
                    <p className="font-semibold">Rp {discountedPrice.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimal order: <span className="font-medium">{minOrder} {offer.unit}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Estimasi keuntungan jika ikut</p>
                    <p className="font-semibold text-blue-700">
                      Rp {expectedProfit.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-400">
                      (Hemat Rp {totalSavings.toLocaleString('id-ID')} untuk {quantityToBuy} unit)
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => _handleCollectiveShoppingJoin(offer)}
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
    </div>
  )
}
