import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useStore } from './StoreContext'
import { getGroqResponse } from '../services/groqService'
import { API_BASE_URL } from '../apiClient'

const ChatbotContext = createContext()

export function useChatbot () {
  return useContext(ChatbotContext)
}

export function ChatbotProvider ({ children }) {
  const { currentUser } = useAuth()
  const { currentStore } = useStore()
  const [_isOpen, _setIsOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [userName, setUserName] = useState(null)

  // Set userName automatically from store data
  useEffect(() => {
    if (currentStore?.ownerName && !userName) {
      setUserName(currentStore.ownerName)
    }
  }, [currentStore, userName])

  // Generate AI name from store name
  const generateAIName = useCallback((storeName) => {
    if (!storeName) return 'Asisten AI'
    
    const cleanName = storeName
      .replace(/toko|warung|kios|shop|store/gi, '')
      .trim()
    
    // If the name is too short, add AI
    if (cleanName.length <= 2) {
      return `${cleanName} AI`
    }
    
    // Capitalize each word
    const formattedName = cleanName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    return `${formattedName} AI`
  }, [])

  const aiName = generateAIName(currentStore?.storeName)

  const [messages, setMessages] = useState(() => {
    if (currentStore) {
      const aiName = generateAIName(currentStore.storeName)
      return [
        {
          id: 1,
          type: 'bot',
          message: `Halo! Saya ${aiName}, asisten cerdas untuk ${currentStore.storeName || 'toko Anda'}! Senang bisa membantu ${currentStore.ownerName || 'Anda'} mengelola bisnis.\n\nTanya apa saja tentang penjualan, stok, atau strategi bisnis ya!`,
          timestamp: new Date()
        }
      ]
    } else {
      return [
        {
          id: 1,
          type: 'bot',
          message: 'Halo! Sepertinya Anda belum membuat toko. Silakan buat toko terlebih dahulu di halaman Account agar saya bisa membantu dengan data yang personal!\n\nAtau lanjutkan tanya pertanyaan umum tentang bisnis.',
          timestamp: new Date()
        }
      ]
    }
  })

  // Update when store data changes
  useEffect(() => {
    if (currentStore) {
      const aiName = generateAIName(currentStore.storeName)
      setMessages([
        {
          id: 1,
          type: 'bot',
          message: `Halo! Saya ${aiName}, asisten cerdas untuk ${currentStore.storeName || 'toko Anda'}! Senang bisa membantu ${currentStore.ownerName || 'Anda'} mengelola bisnis.\n\nTanya apa saja tentang penjualan, stok, atau strategi bisnis ya!`,
          timestamp: new Date()
        }
      ])
    }
  }, [currentStore, generateAIName])

  // AI Knowledge Base - Minimal for greeting detection only
  const aiKnowledgeBase = useMemo(() => ({
    // Greeting patterns
    greetings: ['halo', 'hai', 'hello', 'hi', 'selamat', 'pagi', 'siang', 'sore', 'malam']
  }), [])

  // Fetch real-time data dari backend PostgreSQL
  const fetchRealtimeData = useCallback(async () => {
    if (!currentUser || !currentStore) return null
    try {
      const [summaryRes, productRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/sales/summary?userId=${currentUser.id}&storeId=${currentStore.id}`),
        fetch(`${API_BASE_URL}/api/products?userId=${currentUser.id}&storeId=${currentStore.id}`)
      ])
      const summaryData = await summaryRes.json()
      const productData = await productRes.json()
      return {
        sales: summaryData.data?.sales || [],
        summary: summaryData.data?.summary || {},
        products: productData.data?.products || []
      }
    } catch (err) {
      console.error('Chatbot fetch error:', err)
      return null
    }
  }, [currentUser, currentStore])

  // Smart Response Generator - Only real-time data handling
  const generateSmartResponse = useCallback(async (userMessage) => {
    const message = userMessage.toLowerCase()
    const realtimeData = await fetchRealtimeData()
    
    // Check what AI can do
    if (message.includes('apa') && (message.includes('bisa') || message.includes('lakukan') || message.includes('kemampuan') || message.includes('fitur'))) {
      return {
        message: `Kemampuan ${aiName}:

Analisis Penjualan & Keuangan:
• Laporan penjualan hari ini/minggu/bulan
• Total pendapatan dan profit
• Produk terlaris dan trend penjualan
• Analisis transaksi per customer

Manajemen Stok:
• Cek ketersediaan stok real-time
• Notifikasi stok rendah/habis
• Rekomendasi restock berdasarkan penjualan
• Prediksi kebutuhan stok

Strategi Bisnis:
• Saran pricing dan diskon
• Strategi marketing yang efektif
• Analisis kompetitor
• Forecasting penjualan
• Tips meningkatkan profit

Asisten Cerdas:
• Berikan insight dari data penjualan
• Saran keputusan bisnis berdasarkan AI

Tanya apa saja tentang bisnis Anda, saya siap membantu!`,
        suggestions: ['Berapa penjualan hari ini?', 'Cek stok barang', 'Analisis profit', 'Strategi penjualan', 'Rekomendasi bisnis']
      }
    }

    // Additional capability queries
    if (message.includes('help') || message.includes('bantuan') || message.includes('tutorial') || message.includes('panduan')) {
      return {
        message: `Butuh Bantuan? ${aiName} Siap Membantu!

Cara Menggunakan Saya:
1. Tanya langsung tentang penjualan, stok, atau strategi
2. Minta laporan penjualan/stok real-time
3. Diskusi strategi bisnis dan marketing
4. Analisis data untuk insight bisnis

Contoh Pertanyaan:
• "Berapa penjualan hari ini?"
• "Produk apa yang stoknya habis?"
• "Bagaimana meningkatkan profit?"
• "Analisis trend penjualan minggu ini"

Akses Saya:
✅ Data penjualan real-time
✅ Status stok terkini
✅ Analisis bisnis cerdas
✅ Strategi AI-powered

Langsung saja tanya apa yang Anda butuhkan!`,
        suggestions: ['Berapa penjualan hari ini?', 'Cek stok barang', 'Analisis profit', 'Strategi penjualan']
      }
    }

    // Enhanced data queries with better validation
    const isDataQuery = (
      message.includes('hari ini') && (
        message.includes('jual') || message.includes('penjualan') || message.includes('transaksi') ||
        message.includes('pendapatan') || message.includes('profit') || message.includes('uang') ||
        message.includes('produk') && (message.includes('terjual') || message.includes('laku')) ||
        message.includes('insight') || message.includes('analisis') || message.includes('laporan')
      )
    ) || (
      message.includes('stok') || message.includes('barang') || message.includes('cek') ||
      message.includes('ketersediaan') || message.includes('habis') || message.includes('rendah')
    ) || (
      message.includes('penjualan') || message.includes('jual') || message.includes('pendapatan') ||
      message.includes('profit') || message.includes('laba') || message.includes('omset') ||
      message.includes('transaksi') || message.includes('revenue')
    ) || (
      message.includes('insight') || message.includes('analisis') || message.includes('laporan') ||
      message.includes('trend') || message.includes('performa') || message.includes('evaluasi')
    )

    if (isDataQuery) {
      // Handle stock queries separately (doesn't require sales data)
      if (message.includes('stok') || message.includes('barang') || message.includes('ketersediaan') || 
          message.includes('habis') || message.includes('rendah')) {
        if (realtimeData && realtimeData.stockStatus) {
          return {
            message: `STATUS STOK HARI INI:

Total Produk: ${realtimeData.stockStatus.total} jenis
Stok Rendah: ${realtimeData.stockStatus.lowStock} jenis
Stok Habis: ${realtimeData.stockStatus.outOfStock} jenis

${realtimeData.stockStatus.outOfStockItems.length > 0 ? `Produk Habis:\n${realtimeData.stockStatus.outOfStockItems.slice(0, 3).map(p => `• ${p.name || 'Unknown Product'}`).join('\n')}` : ''}

${realtimeData.stockStatus.lowStockItems.length > 0 ? `Stok Rendah:\n${realtimeData.stockStatus.lowStockItems.slice(0, 3).map(p => `• ${p.name || 'Unknown Product'} (sisa ${p.stok || 0})`).join('\n')}` : ''}`,
            suggestions: ['Beli stok baru', 'Analisis penjualan', 'Produk terlaris', 'Tips stok management']
          }
        } else {
          return {
            message: `STATUS STOK:

Saat ini saya tidak dapat mengakses data stok.

Untuk informasi stok, silakan:
• Cek halaman Produk
• Lihat dashboard stok
• Buka halaman Stock untuk detail lengkap

Data stok akan tersedia setelah produk ditambahkan.`,
            suggestions: ['Cek halaman produk', 'Lihat dashboard', 'Tambah produk', 'Bantuan']
          }
        }
      }
      
      // Handle sales and revenue queries
      if (message.includes('penjualan') || message.includes('jual') || message.includes('pendapatan') ||
          message.includes('profit') || message.includes('laba') || message.includes('omset') ||
          message.includes('transaksi') || message.includes('revenue') || message.includes('uang')) {
        if (realtimeData && realtimeData.totalTransactions > 0) {
          const salesMessage = message.includes('pendapatan') || message.includes('profit') || 
                               message.includes('laba') || message.includes('omset') || 
                               message.includes('revenue') || message.includes('uang') ? 
            `PENDAPATAN HARI INI:

Total Pendapatan: Rp ${realtimeData.totalRevenue.toLocaleString('id-ID')}
Dari ${realtimeData.totalTransactions} transaksi
Rata-rata per transaksi: Rp ${realtimeData.averageTransactionValue.toLocaleString('id-ID')}

${realtimeData.totalRevenue > 0 ? 'Bagus! Terus pertahankan penjualan Anda.' : 'Belum ada pendapatan hari ini. Mari mulai promosi!'}` :
            `PENJUALAN HARI INI:

Total Transaksi: ${realtimeData.totalTransactions} transaksi
Total Pendapatan: Rp ${realtimeData.totalRevenue.toLocaleString('id-ID')}
Produk Terjual: ${realtimeData.totalProductsSold} item
Rata-rata Transaksi: Rp ${realtimeData.averageTransactionValue.toLocaleString('id-ID')}

${realtimeData.bestSellingProducts.length > 0 ? `Produk Terlaris:\n${realtimeData.bestSellingProducts.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} (${p.quantity} pcs)`).join('\n')}` : ''}`
          
          return {
            message: salesMessage,
            suggestions: ['Analisis stok hari ini', 'Produk apa yang laku?', 'Pendapatan minggu ini', 'Strategi penjualan besok']
          }
        } else {
          return {
            message: `DATA PENJUALAN:

Saat ini belum ada data penjualan hari ini atau saya tidak dapat mengakses data real-time.

Untuk informasi lengkap, silakan:
• Cek dashboard penjualan
• Lihat halaman Statistik
• Buka halaman Kasir untuk transaksi terkini

Data akan tersedia setelah ada transaksi penjualan.`,
            suggestions: ['Cek dashboard', 'Lihat statistik', 'Buka halaman kasir', 'Tips penjualan']
          }
        }
      }
      
      // Handle insight and analysis queries
      if (message.includes('insight') || message.includes('analisis') || message.includes('laporan') ||
          message.includes('trend') || message.includes('performa') || message.includes('evaluasi')) {
        if (realtimeData && realtimeData.totalTransactions > 0) {
          return {
            message: `INSIGHT PENJUALAN HARI INI:

Performa Penjualan:
• Total Transaksi: ${realtimeData.totalTransactions} transaksi
• Total Pendapatan: Rp ${realtimeData.totalRevenue.toLocaleString('id-ID')}
• Produk Terjual: ${realtimeData.totalProductsSold} item
• Rata-rata Transaksi: Rp ${realtimeData.averageTransactionValue.toLocaleString('id-ID')}

${realtimeData.bestSellingProducts.length > 0 ? `Produk Terlaris:\n${realtimeData.bestSellingProducts.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} (${p.quantity} pcs, Rp ${p.totalRevenue.toLocaleString('id-ID')})`).join('\n')}` : ''}

${realtimeData.stockStatus ? `Status Stok:
• Total Produk: ${realtimeData.stockStatus.total} jenis
• Stok Rendah: ${realtimeData.stockStatus.lowStock} jenis
• Stok Habis: ${realtimeData.stockStatus.outOfStock} jenis` : ''}

Rekomendasi:
${realtimeData.totalRevenue > 0 ? '✅ Penjualan hari ini baik, pertahankan kualitas layanan' : '⚠️ Perlu tingkatkan promosi untuk meningkatkan penjualan'}
${realtimeData.stockStatus?.outOfStock > 0 ? '⚠️ Segera restok produk yang habis' : '✅ Stok produk dalam kondisi baik'}`,
            suggestions: ['Strategi penjualan besok', 'Analisis stok hari ini', 'Prediksi tren minggu depan', 'Tips meningkatkan profit']
          }
        } else {
          return {
            message: `INSIGHT PENJUALAN:

Saat ini belum ada data penjualan untuk dianalisis.

Untuk mendapatkan insight:
• Lakukan beberapa transaksi penjualan
• Cek dashboard untuk update real-time
• Analisis data setelah ada transaksi

Insight akan tersedia setelah ada data penjualan.`,
            suggestions: ['Cek dashboard', 'Lihat statistik', 'Buka halaman kasir', 'Tips penjualan']
          }
        }
      }
      
      // Handle general "hari ini" queries
      if (message.includes('hari ini')) {
        if (realtimeData && realtimeData.totalTransactions > 0) {
          return {
            message: `RINGKASAN HARI INI:

📊 Penjualan:
• ${realtimeData.totalTransactions} transaksi
• Rp ${realtimeData.totalRevenue.toLocaleString('id-ID')} pendapatan
• ${realtimeData.totalProductsSold} produk terjual

📦 Stok:
• ${realtimeData.stockStatus?.total || 0} total produk
• ${realtimeData.stockStatus?.lowStock || 0} stok rendah
• ${realtimeData.stockStatus?.outOfStock || 0} stok habis

🏆 Produk Terlaris:
${realtimeData.bestSellingProducts.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} (${p.quantity} pcs)`).join('\n') || 'Belum ada data'}

Performa hari ini: ${realtimeData.totalRevenue > 0 ? 'Bagus!' : 'Perlu peningkatan'}`,
            suggestions: ['Analisis detail penjualan', 'Cek stok lengkap', 'Strategi besok', 'Lihat trend']
          }
        } else {
          return {
            message: `RINGKASAN HARI INI:

Belum ada aktivitas penjualan hari ini.

Mulai penjualan untuk mendapatkan:
• Data penjualan real-time
• Analisis performa
• Insight bisnis
• Rekomendasi strategi

Data akan update setelah ada transaksi.`,
            suggestions: ['Buka halaman kasir', 'Tambah produk', 'Cek stok', 'Tips penjualan']
          }
        }
      }
    }
    
    // Greeting responses - userName is automatically set from store data
    if (aiKnowledgeBase.greetings.some(greeting => message.includes(greeting))) {
      return {
        message: `Halo ${userName || currentStore?.ownerName || 'Teman'}! Senang bisa membantu ${currentStore?.storeName || 'toko Anda'} hari ini. Ada yang bisa saya bantu?`,
        suggestions: ['Strategi penjualan besok', 'Analisis stok hari ini', 'Prediksi tren minggu depan', 'Tips meningkatkan profit']
      }
    }
    
    // Return null to let Groq AI handle everything else
    return null
  }, [fetchRealtimeData, aiKnowledgeBase.greetings, userName, currentStore, aiName])

  // Send message function
  const sendMessage = useCallback(async (message, isUserInitiated = true) => {
    // Add user message to chat
    if (isUserInitiated) {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
    }

    // Show typing indicator
    setIsTyping(true)

    try {
      // First, check if this is a special case (name introduction or real-time data query)
      const smartResponse = await generateSmartResponse(message)
      
      let botResponse
      
      if (smartResponse) {
        // Use local response for special cases
        botResponse = {
          message: smartResponse.message,
          suggestions: smartResponse.suggestions || []
        }
      } else {
        // Use Groq AI for everything else
        const chatMessages = [
          ...messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.message
          })),
          { role: 'user', content: message }
        ]
        
        const aiResponse = await getGroqResponse(chatMessages)
        botResponse = {
          message: aiResponse,
          suggestions: []
        }
      }
      
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Add AI response to chat
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: botResponse.message,
        timestamp: new Date(),
        suggestions: botResponse.suggestions
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error generating AI response:', error)
      
      // Fallback to local response if Groq fails
      try {
        const fallbackResponse = await generateSmartResponse(message)
        if (fallbackResponse) {
          const errorMessage = {
            id: Date.now() + 1,
            type: 'bot',
            message: `Saya mengalami kendala teknis. Berikut saran saya:\n\n${fallbackResponse.message}`,
            timestamp: new Date(),
            suggestions: fallbackResponse.suggestions || ['Coba lagi', 'Kembali ke menu utama']
          }
          setMessages(prev => [...prev, errorMessage])
        } else {
          const errorMessage = {
            id: Date.now() + 1,
            type: 'bot',
            message: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi nanti.',
            timestamp: new Date(),
            suggestions: ['Coba lagi', 'Kembali ke menu utama']
          }
          setMessages(prev => [...prev, errorMessage])
        }
      } catch (fallbackError) {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          message: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi nanti.',
          timestamp: new Date(),
          suggestions: ['Coba lagi', 'Kembali ke menu utama']
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsTyping(false)
    }
  }, [generateSmartResponse, messages])

  // Quick action handlers
  const handleQuickAction = useCallback((action) => {
    const quickActions = {
      'Analisis penjualan hari ini': 'Bagaimana penjualan hari ini?',
      'Cek stok produk': 'Cek stok yang habis',
      'Lihat tren bisnis': 'Analisis tren minggu ini',
      'Tips meningkatkan profit': 'Berikan rekomendasi untuk meningkatkan profit',
      'Penjualan hari ini': 'Bagaimana penjualan hari ini?',
      'Produk terlaris': 'Produk apa yang paling laris?',
      'Stok yang habis': 'Produk mana yang stoknya habis?',
      'Rekomendasi bisnis': 'Berikan rekomendasi bisnis untuk hari ini'
    }

    const message = quickActions[action] || action
    sendMessage(message)
  }, [sendMessage])

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        message: `Oke, chat udah dibersihkan! Saya ${aiName} siap bantu ${currentStore?.ownerName || 'Anda'} mengelola ${currentStore?.storeName || 'toko'} lagi. Mau tanya apa?`,
        timestamp: new Date(),
        suggestions: ['Gimana jualan hari ini?', 'Cek stok barang', 'Lihat tren jualan', 'Kasih saran dong']
      }
    ])
  }, [currentStore, aiName])

  const value = {
    messages,
    isTyping,
    sendMessage,
    handleQuickAction,
    clearChat,
    userName,
    currentStore
  }

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  )
}
