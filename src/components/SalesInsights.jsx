import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Star, Calendar } from 'lucide-react'
import { formatCurrency } from '../utils/currencyFormatter'

export default function SalesInsights ({ sales, products }) {
  const insights = useMemo(() => {
    if (!sales.length) return null

    // Get sales from last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const recentSales = sales.filter(sale => {
      const saleDate = sale.timestamp?.toDate()
      return saleDate && saleDate >= weekAgo
    })

    // Count sales by product
    const productSales = {}
    recentSales.forEach(sale => {
      productSales[sale.productId] = (productSales[sale.productId] || 0) + 1
    })

    // Find best selling product
    const bestSellingProductId = Object.keys(productSales).reduce((a, b) => 
      productSales[a] > productSales[b] ? a : b, Object.keys(productSales)[0]
    )

    const bestSellingProduct = products.find(p => p.id === bestSellingProductId)
    const bestSellingCount = productSales[bestSellingProductId] || 0

    // Calculate daily average
    const dailyAverage = Math.round(recentSales.length / 7)

    return {
      bestSellingProduct,
      bestSellingCount,
      dailyAverage,
      totalWeeklySales: recentSales.length,
      weeklyRevenue: recentSales.reduce((sum, sale) => sum + sale.price, 0)
    }
  }, [sales, products])

  if (!insights || !insights.bestSellingProduct) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary">Wawasan Bisnis</h3>
        </div>
        <p className="text-gray-600">Mulai berjualan untuk melihat analisis bisnis Anda</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-secondary">Wawasan Bisnis</h3>
      </div>

      <div className="space-y-4">
        {/* Best Selling Product */}
        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
          <Star className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm text-gray-600">Produk Terlaris Minggu Ini</p>
            <p className="font-semibold text-secondary">
              {insights.bestSellingProduct.nama} ({insights.bestSellingCount}x terjual)
            </p>
          </div>
        </div>

        {/* Daily Average */}
        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
          <Calendar className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Rata-rata Penjualan Harian</p>
            <p className="font-semibold text-secondary">{insights.dailyAverage} produk/hari</p>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Penjualan Minggu Ini</p>
            <p className="text-lg font-bold text-blue-600">{insights.totalWeeklySales}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Pendapatan Minggu Ini</p>
            <p className="text-lg font-bold text-purple-600">
              {formatCurrency(insights.weeklyRevenue)}
            </p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
          <p className="text-sm font-medium text-primary mb-1">💡 Saran Bisnis</p>
          <p className="text-sm text-gray-700">
            {insights.bestSellingCount > 5 
              ? `Stok ${insights.bestSellingProduct.nama} sering laku! Pertimbangkan untuk menambah stok.`
              : 'Coba promosikan produk yang jarang laku untuk meningkatkan penjualan.'
            }
          </p>
        </div>
      </div>
    </motion.div>
  )
}
