import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'

// Get today's sales data
export const getTodaySales = async (userId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    const salesQuery = query(
      collection(db, 'sales'),
      where('userId', '==', userId),
      where('timestamp', '>=', today),
      where('timestamp', '<', tomorrow),
      orderBy('timestamp', 'desc')
    )

    const salesSnapshot = await getDocs(salesQuery)
    const salesData = []

    salesSnapshot.forEach(doc => {
      const data = doc.data()
      salesData.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate()
      })
    })

    return salesData
  } catch (error) {
    console.error('Error fetching today sales:', error)
    return []
  }
}

// Get today's revenue
export const getTodayRevenue = async (userId) => {
  const salesData = await getTodaySales(userId)
  const totalRevenue = salesData.reduce((total, sale) => {
    return total + (sale.totalPrice || 0)
  }, 0)
  return totalRevenue
}

// Get products sold today
export const getProductsSoldToday = async (userId) => {
  const salesData = await getTodaySales(userId)
  const productsSold = {}

  salesData.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const productName = item.name || item.nama || 'Unknown'
        if (!productsSold[productName]) {
          productsSold[productName] = {
            name: productName,
            quantity: 0,
            totalRevenue: 0
          }
        }
        productsSold[productName].quantity += item.quantity || 1
        productsSold[productName].totalRevenue += (item.price || item.harga || 0) * (item.quantity || 1)
      })
    }
  })

  return Object.values(productsSold)
}

// Get total products sold count today
export const getTotalProductsSoldToday = async (userId) => {
  const productsSold = await getProductsSoldToday(userId)
  return productsSold.reduce((total, product) => total + product.quantity, 0)
}

// Get stock status
export const getStockStatus = async (userId) => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', userId)
    )

    const productsSnapshot = await getDocs(productsQuery)
    const products = []

    productsSnapshot.forEach(doc => {
      const data = doc.data()
      products.push({
        id: doc.id,
        name: data.name || data.nama || 'Unknown Product', // Handle both name and nama fields
        stok: data.stok || data.stock || 0, // Handle both stok and stock fields
        ...data
      })
    })

    const lowStock = products.filter(product => (product.stok || 0) <= 5 && (product.stok || 0) > 0)
    const outOfStock = products.filter(product => (product.stok || 0) === 0)

    return {
      total: products.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock
    }
  } catch (error) {
    console.error('Error fetching stock status:', error)
    return {
      total: 0,
      lowStock: 0,
      outOfStock: 0,
      lowStockItems: [],
      outOfStockItems: []
    }
  }
}

// Get best selling products today
export const getBestSellingProductsToday = async (userId) => {
  const productsSold = await getProductsSoldToday(userId)
  return productsSold
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
}

// Get sales summary for today
export const getTodaySalesSummary = async (userId) => {
  try {
    const [salesData, revenue, totalProducts, stockStatus, bestSelling] = await Promise.all([
      getTodaySales(userId),
      getTodayRevenue(userId),
      getTotalProductsSoldToday(userId),
      getStockStatus(userId),
      getBestSellingProductsToday(userId)
    ])

    return {
      totalTransactions: salesData.length,
      totalRevenue: revenue,
      totalProductsSold: totalProducts,
      averageTransactionValue: salesData.length > 0 ? revenue / salesData.length : 0,
      stockStatus,
      bestSellingProducts: bestSelling,
      salesData
    }
  } catch (error) {
    console.error('Error fetching sales summary:', error)
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      totalProductsSold: 0,
      averageTransactionValue: 0,
      stockStatus: { total: 0, lowStock: 0, outOfStock: 0 },
      bestSellingProducts: [],
      salesData: []
    }
  }
}
