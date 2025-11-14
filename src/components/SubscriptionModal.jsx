import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Crown, Star, CreditCard, Gift } from "lucide-react";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useToast } from "../contexts/ToastContext";

const SubscriptionModal = ({ isOpen, onClose }) => {
  const { subscribe, getSubscriptionInfo, plans } = useSubscription();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [showPayment, setShowPayment] = useState(false);

  const subscriptionInfo = getSubscriptionInfo();

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      await subscribe(planId, "credit_card");
      showSuccess("Berlangganan berhasil! Selamat menikmati fitur premium.");
      onClose();
    } catch (error) {
      showError("Gagal berlangganan. Silakan coba lagi.");
      console.error("Subscription error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await handleSubscribe(selectedPlan);
    } catch (error) {
      showError("Pembayaran gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
      setShowPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-light p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Upgrade ke Premium</h2>
                  <p className="text-white/90">
                    Akses penuh fitur AI untuk bisnis Anda
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {subscriptionInfo.isActive ? (
              // Active Subscription Info
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Anda sudah berlangganan!
                </h3>
                <p className="text-gray-600 mb-4">
                  Paket {subscriptionInfo.planName} aktif
                </p>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 inline-block">
                  <p className="text-green-800 font-medium">
                    {subscriptionInfo.daysRemaining} hari tersisa
                  </p>
                </div>
              </div>
            ) : showPayment ? (
              // Payment Confirmation
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Konfirmasi Pembayaran
                </h3>
                <p className="text-gray-600 mb-6">
                  Klik "Bayar" untuk melanjutkan proses berlangganan.
                </p>

                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    Detail Pembayaran
                  </h4>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span>Paket {plans[selectedPlan].name}</span>
                      <span className="font-semibold">
                        {plans[selectedPlan].priceDisplay}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Durasi</span>
                      <span>{plans[selectedPlan].duration}</span>
                    </div>
                    {plans[selectedPlan].savings && (
                      <div className="flex justify-between text-green-600">
                        <span>Anda hemat</span>
                        <span className="font-semibold">
                          Rp {plans[selectedPlan].savings.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="loading-spinner w-5 h-5" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                    <span>{loading ? "Memproses..." : "Bayar Sekarang"}</span>
                  </button>
                </div>
              </div>
            ) : (
              // Plan Selection
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Pilih Paket Berlangganan
                  </h3>
                  <p className="text-gray-600">
                    Dapatkan akses penuh ke fitur AI untuk mengembangkan bisnis
                    Anda
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {Object.values(plans).map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                      } ${plan.popular ? "ring-2 ring-primary/20" : ""}`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>Paling Populer</span>
                          </div>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h4 className="text-xl font-bold text-gray-800 mb-2">
                          {plan.name}
                        </h4>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-primary">
                            {plan.priceDisplay}
                          </span>
                          {plan.originalPrice && (
                            <span className="text-lg text-gray-500 line-through ml-2">
                              {plan.originalPriceDisplay}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{plan.duration}</p>
                        {plan.savings && (
                          <div className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mt-2">
                            <Gift className="w-4 h-4" />
                            <span>
                              Hemat Rp {plan.savings.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                          selectedPlan === plan.id
                            ? "bg-primary text-white hover:bg-primary-dark"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {selectedPlan === plan.id ? "Terpilih" : "Pilih Paket"}
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowPayment(true)}
                    className="btn-primary text-lg px-8 py-4"
                  >
                    Lanjutkan ke Pembayaran
                  </button>
                  <p className="text-gray-500 text-sm mt-4">
                    * Pembayaran akan diproses secara otomatis setelah
                    konfirmasi.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionModal;
