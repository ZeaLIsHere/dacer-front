import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  Trash2,
  ArrowLeft
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useChatbot } from '../contexts/ChatbotContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import SubscriptionGate from '../components/SubscriptionGate'
import SubscriptionModal from '../components/SubscriptionModal'

export default function ChatbotPage () {
  const navigate = useNavigate()
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    handleQuickAction,
    clearChat 
  } = useChatbot()
  const { isFeatureAvailable: _isFeatureAvailable } = useSubscription()
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage)
      setInputMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessage = (message) => {
    return message
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('•')) {
          return (
            <div key={index} className="ml-4 mb-1 flex items-start">
              <span className="text-[#3B72FF] mr-2">•</span>
              <span>{line.substring(1).trim()}</span>
            </div>
          )
        }
        if (line.trim() === '') {
          return <div key={index} className="mb-2"></div>
        }
        return (
          <div key={index} className="mb-1">
            {line}
          </div>
        )
      })
  }

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      {/* Header */}
      <div
        className="text-white p-4 shadow-lg mb-4 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #3B72FF, #2563EB)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="relative">
              <Bot size={28} />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ backgroundColor: '#60A5FA' }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">Agam AI</h1>
              <p className="text-sm opacity-90">Asisten Bisnis Pintar Anda</p>
            </div>
          </div>
          
          <button
            onClick={clearChat}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Subscription Gate */}
      <SubscriptionGate
        feature="ai_chatbot"
        title="AI Chatbot Premium"
        description="Akses penuh ke AI Assistant untuk strategi bisnis, analisis data, dan rekomendasi personal."
        onUpgrade={() => setShowSubscriptionModal(true)}
      >
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-center mb-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{
                      backgroundColor: msg.type === 'user' ? '#2563EB' : '#3B72FF'
                    }}
                  >
                    {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <span className="text-xs ml-2 text-[#6B7280]">
                    {msg.timestamp.toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <div
                  className={`p-4 rounded-2xl shadow-sm ${
                    msg.type === 'user'
                      ? 'text-white ml-10'
                      : 'mr-10 border'
                  }`}
                  style={{
                    backgroundColor: msg.type === 'user' ? '#2563EB' : '#FFFFFF',
                    color: msg.type === 'user' ? 'white' : '#1F2937',
                    borderColor: msg.type === 'bot' ? '#E5E7EB' : 'transparent'
                  }}
                >
                  <div className="text-sm leading-relaxed">
                    {msg.type === 'bot' ? formatMessage(msg.message) : msg.message}
                  </div>
                </div>

                {msg.type === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 mr-10">
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleQuickAction(suggestion)}
                          className="px-3 py-2 border rounded-full text-xs hover:opacity-80 transition-colors flex items-center space-x-1 shadow-sm"
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E5E7EB',
                            color: '#1F2937'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = '#3B72FF'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = '#E5E7EB'
                          }}
                        >
                          {suggestion.includes('penjualan') && <TrendingUp size={12} />}
                          {suggestion.includes('stok') && <Package size={12} />}
                          {suggestion.includes('profit') && <DollarSign size={12} />}
                          {suggestion.includes('analisis') && <BarChart3 size={12} />}
                          <span>{suggestion}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#3B72FF]">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="p-4 rounded-2xl border shadow-sm bg-white border-[#E5E7EB]">
                  <div className="flex space-x-1">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay }}
                        className="w-2 h-2 rounded-full bg-[#9CA3AF]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 shadow-lg bg-white border-[#E5E7EB]">
          {/* Quick Actions */}
          <div className="mb-4 flex flex-wrap gap-2">
            {['Jualan', 'Stok', 'Tren', 'Saran'].map((action, index) => (
              <motion.button
                key={action}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  const actionMap = {
                    'Jualan': 'Jualan hari ini gimana?',
                    'Stok': 'Barang apa yang habis?',
                    'Tren': 'Gimana tren jualan?',
                    'Saran': 'Kasih saran dong'
                  }
                  handleQuickAction(actionMap[action])
                }}
                className="px-4 py-2 rounded-full text-sm hover:opacity-80 transition-colors flex items-center space-x-2"
                style={{
                  backgroundColor: '#E5E7EB',
                  color: '#1F2937'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#3B72FF'
                  e.target.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#E5E7EB'
                  e.target.style.color = '#1F2937'
                }}
              >
                {action === 'Jualan' && <TrendingUp size={14} />}
                {action === 'Stok' && <Package size={14} />}
                {action === 'Tren' && <BarChart3 size={14} />}
                {action === 'Saran' && <DollarSign size={14} />}
                <span>{action}</span>
              </motion.button>
            ))}
          </div>

          {/* Input Field */}
          <div className="flex items-center space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tanya apa aja tentang toko Anda..."
              className="flex-1 p-4 border rounded-2xl focus:outline-none text-sm"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                color: '#1F2937'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3B72FF'
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 114, 255, 0.2)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
              disabled={isTyping}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!inputMessage.trim() || isTyping}
              className="p-4 rounded-2xl text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: inputMessage.trim() && !isTyping ? '#3B72FF' : '#E5E7EB'
              }}
            >
              <Send size={20} />
            </motion.button>
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-[#6B7280]">
              Agam AI siap bantu - Tanya tentang jualan, stok, tren, atau minta saran
            </p>
          </div>
        </div>
      </SubscriptionGate>

      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  )
}
