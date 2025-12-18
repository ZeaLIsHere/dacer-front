import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStockMonitor } from '../hooks/useStockMonitor'
import { AlertTriangle, Eye, EyeOff, ChevronUp, ChevronDown, Package } from 'lucide-react'
import { formatCurrency } from '../utils/currencyFormatter'

export default function StockMonitorSystem () {
  const { 
    lowStockProducts, 
    monitoringEnabled, 
    toggleMonitoring,
    stats
  } = useStockMonitor(5) // Monitor products with stock <= 5

  const [isExpanded, setIsExpanded] = useState(false)

  if (!monitoringEnabled) return null

  return (
    <>
      {/* Monitoring Status Indicator */}
      {lowStockProducts.length > 0 && (
        <div className="fixed bottom-4 left-4 z-30">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-orange-300 rounded-lg shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div 
              className="bg-orange-100 p-3 cursor-pointer hover:bg-orange-150 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-semibold text-orange-800">
                      {lowStockProducts.length} produk stok rendah
                    </p>
                    <p className="text-xs text-orange-600">
                      Klik untuk detail
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMonitoring()
                    }}
                    className="p-1 text-orange-600 hover:text-orange-800 transition-colors"
                    title={monitoringEnabled ? 'Nonaktifkan monitoring' : 'Aktifkan monitoring'}
                  >
                    {monitoringEnabled ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-orange-600" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-orange-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white"
                >
                  <div className="p-3 max-h-64 overflow-y-auto">
                    {/* Statistics Summary */}
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <p className="font-bold text-red-600">{stats.outOfStock}</p>
                          <p className="text-gray-600">Habis</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-orange-600">{stats.criticalStock}</p>
                          <p className="text-gray-600">Kritis</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-xs text-gray-600 text-center">
                          Total Nilai: <span className="font-bold text-blue-600">
                            {formatCurrency(stats.totalValue)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {lowStockProducts.map((product) => (
                        <div 
                          key={product.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-800 truncate max-w-32">
                                {product.nama}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(product.harga)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              product.stok === 0 ? 'text-red-600' : 
                              product.stok <= 2 ? 'text-orange-600' : 'text-yellow-600'
                            }`}>
                              {product.stok} {product.satuan}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.stok === 0 ? 'Habis' : 
                               product.stok <= 2 ? 'Kritis' : 'Rendah'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </>
  )
}
