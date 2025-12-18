import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useStore } from './StoreContext'
import { getGroqResponse } from '../services/groqService'

const ChatbotContext = createContext()

export function useChatbot () {
  const context = useContext(ChatbotContext)
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider')
  }
  return context
}

export function ChatbotProvider ({ children }) {
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

  // Smart Response Generator - Minimal local handling, let Groq AI handle most queries
  const generateSmartResponse = useCallback(async (userMessage) => {
    const message = userMessage.toLowerCase()
    
    // Only handle greetings locally, everything else goes to Groq AI
    const greetings = ['halo', 'hai', 'hello', 'hi', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam']
    const isGreeting = greetings.some(greeting => {
      const words = message.split(' ')
      return words.includes(greeting) || message.startsWith(greeting)
    })
    
    if (isGreeting && message.split(' ').length <= 3) {
      return {
        message: `Halo ${userName || currentStore?.ownerName || 'Teman'}! Senang bisa membantu ${currentStore?.storeName || 'toko Anda'} hari ini. Ada yang bisa saya bantu?`,
        suggestions: ['Bagaimana cara meningkatkan penjualan?', 'Tips marketing yang efektif', 'Strategi pricing produk', 'Cara mengelola stok']
      }
    }
    
    // Return null to let Groq AI handle everything else
    return null
  }, [userName, currentStore?.ownerName, currentStore?.storeName])

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
