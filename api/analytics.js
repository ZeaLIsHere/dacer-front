// Vercel Serverless Function for AI Analytics
export default async function handler (req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  )
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  )

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { sales, products } = req.body

    if (!sales || !products) {
      return res
        .status(400)
        .json({ error: "Sales and products data required" })
    }

    // Simple AI Analytics Logic
    const insights = generateInsights(sales, products)

    res.status(200).json({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Analytics error:", error)
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    })
  }
}

function generateInsights (sales, products) {
  const insights = []

  // Enhanced time periods for better analysis
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const yesterdayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  )
  const yesterdayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const recentSales = sales.filter((sale) => {
    const saleDate = new Date(sale.timestamp)
    return saleDate >= weekAgo
  })

  const monthlySales = sales.filter((sale) => {
    const saleDate = new Date(sale.timestamp)
    return saleDate >= monthAgo
  })

  const todaySales = sales.filter((sale) => {
    const saleDate = new Date(sale.timestamp)
    return saleDate >= todayStart
  })

  const yesterdaySales = sales.filter((sale) => {
    const saleDate = new Date(sale.timestamp)
    return saleDate >= yesterdayStart && saleDate < yesterdayEnd
  })

  // 1. Best Selling Product Analysis
  const productSales = {}
  recentSales.forEach((sale) => {
    productSales[sale.productId] = (productSales[sale.productId] || 0) + 1
  })

  if (Object.keys(productSales).length > 0) {
    const bestSellingProductId = Object.keys(productSales).reduce((a, b) =>
      productSales[a] > productSales[b] ? a : b
    )

    const bestSellingProduct = products.find(
      (p) => p.id === bestSellingProductId
    )
    const bestSellingCount = productSales[bestSellingProductId]

    if (bestSellingProduct && bestSellingCount > 0) {
      insights.push({
        type: "best_seller",
        title: "Produk Terlaris",
        message: `${bestSellingProduct.nama} adalah produk terlaris dengan ${bestSellingCount} penjualan minggu ini`,
        recommendation:
          bestSellingCount > 5
            ? `Pertimbangkan untuk menambah stok ${bestSellingProduct.nama} karena permintaan tinggi`
            : `Promosikan ${bestSellingProduct.nama} lebih gencar untuk meningkatkan penjualan`,
        priority: "high"
      })
    }
  }

  // 2. Stock Level Analysis
  const lowStockProducts = products.filter((p) => p.stok > 0 && p.stok <= 5)
  const outOfStockProducts = products.filter((p) => p.stok === 0)

  if (outOfStockProducts.length > 0) {
    insights.push({
      type: "stock_alert",
      title: "Stok Habis",
      message: `${outOfStockProducts.length} produk kehabisan stok`,
      recommendation:
        "Segera restok produk yang habis untuk menghindari kehilangan penjualan",
      priority: "critical",
      products: outOfStockProducts.map((p) => p.nama)
    })
  }

  if (lowStockProducts.length > 0) {
    insights.push({
      type: "low_stock",
      title: "Stok Menipis",
      message: `${lowStockProducts.length} produk memiliki stok rendah`,
      recommendation: "Siapkan rencana restok untuk produk dengan stok menipis",
      priority: "medium",
      products: lowStockProducts.map((p) => ({ nama: p.nama, stok: p.stok }))
    })
  }

  // 3. Sales Trend Analysis
  const dailySales = {}
  recentSales.forEach((sale) => {
    const date = new Date(sale.timestamp).toDateString()
    dailySales[date] = (dailySales[date] || 0) + 1
  })

  const salesDays = Object.keys(dailySales).length
  const averageDailySales = salesDays > 0 ? recentSales.length / salesDays : 0

  if (averageDailySales > 0) {
    insights.push({
      type: "sales_trend",
      title: "Tren Penjualan",
      message: `Rata-rata ${Math.round(averageDailySales)} penjualan per hari`,
      recommendation:
        averageDailySales > 10
          ? "Penjualan Anda sangat baik! Pertimbangkan untuk menambah variasi produk"
          : averageDailySales > 5
            ? "Penjualan stabil. Coba strategi promosi untuk meningkatkan penjualan"
            : "Penjualan masih rendah. Fokus pada promosi dan layanan pelanggan",
      priority: averageDailySales > 10 ? "low" : "medium"
    })
  }

  // 4. Revenue Analysis
  const weeklyRevenue = recentSales.reduce((sum, sale) => sum + sale.price, 0)
  const dailyAverageRevenue = salesDays > 0 ? weeklyRevenue / salesDays : 0

  if (weeklyRevenue > 0) {
    insights.push({
      type: "revenue",
      title: "Analisis Pendapatan",
      message: `Pendapatan minggu ini: Rp ${weeklyRevenue.toLocaleString("id-ID")}`,
      recommendation:
        dailyAverageRevenue > 100000
          ? "Pendapatan harian sangat baik! Pertahankan momentum ini"
          : dailyAverageRevenue > 50000
            ? "Pendapatan cukup baik. Cari peluang untuk meningkatkan margin keuntungan"
            : "Fokus pada strategi peningkatan penjualan dan efisiensi operasional",
      priority: "medium",
      weeklyRevenue,
      dailyAverageRevenue: Math.round(dailyAverageRevenue)
    })
  }

  // 5. Product Performance Analysis
  const slowMovingProducts = products.filter((product) => {
    const productSaleCount = productSales[product.id] || 0
    return product.stok > 20 && productSaleCount < 2
  })

  if (slowMovingProducts.length > 0) {
    insights.push({
      type: "slow_moving",
      title: "Produk Kurang Laku",
      message: `${slowMovingProducts.length} produk memiliki penjualan rendah dengan stok tinggi`,
      recommendation:
        "Pertimbangkan promosi khusus atau diskon untuk produk yang kurang laku",
      priority: "low",
      products: slowMovingProducts.map((p) => ({ nama: p.nama, stok: p.stok }))
    })
  }

  // ========== ADVANCED AI ALGORITHMS ==========

  // 6. Seasonal Pattern Detection Algorithm
  const seasonalAnalysis = analyzeSeasonalPatterns(monthlySales)
  if (seasonalAnalysis.insight) {
    insights.push(seasonalAnalysis.insight)
  }

  // 7. Customer Behavior Prediction Algorithm
  const behaviorAnalysis = analyzePurchaseBehavior(recentSales, products)
  if (behaviorAnalysis.insight) {
    insights.push(behaviorAnalysis.insight)
  }

  // 8. Price Optimization Algorithm
  const priceOptimization = analyzePriceOptimization(recentSales, products)
  if (priceOptimization.insight) {
    insights.push(priceOptimization.insight)
  }

  // 9. Inventory Turnover Rate Algorithm
  const inventoryAnalysis = analyzeInventoryTurnover(recentSales, products)
  if (inventoryAnalysis.insight) {
    insights.push(inventoryAnalysis.insight)
  }

  // 10. Cross-Selling Opportunity Algorithm
  const crossSellingAnalysis = analyzeCrossSellingOpportunities(
    recentSales,
    products
  )
  if (crossSellingAnalysis.insight) {
    insights.push(crossSellingAnalysis.insight)
  }

  // 11. Market Trend Prediction Algorithm
  const trendAnalysis = predictMarketTrends(
    todaySales,
    yesterdaySales,
    recentSales
  )
  if (trendAnalysis.insight) {
    insights.push(trendAnalysis.insight)
  }

  // 12. Profit Margin Optimization Algorithm
  const profitAnalysis = analyzeProfitMargins(recentSales, products)
  if (profitAnalysis.insight) {
    insights.push(profitAnalysis.insight)
  }

  // 13. Demand Forecasting Algorithm
  const demandForecast = forecastDemand(monthlySales, products)
  if (demandForecast.insight) {
    insights.push(demandForecast.insight)
  }

  // 14. Category Performance Algorithm
  const categoryAnalysis = analyzeCategoryPerformance(recentSales, products)
  if (categoryAnalysis.insight) {
    insights.push(categoryAnalysis.insight)
  }

  // 15. Risk Assessment Algorithm
  const riskAnalysis = assessBusinessRisks(recentSales, products)
  if (riskAnalysis.insight) {
    insights.push(riskAnalysis.insight)
  }

  // Sort insights by priority
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
  insights.sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
  )

  return insights
}

