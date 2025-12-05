import React from 'react'
import { motion } from 'framer-motion'
import { useCart } from '../contexts/CartContext'
import { X, Plus, Minus, CreditCard, ShoppingCart, Calendar } from 'lucide-react'

export default function CartModal ({ onClose, onCheckout, onDebtCheckout }) {
  const { cart, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCart()

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl w-full max-w-md max-h-[75vh] cart-modal flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-secondary">Keranjang</h2>
              <p className="text-sm text-gray-600">{getTotalItems()} item</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 pb-2">
          {cart.items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-secondary text-sm">{item.nama}</h3>
                    <p className="text-primary font-bold">
                      Rp {item.harga.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Stok tersisa: {item.stok - item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200"
                    >
                      <Minus size={14} />
                    </motion.button>
                    
                    <span className="font-bold text-secondary w-8 text-center">
                      {item.quantity}
                    </span>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stok}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                        item.quantity >= item.stok
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-primary text-white'
                      }`}
                    >
                      <Plus size={14} />
                    </motion.button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-secondary">
                      Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white rounded-b-2xl space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-secondary">Total:</span>
              <span className="text-xl font-bold text-primary">
                Rp {getTotalPrice().toLocaleString('id-ID')}
              </span>
            </div>

            {/* Checkout Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCheckout}
                className="bg-green-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2"
              >
                <CreditCard size={18} />
                <span>Bayar Tunai</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDebtCheckout}
                className="bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2"
              >
                <Calendar size={18} />
                <span>Buat Hutang</span>
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
