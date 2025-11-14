import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  BarChart2,
  PieChart,
  Lightbulb
} from 'lucide-react'
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function Statistics () {
  const [showInsight, setShowInsight] = useState(false)

  const data = [
    { name: 'Produk A', value: 400 },
    { name: 'Produk B', value: 300 },
    { name: 'Produk C', value: 300 },
    { name: 'Produk D', value: 200 }
  ]

  const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']

  const cards = [
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      title: 'Penjualan Bulanan',
      value: 'Rp 12.500.000',
      growth: '+12%'
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-blue-600" />,
      title: 'Total Transaksi',
      value: '356',
      growth: '+8%'
    },
    {
      icon: <Users className="w-5 h-5 text-blue-600" />,
      title: 'Pelanggan Baru',
      value: '124',
      growth: '+5%'
    },
    {
      icon: <DollarSign className="w-5 h-5 text-blue-600" />,
      title: 'Rata-rata Pembelian',
      value: 'Rp 350.000',
      growth: '+3%'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Statistik Penjualan</h1>
        <p className="text-gray-600">Pantau kinerja bisnismu dengan data terkini</p>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-5 rounded-xl shadow-md bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <h4 className="font-semibold text-blue-700">{card.title}</h4>
                <p className="text-xl font-bold text-blue-800">{card.value}</p>
              </div>
            </div>
            <p className="text-sm text-blue-600">{card.growth} dari bulan lalu</p>
          </motion.div>
        ))}
      </div>

      {/* Grafik Penjualan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h3 className="text-lg font-bold text-blue-700 mb-4 flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-blue-600" />
          Grafik Distribusi Produk
        </h3>
        <div className="h-64">
          <ResponsiveContainer>
            <RePieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#3B82F6"
                dataKey="value"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* AI Insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5"
      >
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-6 h-6 text-blue-600" />
          <div>
            <h4 className="font-semibold text-blue-700">Insight AI</h4>
            <p className="text-sm text-blue-600">
              Dapatkan rekomendasi strategi dari AI berdasarkan data penjualanmu
            </p>
          </div>
        </div>
        <div className="mt-3 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowInsight(true)}
            className="mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow"
          >
            Lihat Insight
          </motion.button>
        </div>
      </motion.div>

      {/* Modal Insight */}
      {showInsight && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-blue-700 mb-2 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-blue-600" /> Insight Penjualan
            </h3>
            <p className="text-gray-700 mb-4">
              Berdasarkan tren bulan ini, produk <strong>Produk A</strong> menunjukkan peningkatan
              penjualan tertinggi. Coba tingkatkan stok dan promosinya untuk hasil optimal!
            </p>
            <button
              onClick={() => setShowInsight(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Tutup
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
