import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Calendar, CheckCircle, AlertCircle, CreditCard } from 'lucide-react'
import debtService from '../services/debtService'

export default function DebtPaymentModal ({ isOpen, onClose, debt, onSuccess }) {
  const [paymentAmount, setPaymentAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('tunai')

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    setPaymentAmount(value)
    if (error) setError('')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const amount = parseInt(paymentAmount)
    if (!amount || amount <= 0) {
      setError('Jumlah pembayaran harus lebih dari 0')
      return
    }

    const remainingAmount = debt?.remainingAmount || (debt?.totalAmount - (debt?.paidAmount || 0)) || 0
    if (amount > remainingAmount) {
      setError(`Pembayaran tidak boleh melebihi sisa hutang (${formatCurrency(remainingAmount)})`)
      return
    }

    setLoading(true)
    setError('')

    try {
      if (paymentMethod === 'qris') {
        if (!window.snap) {
          throw new Error('Layanan pembayaran tidak tersedia')
        }

        const snapToken = await debtService.createQRISPayment(debt?.id, amount)
        
        window.snap.pay(snapToken, {
          onSuccess: async (result) => {
            await debtService.updateDebtPayment(debt?.id, amount, 'qris', result)
            setSuccess(true)
            onSuccess?.()
            setTimeout(() => {
              onClose()
            }, 2000)
          },
          onPending: async (result) => {
            await debtService.updateDebtPayment(debt?.id, amount, 'qris', result)
            setSuccess(true)
            onSuccess?.()
            setTimeout(() => {
              onClose()
            }, 2000)
          },
          onError: (result) => {
            setError('Pembayaran gagal. Silakan coba lagi.')
            setLoading(false)
          },
          onClose: () => {
            setLoading(false)
          }
        })
      } else {
        // Cash payment
        await debtService.updateDebtPayment(debt?.id, amount, 'tunai')
        setSuccess(true)
        onSuccess?.()
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const paymentAmountNum = parseInt(paymentAmount) || 0
  const remainingAmount = debt?.remainingAmount || (debt?.totalAmount - (debt?.paidAmount || 0)) || 0
  const newRemainingAmount = remainingAmount - paymentAmountNum
  const willBeFullyPaid = paymentAmountNum >= remainingAmount

  if (!debt || !isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Pembayaran Hutang ✨</h2>
                      <p className="text-sm text-white/80">Lunasi hutang dengan mudah</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h3>
                    <p className="text-gray-600">
                      {willBeFullyPaid ? 'Hutang telah lunas' : `Sisa hutang: ${formatCurrency(newRemainingAmount)}`}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    {/* Debt Summary Card */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Hutang</span>
                          <span className="text-sm font-bold text-gray-800">{formatCurrency(debt?.totalAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sudah Dibayar</span>
                          <span className="text-sm font-bold text-green-600">{formatCurrency(debt?.paidAmount || 0)}</span>
                        </div>
                        <div className="h-px bg-gray-300 my-2"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Sisa Hutang</span>
                          <span className="text-lg font-bold text-blue-600">{formatCurrency(remainingAmount)}</span>
                        </div>
                        {debt?.dueDate && (
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-xs text-gray-500">Jatuh Tempo</span>
                            <span className="text-xs text-gray-500">
                              {new Date(debt.dueDate?.toDate ? debt.dueDate.toDate() : debt.dueDate).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700">Metode Pembayaran</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('tunai')}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            paymentMethod === 'tunai' 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <DollarSign className={`w-5 h-5 ${paymentMethod === 'tunai' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium">Tunai</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('qris')}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            paymentMethod === 'qris' 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <CreditCard className={`w-5 h-5 ${paymentMethod === 'qris' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium">QRIS</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Payment Amount Input */}
                    {paymentMethod === 'tunai' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Jumlah Pembayaran
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                          <input
                            type="text"
                            value={paymentAmount ? formatCurrency(paymentAmountNum).replace('Rp', '').replace(/\s/g, '') : ''}
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-lg font-bold"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    )}

                    {/* QRIS Amount Display */}
                    {paymentMethod === 'qris' && (
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">{formatCurrency(paymentAmountNum || 0)}</p>
                          <p className="text-xs text-blue-500">Akan dibayar melalui QRIS</p>
                        </div>
                      </div>
                    )}

                    {/* Payment Preview */}
                    {paymentAmountNum > 0 && (
                      <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Jumlah Bayar</span>
                            <span className="text-sm font-bold text-green-600">{formatCurrency(paymentAmountNum)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-green-100">
                            <span className="text-sm font-semibold text-gray-700">Sisa Hutang</span>
                            <span className={`text-sm font-bold ${willBeFullyPaid ? 'text-green-600' : 'text-orange-500'}`}>
                              {willBeFullyPaid ? 'LUNAS ✓' : formatCurrency(newRemainingAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="submit"
                        disabled={loading || !paymentAmountNum}
                        className={`w-full py-3 px-4 rounded-xl text-base font-semibold text-white transition-colors ${
                          loading || !paymentAmountNum
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Memproses...</span>
                          </div>
                        ) : (
                          paymentMethod === 'qris' ? 'Bayar dengan QRIS' : 'Bayar Tunai Sekarang'
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="w-full py-3 px-4 border border-gray-200 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