// ========== ADVANCED AI ALGORITHM IMPLEMENTATIONS ==========

// 1. Seasonal Pattern Detection Algorithm
function analyzeSeasonalPatterns (monthlySales) {
  try {
    const hourlyData = {}
    const dayOfWeekData = {}

    monthlySales.forEach((sale) => {
      const date = new Date(sale.timestamp)
      const hour = date.getHours()
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

      hourlyData[hour] = (hourlyData[hour] || 0) + 1
      dayOfWeekData[dayOfWeek] = (dayOfWeekData[dayOfWeek] || 0) + 1
    })

    // Find peak hours
    const peakHour = Object.keys(hourlyData).reduce(
      (a, b) => (hourlyData[a] > hourlyData[b] ? a : b),
      "0"
    )

    // Find peak day
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu"
    ]
    const peakDay = Object.keys(dayOfWeekData).reduce(
      (a, b) => (dayOfWeekData[a] > dayOfWeekData[b] ? a : b),
      "0"
    )

    if (monthlySales.length > 10) {
      return {
        insight: {
          type: "seasonal_pattern",
          title: "🕐 Pola Musiman Terdeteksi",
          message: `Jam sibuk: ${peakHour}:00, Hari sibuk: ${dayNames[peakDay]}`,
          recommendation: `Siapkan stok lebih banyak pada ${dayNames[peakDay]} jam ${peakHour}:00. Pertimbangkan promosi di jam sepi untuk meratakan penjualan.`,
          priority: "medium",
          data: { peakHour, peakDay: dayNames[peakDay] }
        }
      }
    }
  } catch (error) {
    console.error("Seasonal analysis error:", error)
  }
  return { insight: null }
}

