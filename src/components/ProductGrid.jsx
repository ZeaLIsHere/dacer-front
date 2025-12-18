import React from 'react'
import { motion } from 'framer-motion'
import { useCart } from '../contexts/CartContext'
import { Plus, Minus } from 'lucide-react'
import { formatCurrency } from '../utils/currencyFormatter'

export default function ProductGrid ({ products }) {
  const { cart, addItem, updateQuantity } = useCart()

  const getItemQuantity = (productId) => {
    const item = cart.items.find(item => item.id === productId)
    return item ? item.quantity : 0
  }

  const handleAddToCart = (product) => {
    const currentQuantity = getItemQuantity(product.id)
    if (currentQuantity < product.stok) {
      addItem(product)
    }
  }

  const handleUpdateQuantity = (productId, newQuantity) => {
    updateQuantity(productId, newQuantity)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {products.map((product, index) => {
        const quantity = getItemQuantity(product.id)
        const canAddMore = quantity < product.stok

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card flex flex-col h-full"
          >
            {/* Product Info */}
            <div className="mb-3 flex-1">
              <h3 className="font-semibold text-secondary text-sm mb-1 line-clamp-2 break-words">
                {product.nama}
                {product.originalPrice && product.originalPrice > product.harga && ' (Diskon)'}
              </h3>
              <p className="text-primary font-bold">
                {formatCurrency(product.harga)}
              </p>
              <p className="text-xs text-gray-500">
                Stok: {product.stok} {product.satuan}
              </p>
            </div>

            {/* Add to Cart Controls */}
            {quantity === 0 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddToCart(product)}
                className="w-full bg-primary text-white py-2 px-3 rounded-lg font-medium text-sm flex items-center justify-center space-x-2"
              >
                <Plus size={16} />
                <span>Tambah</span>
              </motion.button>
            ) : (
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <Minus size={16} />
                </motion.button>
                
                <span className="font-bold text-secondary px-3">{quantity}</span>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => canAddMore && handleUpdateQuantity(product.id, quantity + 1)}
                  disabled={!canAddMore}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    canAddMore 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={16} />
                </motion.button>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
