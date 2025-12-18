import React from 'react'
import { motion } from 'framer-motion'
import { Crown, Zap, Star } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'

const SubscriptionGate = ({ 
  children, 
  feature, 
  title = "Fitur Premium", 
  description = "Fitur ini hanya tersedia untuk pengguna berlangganan",
  onUpgrade 
}) => {
  const { isFeatureAvailable } = useSubscription()

  if (isFeatureAvailable(feature)) {
    return children
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      {/* Blurred Content */}
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 max-w-md"
        >
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {description}
          </p>

          {/* Features Preview */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-gray-800">Fitur Premium</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Akses penuh AI Chatbot</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Insight mingguan otomatis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Analisis bisnis mendalam</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onUpgrade}
            className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 mx-auto"
          >
            <Zap className="w-5 h-5" />
            <span>Upgrade Sekarang</span>
          </button>

          {/* Pricing Hint */}
          <p className="text-sm text-gray-500 mt-4">
            Mulai dari <span className="font-semibold text-primary">Rp 49.000/bulan</span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default SubscriptionGate