// 2. Customer Behavior Prediction Algorithm
function analyzePurchaseBehavior (recentSales, _products) {
  try {
    if (recentSales.length < 5) return { insight: null }

    // Analyze purchase frequency
    const purchaseIntervals = []
    const sortedSales = recentSales.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    )

    for (let i = 1; i < sortedSales.length; i++) {
      const interval =
        new Date(sortedSales[i].timestamp) -
        new Date(sortedSales[i - 1].timestamp)
      purchaseIntervals.push(interval / (1000 * 60 * 60)) // Convert to hours
    }

    const avgInterval =
      purchaseIntervals.reduce((a, b) => a + b, 0) / purchaseIntervals.length

    // Analyze basket patterns
    const avgBasketSize =
      recentSales.reduce((sum, sale) => sum + (sale.totalItems || 1), 0) /
      recentSales.length

    let behaviorType = "normal"
    let recommendation = ""

    if (avgInterval < 2) {
      behaviorType = "frequent"
      recommendation =
        "Pelanggan sering berbelanja! Tawarkan program loyalitas atau bundle deals."
    } else if (avgInterval > 24) {
      behaviorType = "occasional"
      recommendation =
        "Pelanggan jarang berbelanja. Buat promosi menarik untuk meningkatkan frekuensi kunjungan."
    } else {
      recommendation =
        "Pola pembelian normal. Pertahankan kualitas layanan dan variasi produk."
    }

    return {
      insight: {
        type: "customer_behavior",
        title: "👥 Analisis Perilaku Pelanggan",
        message: `Rata-rata interval pembelian: ${Math.round(avgInterval)} jam, Ukuran keranjang: ${Math.round(avgBasketSize)} item`,
        recommendation,
        priority: "medium",
        data: {
          behaviorType,
          avgInterval: Math.round(avgInterval),
          avgBasketSize: Math.round(avgBasketSize)
        }
      }
    }
  } catch (error) {
    console.error("Behavior analysis error:", error)
  }
  return { insight: null }
}

// 3. Price Optimization Algorithm
function analyzePriceOptimization (recentSales, products) {
  try {
    if (recentSales.length < 3) return { insight: null }

    const pricePerformance = {}

    recentSales.forEach((sale) => {
      const product = products.find((p) => p.id === sale.productId)
      if (product) {
        if (!pricePerformance[product.kategori]) {
          pricePerformance[product.kategori] = {
            sales: 0,
            revenue: 0,
            products: []
          }
        }
        pricePerformance[product.kategori].sales += 1
        pricePerformance[product.kategori].revenue += sale.price
        pricePerformance[product.kategori].products.push(product)
      }
    })

    // Find best performing category by revenue per sale
    let bestCategory = null
    let bestRatio = 0

    Object.keys(pricePerformance).forEach((category) => {
      const data = pricePerformance[category]
      const revenuePerSale = data.revenue / data.sales
      if (revenuePerSale > bestRatio) {
        bestRatio = revenuePerSale
        bestCategory = category
      }
    })

    if (bestCategory) {
      return {
        insight: {
          type: "price_optimization",
          title: "💰 Optimasi Harga",
          message: `Kategori ${bestCategory} memiliki performa harga terbaik (Rp ${Math.round(bestRatio).toLocaleString("id-ID")}/penjualan)`,
          recommendation: `Fokus pada kategori ${bestCategory} untuk margin keuntungan optimal. Pertimbangkan menaikkan harga produk lain secara bertahap.`,
          priority: "medium",
          data: { bestCategory, avgRevenue: Math.round(bestRatio) }
        }
      }
    }
  } catch (error) {
    console.error("Price optimization error:", error)
  }
  return { insight: null }
}

