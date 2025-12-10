import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Minus, Trash2, CreditCard, DollarSign, User, Package, ShoppingCart, X, Percent, Calculator, Check, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { useToast } from '../contexts/ToastContext'
import { useNotification } from '../contexts/NotificationContext'
import { API_BASE_URL } from '../apiClient'

export default function Cashier () {
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const navigate = useNavigate()
  const { showPaymentSuccess, showPaymentFailed, showSaleRecorded, showError } = useToast()
  const { notifyTransactionSuccess } = useNotification()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [promotions, setPromotions] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('tunai')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [discountType, setDiscountType] = useState('none') // none, percentage, fixed
  const [discountValue, setDiscountValue] = useState(0)
  const [cashReceived, setCashReceived] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastTransactionData, setLastTransactionData] = useState(null) // simpan data transaksi untuk struk
  const [appliedPromotion, setAppliedPromotion] = useState(null)
  const [categories, setCategories] = useState(['Semua'])
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [showCartPanel, setShowCartPanel] = useState(false) // untuk mobile: tampilkan panel keranjang saat ditekan

  // Load products and customers
  useEffect(() => {
    if (!currentUser || !currentStore) return
    async function fetchData () {
      setIsLoading(true)
      try {
        const [productRes, customerRes, promoRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`),
          fetch(`${API_BASE_URL}/api/customers?userId=${currentUser.id}&storeId=${currentStore.id}`),
          fetch(`${API_BASE_URL}/api/promotions?userId=${currentUser.id}&storeId=${currentStore.id}`)
        ])
        const productData = await productRes.json()
        const customerData = await customerRes.json()
        const promoData = await promoRes.json()
        const loadedProducts = productData.data?.products || []
        setProducts(loadedProducts)
        // derive categories similar to old repo
        const uniqueCategories = ['Semua', ...new Set(loadedProducts.map(p => p.kategori || 'Umum'))]
        setCategories(uniqueCategories)
        setCustomers(customerData.data?.customers || [])
        setPromotions(promoData.data?.promotions || [])
      } catch (err) {
        console.error('Failed to load data:', err)
        setProducts([])
        setCustomers([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [currentUser, currentStore])

  // Check and apply promotions
  const checkAndApplyPromotion = useCallback(() => {
    if (!promotions.length || cart.length === 0) return

    // Find applicable promotion (simple logic: first matching promotion)
    const applicablePromo = promotions.find(promo => {
      const totalQty = cart.reduce((sum, item) => sum + item.qty, 0)
      return totalQty >= promo.min_quantity
    })

    if (applicablePromo) {
      setAppliedPromotion(applicablePromo)
      if (applicablePromo.discount_type === 'percentage') {
        setDiscountType('percentage')
        setDiscountValue(applicablePromo.discount_value)
      } else {
        setDiscountType('fixed')
        setDiscountValue(applicablePromo.discount_value)
      }
    }
  }, [promotions, cart])

  // Apply promotion when cart changes
  useEffect(() => {
    checkAndApplyPromotion()
  }, [cart, checkAndApplyPromotion])

  // Filter products by search, category, and stock > 0 (similar to old cashier)
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nama.toLowerCase().includes(searchTerm.toLowerCase())
    const categoryLabel = product.kategori || 'Umum'
    const matchesCategory = selectedCategory === 'Semua' || categoryLabel === selectedCategory
    const hasStock = Number(product.stok) > 0
    return matchesSearch && matchesCategory && hasStock
  })

  // Add to cart
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.harga }
            : item
        )
      } else {
        return [...prev, {
          id: product.id,
          nama: product.nama,
          harga: product.harga,
          qty: 1,
          subtotal: product.harga
        }]
      }
    })
  }

  // Update quantity
  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta
        if (newQty <= 0) return null
        return { ...item, qty: newQty, subtotal: newQty * item.harga }
      }
      return item
    }).filter(Boolean))
  }

  // Remove from cart
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  // Totals
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountType === 'fixed' ? discountValue : 0
  const totalAfterDiscount = subtotal - discountAmount
  const totalAmount = totalAfterDiscount

  // Change calculation
  const change = paymentMethod === 'tunai' ? cashReceived - totalAmount : 0

  // Print receipt function
  const printReceipt = (saleData) => {
    const receiptContent = `
      <html>
        <head>
          <title>Struk Pembayaran - ${currentStore?.nama || 'Kasir'}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
            .footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 20px; text-align: center; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${currentStore?.nama || 'Kasir'}</h2>
            <p>${currentStore?.alamat || ''}</p>
            <p>Telp: ${currentStore?.telepon || ''}</p>
            <p>=====================</p>
          </div>
          
          <div>
            <p>No: ${saleData.order_id || 'N/A'}</p>
            <p>Tanggal: ${new Date(saleData.timestamp).toLocaleString('id-ID')}</p>
            <p>Kasir: ${currentUser?.nama || 'Admin'}</p>
            ${selectedCustomer ? `<p>Pelanggan: ${selectedCustomer.nama || selectedCustomer.name}</p>` : ''}
            <p>Metode: ${saleData.payment_method}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Detail Pembelian:</h3>
            ${(Array.isArray(saleData.items) ? saleData.items : []).map(item => `
              <div class="item">
                <span>${item.nama} x${item.qty}</span>
                <span>Rp ${Number(item.subtotal).toLocaleString('id-ID')}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            <div class="item">
              <span>Subtotal:</span>
              <span>Rp ${Number(saleData.subtotal).toLocaleString('id-ID')}</span>
            </div>
            ${Number(saleData.discount_amount) > 0 ? `
              <div class="item">
                <span>Diskon:</span>
                <span> -Rp ${Number(saleData.discount_amount).toLocaleString('id-ID')}</span>
              </div>
            ` : ''}
            <div class="item">
              <span><strong>Total:</strong></span>
              <span><strong>Rp ${Number(saleData.total_amount).toLocaleString('id-ID')}</strong></span>
            </div>
            ${saleData.cash_received ? `
              <div class="item">
                <span>Tunai:</span>
                <span>Rp ${Number(saleData.cash_received).toLocaleString('id-ID')}</span>
              </div>
              <div class="item">
                <span>Kembalian:</span>
                <span>Rp ${Number(saleData.change).toLocaleString('id-ID')}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>=====================</p>
            <p>Terima kasih atas kunjungan Anda</p>
            <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(receiptContent)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
  }

  // Navigate to Debts page with cart data (debt checkout, mirroring old cashier flow)
  const handleDebtCheckout = () => {
    if (cart.length === 0) return

    navigate('/debts', {
      state: {
        fromCashier: true,
        cartData: {
          items: cart,
          totalAmount,
          totalItems
        }
      }
    })

    // Reset local cart state after navigation
    setCart([])
    setSelectedCustomer(null)
    setDiscountType('none')
    setDiscountValue(0)
    setCashReceived(0)
  }
  const handlePayment = async () => {
    if (cart.length === 0) return
    setIsProcessing(true)
    try {
      // Jika pembayaran QRIS (Midtrans), jalankan flow Midtrans terlebih dahulu
      if (paymentMethod === 'qris') {
        if (!window.snap) {
          throw new Error('Layanan pembayaran QRIS tidak tersedia')
        }

        const checkoutRes = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            storeId: currentStore.id,
            amount: totalAmount,
            customer: {
              firstName: currentStore?.nama || 'Customer',
              email: currentStore?.email || 'customer@example.com',
              phone: currentStore?.telepon || '08123456789'
            }
          })
        })

        if (!checkoutRes.ok) {
          throw new Error('Gagal memulai pembayaran QRIS')
        }

        const checkoutData = await checkoutRes.json()
        const snapToken = checkoutData?.data?.snapToken
        if (!snapToken) {
          throw new Error('Token pembayaran QRIS tidak tersedia')
        }

        await new Promise((resolve, reject) => {
          window.snap.pay(snapToken, {
            onSuccess: () => resolve(),
            onPending: () => resolve(),
            onError: (err) => reject(err),
            onClose: () => resolve()
          })
        })
      }

      const payload = {
        userId: currentUser.id,
        storeId: currentStore.id,
        items: cart.map(item => ({
          id: item.id,
          nama: item.nama,
          qty: item.qty,
          harga: item.harga,
          subtotal: item.subtotal
        })),
        subtotal,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        total_items: totalItems,
        payment_method: paymentMethod,
        payment_status: 'completed',
        cash_received: paymentMethod === 'tunai' ? cashReceived : null,
        change: paymentMethod === 'tunai' ? change : null,
        customer_info: selectedCustomer ? {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          email: selectedCustomer.email,
          address: selectedCustomer.address
        } : null
      }

      const res = await fetch(`${API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to create sale')
      const { data } = await res.json()
      if (showPaymentSuccess) {
        showPaymentSuccess(totalAmount)
      }

      if (showSaleRecorded && cart.length > 0) {
        showSaleRecorded(totalAmount, cart[0].nama)
      }

      if (notifyTransactionSuccess) {
        notifyTransactionSuccess(totalAmount, paymentMethod, () => {
          setShowSuccessModal(true)
        })
      }

      // Simpan data transaksi untuk struk SEBELUM cart direset
      const transactionData = {
        order_id: data.sale.order_id,
        timestamp: new Date(),
        items: cart,
        subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        cash_received: cashReceived,
        change
      }
      setLastTransactionData(transactionData)

      // Reset
      setCart([])
      setSelectedCustomer(null)
      setDiscountType('none')
      setDiscountValue(0)
      setCashReceived(0)
      setShowPaymentModal(false)
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Payment error:', err)
      if (showPaymentFailed) {
        showPaymentFailed('Gagal menyimpan transaksi. Silakan coba lagi.')
      } else {
        showError('Gagal menyimpan transaksi. Silakan coba lagi.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Kasir</h1>
        <p className="text-gray-600">Pilih produk untuk dijual</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent"
                style={{
                  borderColor: '#D1D5DB',
                  backgroundColor: '#F9FAFB',
                  color: '#1F2937'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B72FF'
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 114, 255, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <Package className="flex-shrink-0 text-[#6B7280]" size={20} />
              {categories.map(category => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'text-white'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category ? '#3B72FF' : '#E5E7EB',
                    color: selectedCategory === category ? 'white' : '#1F2937'
                  }}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            {isLoading ? (
              <div className="text-center py-8">Memuat produk...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" />
                <h3 className="text-lg font-medium mb-2 text-[#6B7280]">
                  {searchTerm || selectedCategory !== 'Semua'
                    ? 'Tidak ada produk yang sesuai'
                    : 'Tidak ada produk tersedia'}
                </h3>
                <p className="text-[#9CA3AF] opacity-70">
                  {searchTerm || selectedCategory !== 'Semua'
                    ? 'Coba ubah pencarian atau filter'
                    : 'Tambahkan produk di halaman Stok/Dashboard'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map(product => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{product.nama}</h3>
                        <p className="text-xs text-gray-500">Stok: {product.stok}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">Rp {product.harga.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className={`lg:col-span-1 ${showCartPanel ? '' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Keranjang
              </h2>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {totalItems} item
                </span>
                {/* Tombol tutup untuk mobile */}
                <button
                  type="button"
                  className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowCartPanel(false)}
                  aria-label="Tutup keranjang"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Pelanggan</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCustomer?.id || ''}
                  onChange={e => {
                    const cust = customers.find(c => c.id === e.target.value)
                    setSelectedCustomer(cust || null)
                  }}
                >
                  <option value="">Pelanggan Umum</option>
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>{cust.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="p-2 border rounded-lg hover:bg-gray-100"
                  title="Tambah Pelanggan"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Discount */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Diskon</label>
              {appliedPromotion ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">{appliedPromotion.name}</span>
                    <button
                      onClick={() => {
                        setAppliedPromotion(null)
                        setDiscountType('none')
                        setDiscountValue(0)
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {appliedPromotion.discount_type === 'percentage' 
                      ? `${appliedPromotion.discount_value}%` 
                      : `Rp ${appliedPromotion.discount_value}`}
                    {appliedPromotion.min_quantity > 1 && ` (Min. ${appliedPromotion.min_quantity} item)`}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value)}
                  >
                    <option value="none">Tidak Ada</option>
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                  {discountType !== 'none' && (
                    <input
                      type="number"
                      min="0"
                      placeholder={discountType === 'percentage' ? '%' : 'Rp'}
                      className="w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={discountValue || ''}
                      onChange={e => setDiscountValue(Number(e.target.value))}
                    />
                  )}
                </div>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Keranjang kosong</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  <AnimatePresence>
                    {cart.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{item.nama}</h4>
                          <p className="text-xs text-gray-500">Rp {item.harga.toLocaleString('id-ID')} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Diskon:</span>
                      <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors mb-2"
                >
                  Bayar
                </button>
                <button
                  onClick={handleDebtCheckout}
                  className="w-full bg-white text-blue-600 border border-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  Bayar Nanti (Catat Hutang)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button (mirip versi Firebase lama) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowCartPanel(true)}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg z-40 flex items-center justify-center lg:hidden"
      >
        <ShoppingCart size={22} />
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-blue-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
          >
            {totalItems}
          </motion.span>
        )}
      </motion.button>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCustomerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Tambah Pelanggan</h2>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                const payload = {
                  userId: currentUser.id,
                  storeId: currentStore.id,
                  name: formData.get('name'),
                  phone: formData.get('phone'),
                  email: formData.get('email'),
                  address: formData.get('address')
                }
                try {
                  const res = await fetch(`${API_BASE_URL}/api/customers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  })
                  if (!res.ok) throw new Error('Failed to create customer')
                  const { data } = await res.json()
                  setCustomers(prev => [...prev, data.customer])
                  setSelectedCustomer(data.customer)
                  setShowCustomerModal(false)
                  e.target.reset()
                } catch (err) {
                  console.error('Create customer error:', err)
                  showError('Gagal menambah pelanggan')
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telepon</label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Alamat</label>
                    <textarea
                      name="address"
                      rows={2}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !isProcessing && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Pembayaran</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                  <div className="space-y-3">
                    {/* Tunai */}
                    <div
                      onClick={() => setPaymentMethod('tunai')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'tunai'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <DollarSign className={`w-5 h-5 ${paymentMethod === 'tunai' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">Tunai</p>
                          <p className="text-sm text-gray-600">Pembayaran langsung</p>
                        </div>
                      </div>
                    </div>

                    {/* QRIS */}
                    <div
                      onClick={() => setPaymentMethod('qris')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'qris'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className={`w-5 h-5 ${paymentMethod === 'qris' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">QRIS</p>
                          <p className="text-sm text-gray-600">Scan QR Code untuk bayar</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'tunai' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Uang Diterima</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Masukkan jumlah uang"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={cashReceived || ''}
                      onChange={e => setCashReceived(Number(e.target.value))}
                    />
                    {cashReceived > 0 && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        <span className="font-medium">Kembalian: </span>
                        <span className="text-green-700 font-bold">Rp {change.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg mb-4">
                    <span>Total:</span>
                    <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing || (paymentMethod === 'tunai' && cashReceived < totalAmount)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Memproses...' : 'Bayar'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Pembayaran Berhasil!</h2>
                <p className="text-gray-600 mb-1">Transaksi #{lastTransactionData?.order_id || 'N/A'}</p>
                <p className="text-sm text-gray-500 mb-6">Total: Rp {Number(lastTransactionData?.total_amount || 0).toLocaleString('id-ID')}</p>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Selesai
                  </button>
                  <button
                    onClick={() => printReceipt(lastTransactionData)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Printer className="w-4 h-4 inline mr-2" />
                    Print Struk
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
