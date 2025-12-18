/**
 * Format harga ke format Rupiah tanpa desimal
 * @param {number} amount - Jumlah uang
 * @returns {string} Harga yang sudah diformat (contoh: "Rp 12.000")
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0'
  }
  
  return `Rp ${Number(amount).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`
}

/**
 * Format harga ke format Rupiah dengan desimal (jika diperlukan)
 * @param {number} amount - Jumlah uang
 * @returns {string} Harga yang sudah diformat (contoh: "Rp 12.000,00")
 */
export const formatCurrencyWithDecimal = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0,00'
  }
  
  return `Rp ${Number(amount).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