// 4. Inventory Turnover Rate Algorithm
function analyzeInventoryTurnover (recentSales, products) {
  try {
    const turnoverRates = products.map((product) => {
      const productSales = recentSales.filter(
        (sale) => sale.productId === product.id
      ).length
      const turnoverRate = product.stok > 0 ? productSales / product.stok : 0

      return {
        ...product,
        turnoverRate,
        salesCount: productSales
      }
    })

    // Find products with optimal turnover (not too high, not too low)
    const optimalTurnover = turnoverRates.filter(
      (p) => p.turnoverRate > 0.1 && p.turnoverRate < 0.8
    )
    const slowTurnover = turnoverRates.filter(
      (p) => p.turnoverRate < 0.1 && p.stok > 10
    )
    const fastTurnover = turnoverRates.filter((p) => p.turnoverRate > 0.8)

    if (slowTurnover.length > 0) {
      return {
        insight: {
          type: "inventory_turnover",
          title: "📦 Analisis Perputaran Stok",
          message: `${slowTurnover.length} produk memiliki perputaran stok lambat`,
          recommendation:
            "Produk dengan perputaran lambat sebaiknya dikurangi stoknya atau diberi promosi khusus untuk mempercepat penjualan.",
          priority: "medium",
          data: {
            slowProducts: slowTurnover
              .slice(0, 3)
              .map((p) => ({ nama: p.nama, rate: p.turnoverRate.toFixed(2) }))
          }
        }
      }
    }

    if (fastTurnover.length > 0) {
      return {
        insight: {
          type: "inventory_turnover",
          title: "🚀 Perputaran Stok Cepat",
          message: `${fastTurnover.length} produk memiliki perputaran sangat cepat`,
          recommendation:
            "Produk dengan perputaran cepat perlu penambahan stok segera untuk menghindari kehabisan.",
          priority: "high",
          data: {
            fastProducts: fastTurnover
              .slice(0, 3)
              .map((p) => ({ nama: p.nama, rate: p.turnoverRate.toFixed(2) }))
          }
        }
      }
    }
  } catch (error) {
    console.error("Inventory turnover error:", error)
  }
  return { insight: null }
}

