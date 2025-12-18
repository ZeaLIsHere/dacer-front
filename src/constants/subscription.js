// Subscription plans
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Bulanan',
    price: 49000, // Rp 49,000
    priceDisplay: 'Rp 49.000',
    duration: '1 bulan',
    features: [
      'Akses penuh AI Chatbot',
      'Insight mingguan otomatis',
      'Analisis bisnis mendalam',
      'Strategi penjualan personal',
      'Support prioritas'
    ],
    popular: false
  },
  yearly: {
    id: 'yearly',
    name: 'Tahunan',
    price: 490000, // Rp 490,000 (2 bulan gratis)
    priceDisplay: 'Rp 490.000',
    originalPrice: 588000, // Rp 588,000
    originalPriceDisplay: 'Rp 588.000',
    duration: '12 bulan',
    features: [
      'Akses penuh AI Chatbot',
      'Insight mingguan otomatis',
      'Analisis bisnis mendalam',
      'Strategi penjualan personal',
      'Support prioritas',
      '2 bulan GRATIS',
      'Analisis prediktif',
      'Laporan bulanan eksklusif'
    ],
    popular: true,
    savings: 98000 // Rp 98,000
  }
}
