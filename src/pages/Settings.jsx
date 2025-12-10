import React, { useState } from "react"
import { motion } from "framer-motion"
import CreateStoreModal from "../components/CreateStoreModal"
import SubscriptionModal from "../components/SubscriptionModal"
import SubscriptionStatus from "../components/SubscriptionStatus"
import { useStore } from "../contexts/StoreContext"
import {
  Settings as SettingsIcon,
  Smartphone,
  Plus,
  ChevronRight,
  Store,
  Crown
} from "lucide-react"

export default function Settings () {
  // Language selection removed — settings page is now focused on subscription status
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const getText = (id) => id
  const { currentStore } = useStore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-secondary mb-2">
          {getText("Status Langganan", "Subscription Status")}
        </h1>
        <p className="text-gray-600">
          {getText(
            "Kelola status dan opsi berlangganan Anda",
            "Manage your subscription status and options"
          )}
        </p>
      </div>

      {/* Subscription Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-secondary">
              {getText("Berlangganan Premium", "Premium Subscription")}
            </h3>
            <p className="text-sm text-gray-600">
              {getText(
                "Akses penuh fitur AI untuk bisnis Anda",
                "Full access to AI features for your business"
              )}
            </p>
          </div>
        </div>

        <SubscriptionStatus onUpgrade={() => setShowSubscriptionModal(true)} />
      </motion.div>

      {/* Store Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-secondary">
              {getText("Manajemen Toko", "Store Management")}
            </h3>
            <p className="text-sm text-gray-600">
              {getText(
                "Kelola beberapa toko dalam satu akun",
                "Manage multiple stores in one account"
              )}
            </p>
          </div>
        </div>

        {/* Create New Store */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateStoreModal(true)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">
                {getText("Buat Toko Baru", "Create New Store")}
              </p>
              <p className="text-sm opacity-90">
                {getText(
                  "Tambah toko untuk bisnis yang berbeda",
                  "Add store for different business"
                )}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        {/* Current Store Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-secondary">
                {getText("Toko Saat Ini", "Current Store")}
              </p>
              <p className="text-sm text-gray-600">
                {currentStore?.store_name || currentStore?.name || getText("Belum ada toko aktif", "No active store")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card bg-gray-50"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold text-blue-700">DagangCerdas</h4>
          <p className="text-sm text-gray-600">
            {getText("Versi 1.0.0", "Version 1.0.0")}
          </p>
          <p className="text-xs text-gray-500">
            {getText(
              "Aplikasi kasir pintar untuk bisnis Anda",
              "Smart cashier app for your business"
            )}
          </p>
        </div>
      </motion.div>

      {/* Settings Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card bg-blue-50 border-blue-200"
      >
        <div className="flex items-start space-x-3">
          <SettingsIcon className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              {getText("Catatan Status Langganan", "Subscription Note")}
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                •{" "}
                {getText(
                  "Pengaturan akan disimpan secara lokal di perangkat Anda",
                  "Settings will be saved locally on your device"
                )}
              </li>
              <li>
                •{" "}
                {getText(
                  "Setiap toko memiliki data terpisah dan dapat dikelola secara independen",
                  "Each store has separate data and can be managed independently"
                )}
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Create Store Modal */}
      <CreateStoreModal
        isOpen={showCreateStoreModal}
        onClose={() => setShowCreateStoreModal(false)}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  )
}
