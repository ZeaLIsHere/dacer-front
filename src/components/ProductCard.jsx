import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Package, TrendingUp, Star } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatCurrency } from '../utils/currencyFormatter'

export default function ProductCard ({ product, onSell }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const isLowStock = product.stok <= 5
  const isOutOfStock = product.stok <= 0
  const isGoodStock = product.stok > 10

  const getStockStatus = () => {
    if (isOutOfStock) return 'out_of_stock'
    if (isLowStock) return 'low_stock'
    return 'success'
  }

  const getStockMessage = () => {
    if (isOutOfStock) return 'Stok Habis'
    if (isLowStock) return 'Stok Rendah'
    return 'Stok Tersedia'
  }

  const getStockColor = () => {
    if (isOutOfStock) return 'var(--color-error)'
    if (isLowStock) return 'var(--color-warning)'
    return 'var(--color-secondary)'
  }

  const handleSellClick = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    if (isProcessing || isOutOfStock) {
      console.log('Button click ignored - processing or out of stock')
      return
    }
    
    console.log('ProductCard button clicked for product:', product)
    console.log('Button disabled state:', isOutOfStock)
    console.log('onSell function available:', !!onSell)
    console.log('Event target:', e.target)
    console.log('Event currentTarget:', e.currentTarget)
    
    setIsProcessing(true)
    
    try {
      if (onSell && typeof onSell === 'function') {
        console.log('Calling onSell function...')
        await onSell(product)
      } else {
        console.error('onSell function not provided or not a function')
      }
    } catch (error) {
      console.error('Error in handleSellClick:', error)
    } finally {
      // Reset processing state after a short delay
      setTimeout(() => {
        setIsProcessing(false)
      }, 1000)
    }
  }, [product, onSell, isProcessing, isOutOfStock])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card group relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, var(--color-primary) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, var(--color-accent) 0%, transparent 50%)`
        }}
      />
      
      {/* Header with Product Info */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="w-4 h-4" style={{ color: 'var(--color-text-accent)' }} />
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors" style={{ color: 'var(--color-text-primary)' }}>
              {product.nama}
              {product.originalPrice && product.originalPrice > product.harga && ' (Diskon)'}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(product.harga)}
            </p>
          </div>
          
          {/* Category Badge */}
          {product.kategori && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}>
              {product.kategori}
            </div>
          )}
        </div>
        
        {/* Stock Status Badge */}
        <StatusBadge 
          status={getStockStatus()} 
          size="small"
          customLabel={getStockMessage()}
        />
      </div>

      {/* Stock Information */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Stok Tersedia</span>
          <span 
            className="text-lg font-bold"
            style={{ color: getStockColor() }}
          >
            {product.stok} unit
          </span>
        </div>
        
        {/* Visual Stock Indicator */}
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isOutOfStock 
                ? 'linear-gradient(90deg, var(--color-error), #FF6B6B)'
                : isLowStock 
                ? 'linear-gradient(90deg, var(--color-warning), var(--color-accent-light))'
                : 'linear-gradient(90deg, var(--color-secondary), var(--color-secondary-light))',
              width: `${Math.min(100, (product.stok / 20) * 100)}%`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (product.stok / 20) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="relative">
        <motion.button
          whileHover={!isOutOfStock && !isProcessing ? { scale: 1.02 } : {}}
          whileTap={!isOutOfStock && !isProcessing ? { scale: 0.98 } : {}}
          onClick={handleSellClick}
          disabled={isOutOfStock || isProcessing}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl font-semibold transition-all duration-300 select-none relative z-10 ${
            isOutOfStock || isProcessing
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer text-white shadow-lg hover:shadow-xl active:scale-95'
          }`}
          style={{
            background: isOutOfStock || isProcessing
              ? 'var(--color-border)' 
              : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
            color: isOutOfStock || isProcessing ? 'var(--color-text-muted)' : 'white',
            boxShadow: isOutOfStock || isProcessing
              ? 'none' 
              : '0 4px 15px var(--color-shadow)',
            pointerEvents: isOutOfStock || isProcessing ? 'none' : 'auto',
            userSelect: 'none',
            position: 'relative',
            zIndex: 10
          }}
        >
        <ShoppingCart size={18} />
        <span>
          {isOutOfStock ? 'Stok Habis' : isProcessing ? 'Memproses...' : 'Jual Sekarang'}
        </span>
        {!isOutOfStock && (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Star className="w-4 h-4" />
          </motion.div>
        )}
        </motion.button>
      </div>

      {/* Success Indicator */}
      {isGoodStock && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-3 right-3"
        >
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-secondary)' }} />
        </motion.div>
      )}
    </motion.div>
  )
}