// 5. Cross-Selling Opportunity Algorithm
function analyzeCrossSellingOpportunities (recentSales, products) {
  try {
    if (recentSales.length < 5) return { insight: null }

    // Group sales by time proximity (within 1 hour = same shopping session)
    const sessions = []
    const sortedSales = recentSales.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    )

    let currentSession = [sortedSales[0]]

    for (let i = 1; i < sortedSales.length; i++) {
      const timeDiff =
        new Date(sortedSales[i].timestamp) -
        new Date(sortedSales[i - 1].timestamp)

      if (timeDiff <= 60 * 60 * 1000) {
        // 1 hour
        currentSession.push(sortedSales[i])
      } else {
        if (currentSession.length > 1) sessions.push(currentSession)
        currentSession = [sortedSales[i]]
      }
    }

    if (currentSession.length > 1) sessions.push(currentSession)

    // Analyze product combinations
    const combinations = {}
    sessions.forEach((session) => {
      const productIds = session.map((sale) => sale.productId)
      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const combo = [productIds[i], productIds[j]].sort().join("-")
          combinations[combo] = (combinations[combo] || 0) + 1
        }
      }
    })

    // Find most frequent combination
    const topCombo = Object.keys(combinations).reduce(
      (a, b) => (combinations[a] > combinations[b] ? a : b),
      ""
    )

    if (topCombo && combinations[topCombo] > 1) {
      const [productId1, productId2] = topCombo.split("-")
      const product1 = products.find((p) => p.id === productId1)
      const product2 = products.find((p) => p.id === productId2)

      if (product1 && product2) {
        return {
          insight: {
            type: "cross_selling",
            title: "🔗 Peluang Cross-Selling",
            message: `${product1.nama} dan ${product2.nama} sering dibeli bersamaan (${combinations[topCombo]}x)`,
            recommendation: `Tempatkan ${product1.nama} dan ${product2.nama} berdekatan atau buat paket bundle untuk meningkatkan penjualan.`,
            priority: "medium",
            data: {
              product1: product1.nama,
              product2: product2.nama,
              frequency: combinations[topCombo]
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Cross-selling analysis error:", error)
  }
  return { insight: null }
}

// 6. Market Trend Prediction Algorithm
function predictMarketTrends (todaySales, yesterdaySales, recentSales) {
  try {
    const todayCount = todaySales.length
    const yesterdayCount = yesterdaySales.length

    if (yesterdayCount === 0) return { insight: null }

    const growthRate = ((todayCount - yesterdayCount) / yesterdayCount) * 100

    // Analyze weekly trend
    const dailyData = {}
    recentSales.forEach((sale) => {
      const date = new Date(sale.timestamp).toDateString()
      dailyData[date] = (dailyData[date] || 0) + 1
    })

    const dailyCounts = Object.values(dailyData)
    const weeklyTrend =
      dailyCounts.length > 1
        ? ((dailyCounts[dailyCounts.length - 1] - dailyCounts[0]) /
            dailyCounts[0]) *
          100
        : 0

    let trendType = "stable"
    let recommendation = ""
    let priority = "low"

    if (growthRate > 20) {
      trendType = "strong_growth"
      recommendation =
        "Tren penjualan sangat positif! Siapkan stok lebih banyak dan pertimbangkan ekspansi produk."
      priority = "high"
    } else if (growthRate > 5) {
      trendType = "growth"
      recommendation =
        "Penjualan meningkat. Pertahankan momentum dengan promosi yang tepat sasaran."
      priority = "medium"
    } else if (growthRate < -20) {
      trendType = "decline"
      recommendation =
        "Penjualan menurun drastis. Evaluasi strategi pemasaran dan cari tahu penyebabnya."
      priority = "high"
    } else if (growthRate < -5) {
      trendType = "slight_decline"
      recommendation =
        "Penjualan sedikit menurun. Lakukan promosi atau evaluasi harga produk."
      priority = "medium"
    } else {
      recommendation =
        "Penjualan stabil. Fokus pada efisiensi operasional dan kepuasan pelanggan."
    }

    return {
      insight: {
        type: "market_trend",
        title: "📈 Prediksi Tren Pasar",
        message: `Pertumbuhan hari ini: ${growthRate.toFixed(1)}%, Tren mingguan: ${weeklyTrend.toFixed(1)}%`,
        recommendation,
        priority,
        data: {
          growthRate: growthRate.toFixed(1),
          weeklyTrend: weeklyTrend.toFixed(1),
          trendType
        }
      }
    }
  } catch (error) {
    console.error("Trend prediction error:", error)
  }
  return { insight: null }
}

// 7. Profit Margin Optimization Algorithm
function analyzeProfitMargins (recentSales, products) {
  try {
    if (recentSales.length < 3) return { insight: null }

    const categoryMargins = {}

    recentSales.forEach((sale) => {
      const product = products.find((p) => p.id === sale.productId)
      if (product) {
        // Estimate cost as 60% of selling price (industry average)
        const estimatedCost = product.harga * 0.6
        const margin = ((product.harga - estimatedCost) / product.harga) * 100

        if (!categoryMargins[product.kategori]) {
          categoryMargins[product.kategori] = {
            margins: [],
            sales: 0,
            revenue: 0
          }
        }

        categoryMargins[product.kategori].margins.push(margin)
        categoryMargins[product.kategori].sales += 1
        categoryMargins[product.kategori].revenue += product.harga
      }
    })

    // Calculate average margins per category
    const categoryAnalysis = Object.keys(categoryMargins).map((category) => {
      const data = categoryMargins[category]
      const avgMargin =
        data.margins.reduce((a, b) => a + b, 0) / data.margins.length

      return {
        category,
        avgMargin,
        sales: data.sales,
        revenue: data.revenue
      }
    })

    // Find best and worst performing categories
    const bestCategory = categoryAnalysis.reduce((a, b) =>
      a.avgMargin > b.avgMargin ? a : b
    )
    const worstCategory = categoryAnalysis.reduce((a, b) =>
      a.avgMargin < b.avgMargin ? a : b
    )

    if (categoryAnalysis.length > 1) {
      return {
        insight: {
          type: "profit_margin",
          title: "💎 Optimasi Margin Keuntungan",
          message: `Margin terbaik: ${bestCategory.category} (${bestCategory.avgMargin.toFixed(1)}%), Terburuk: ${worstCategory.category} (${worstCategory.avgMargin.toFixed(1)}%)`,
          recommendation: `Fokus pada kategori ${bestCategory.category} untuk memaksimalkan keuntungan. Evaluasi harga atau supplier untuk kategori ${worstCategory.category}.`,
          priority: "medium",
          data: {
            bestCategory: bestCategory.category,
            worstCategory: worstCategory.category,
            bestMargin: bestCategory.avgMargin.toFixed(1),
            worstMargin: worstCategory.avgMargin.toFixed(1)
          }
        }
      }
    }
  } catch (error) {
    console.error("Profit margin error:", error)
  }
  return { insight: null }
}

// 8. Demand Forecasting Algorithm
function forecastDemand (monthlySales, products) {
  try {
    if (monthlySales.length < 10) return { insight: null }

    // Simple linear regression for demand forecasting
    const productDemand = {}

    monthlySales.forEach((sale) => {
      const week = Math.floor(
        (new Date() - new Date(sale.timestamp)) / (7 * 24 * 60 * 60 * 1000)
      )

      if (!productDemand[sale.productId]) {
        productDemand[sale.productId] = []
      }
      productDemand[sale.productId].push({ week, sales: 1 })
    })

    // Aggregate weekly data
    const weeklyDemand = {}
    Object.keys(productDemand).forEach((productId) => {
      const weeklyData = {}
      productDemand[productId].forEach((data) => {
        weeklyData[data.week] = (weeklyData[data.week] || 0) + 1
      })
      weeklyDemand[productId] = weeklyData
    })

    // Find products with increasing demand trend
    const trendingProducts = []

    Object.keys(weeklyDemand).forEach((productId) => {
      const weeks = Object.keys(weeklyDemand[productId])
        .map(Number)
        .sort((a, b) => b - a)
      if (weeks.length >= 3) {
        const recent = weeklyDemand[productId][weeks[0]] || 0
        const older = weeklyDemand[productId][weeks[2]] || 0

        if (recent > older) {
          const product = products.find((p) => p.id === productId)
          if (product) {
            trendingProducts.push({
              ...product,
              trend: ((recent - older) / Math.max(older, 1)) * 100
            })
          }
        }
      }
    })

    if (trendingProducts.length > 0) {
      const topTrending = trendingProducts.sort((a, b) => b.trend - a.trend)[0]

      return {
        insight: {
          type: "demand_forecast",
          title: "🔮 Prediksi Permintaan",
          message: `${topTrending.nama} menunjukkan tren permintaan meningkat ${topTrending.trend.toFixed(1)}%`,
          recommendation: `Siapkan stok lebih banyak untuk ${topTrending.nama}. Pertimbangkan untuk menambah variasi produk serupa.`,
          priority: "high",
          data: {
            product: topTrending.nama,
            trend: topTrending.trend.toFixed(1),
            currentStock: topTrending.stok
          }
        }
      }
    }
  } catch (error) {
    console.error("Demand forecasting error:", error)
  }
  return { insight: null }
}

// 9. Category Performance Algorithm
function analyzeCategoryPerformance (recentSales, products) {
  try {
    if (recentSales.length < 5) return { insight: null }

    const categoryPerformance = {}

    recentSales.forEach((sale) => {
      const product = products.find((p) => p.id === sale.productId)
      if (product) {
        if (!categoryPerformance[product.kategori]) {
          categoryPerformance[product.kategori] = {
            sales: 0,
            revenue: 0,
            products: new Set()
          }
        }

        categoryPerformance[product.kategori].sales += 1
        categoryPerformance[product.kategori].revenue += sale.price
        categoryPerformance[product.kategori].products.add(product.id)
      }
    })

    // Calculate performance metrics
    const categoryMetrics = Object.keys(categoryPerformance).map((category) => {
      const data = categoryPerformance[category]
      return {
        category,
        sales: data.sales,
        revenue: data.revenue,
        productCount: data.products.size,
        avgRevenuePerProduct: data.revenue / data.products.size,
        salesPerProduct: data.sales / data.products.size
      }
    })

    if (categoryMetrics.length > 1) {
      // Find best performing category
      const bestCategory = categoryMetrics.reduce((a, b) =>
        a.avgRevenuePerProduct > b.avgRevenuePerProduct ? a : b
      )

      // Find underperforming category
      const worstCategory = categoryMetrics.reduce((a, b) =>
        a.salesPerProduct < b.salesPerProduct ? a : b
      )

      return {
        insight: {
          type: "category_performance",
          title: "📊 Performa Kategori",
          message: `Kategori terbaik: ${bestCategory.category} (Rp ${Math.round(bestCategory.avgRevenuePerProduct).toLocaleString("id-ID")}/produk)`,
          recommendation: `Ekspansi kategori ${bestCategory.category} dengan menambah variasi produk. Evaluasi strategi untuk kategori ${worstCategory.category}.`,
          priority: "medium",
          data: {
            bestCategory: bestCategory.category,
            worstCategory: worstCategory.category,
            bestRevenue: Math.round(bestCategory.avgRevenuePerProduct),
            categories: categoryMetrics.length
          }
        }
      }
    }
  } catch (error) {
    console.error("Category performance error:", error)
  }
  return { insight: null }
}

// 10. Risk Assessment Algorithm
function assessBusinessRisks (recentSales, products) {
  try {
    const risks = []

    // Risk 1: Over-dependence on single product
    const productSales = {}
    recentSales.forEach((sale) => {
      productSales[sale.productId] = (productSales[sale.productId] || 0) + 1
    })

    const totalSales = recentSales.length
    const topProduct = Object.keys(productSales).reduce(
      (a, b) => (productSales[a] > productSales[b] ? a : b),
      ""
    )

    if (topProduct && totalSales > 0) {
      const dependencyRatio = (productSales[topProduct] / totalSales) * 100

      if (dependencyRatio > 50) {
        const product = products.find((p) => p.id === topProduct)
        risks.push({
          type: "product_dependency",
          severity: "high",
          description: `Ketergantungan tinggi pada ${product?.nama || "satu produk"} (${dependencyRatio.toFixed(1)}% dari penjualan)`
        })
      }
    }

    // Risk 2: Low stock diversity
    const lowStockCount = products.filter((p) => p.stok <= 5).length
    const totalProducts = products.length

    if (totalProducts > 0) {
      const lowStockRatio = (lowStockCount / totalProducts) * 100

      if (lowStockRatio > 30) {
        risks.push({
          type: "stock_diversity",
          severity: "medium",
          description: `${lowStockRatio.toFixed(1)}% produk memiliki stok rendah`
        })
      }
    }

    // Risk 3: Sales volatility
    const dailySales = {}
    recentSales.forEach((sale) => {
      const date = new Date(sale.timestamp).toDateString()
      dailySales[date] = (dailySales[date] || 0) + 1
    })

    const dailyCounts = Object.values(dailySales)
    if (dailyCounts.length > 2) {
      const avg = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length
      const variance =
        dailyCounts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) /
        dailyCounts.length
      const volatility = (Math.sqrt(variance) / avg) * 100

      if (volatility > 50) {
        risks.push({
          type: "sales_volatility",
          severity: "medium",
          description: `Penjualan sangat fluktuatif (volatilitas ${volatility.toFixed(1)}%)`
        })
      }
    }

    if (risks.length > 0) {
      const highRisks = risks.filter((r) => r.severity === "high").length
      const priority = highRisks > 0 ? "high" : "medium"

      return {
        insight: {
          type: "risk_assessment",
          title: "⚠️ Penilaian Risiko Bisnis",
          message: `Terdeteksi ${risks.length} potensi risiko bisnis`,
          recommendation: `Diversifikasi produk dan strategi penjualan untuk mengurangi risiko. ${risks.map((r) => r.description).join(". ")}`,
          priority,
          data: { risks, riskCount: risks.length, highRiskCount: highRisks }
        }
      }
    }
  } catch (error) {
    console.error("Risk assessment error:", error)
  }
  return { insight: null }
}
