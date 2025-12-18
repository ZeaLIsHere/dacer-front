import React from 'react'
import { motion } from 'framer-motion'
import { Crown, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'

const SubscriptionStatus = ({ onUpgrade }) => {
  const { getSubscriptionInfo, isFeatureAvailable } = useSubscription()
  const subscriptionInfo = getSubscriptionInfo()

  const getStatusIcon = () => {
    if (subscriptionInfo.isActive) {
      return <CheckCircle className="w-6 h-6 text-green-500" />
    } else if (subscriptionInfo.status === 'expired') {
      return <Clock className="w-6 h-6 text-orange-500" />
    } else {
      return <AlertCircle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    if (subscriptionInfo.isActive) {
      return 'bg-green-50 border-green-200 text-green-800'
    } else if (subscriptionInfo.status === 'expired') {
      return 'bg-orange-50 border-orange-200 text-orange-800'
    } else {
      return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getStatusText = () => {
    if (subscriptionInfo.isActive) {
      return `Aktif - ${subscriptionInfo.daysRemaining} hari tersisa`
    } else if (subscriptionInfo.status === 'expired') {
      return 'Kadaluarsa - Perpanjang untuk melanjutkan'
    } else {
      return 'Belum berlangganan'
    }
  }

  const features = [
    {
      name: 'AI Chatbot',
      description: 'Asisten AI untuk strategi bisnis',
      available: isFeatureAvailable('ai_chatbot')
    },
    {
      name: 'Insight Mingguan',
      description: 'Analisis otomatis performa bisnis',
      available: isFeatureAvailable('weekly_insights')
    },
    {
      name: 'Analisis Bisnis',
      description: 'Laporan mendalam tentang bisnis Anda',
      available: isFeatureAvailable('business_analysis')
    },
    {
      name: 'Strategi Penjualan',
      description: 'Rekomendasi strategi personal',
      available: isFeatureAvailable('sales_strategy')
    },
    {
      name: 'Analisis Prediktif',
      description: 'Prediksi tren dan peluang (Tahunan)',
      available: isFeatureAvailable('predictive_analysis')
    },
    {
      name: 'Laporan Bulanan',
      description: 'Laporan eksklusif bulanan (Tahunan)',
      available: isFeatureAvailable('monthly_reports')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border-2 p-6 ${getStatusColor()}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Status Berlangganan</h3>
              <p className="text-sm opacity-80">{subscriptionInfo.planName}</p>
            </div>
          </div>
          {getStatusIcon()}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{getStatusText()}</p>
            {subscriptionInfo.isActive && (
              <p className="text-sm opacity-80 mt-1">
                Berakhir pada {new Date(subscriptionInfo.endDate).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>
          {!subscriptionInfo.isActive && (
            <button
              onClick={onUpgrade}
              className="btn-primary flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Upgrade</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Features List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Fitur Premium</h4>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-xl ${
                feature.available
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  feature.available
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className={`font-medium ${
                    feature.available ? 'text-green-800' : 'text-gray-600'
                  }`}>
                    {feature.name}
                  </p>
                  <p className={`text-sm ${
                    feature.available ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {feature.description}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                feature.available
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {feature.available ? 'Aktif' : 'Tidak tersedia'}
              </div>
            </motion.div>
          ))}
        </div>

        {!subscriptionInfo.isActive && (
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-primary">Upgrade untuk akses penuh</p>
                <p className="text-sm text-primary/80">
                  Dapatkan akses ke semua fitur AI untuk mengembangkan bisnis Anda
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      {subscriptionInfo.isActive && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Statistik Penggunaan</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(Math.random() * 50) + 20}
              </div>
              <div className="text-sm text-blue-600">Chat AI Bulan Ini</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(Math.random() * 10) + 5}
              </div>
              <div className="text-sm text-green-600">Insight Dihasilkan</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionStatus
