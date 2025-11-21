import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, AlertCircle } from "lucide-react"; // Menambahkan AlertCircle
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useToast } from "../contexts/ToastContext";

export default function PromotionModal({
  isOpen,
  onClose,
  highStockProducts = [],
  popularProducts = [],
  currentUser,
  initialPromotion = null,
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [type, setType] = useState("discount"); // 'discount' or 'bundle'
  const [discountPercent, setDiscountPercent] = useState(20);
  const [bundleProductId, setBundleProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  // Filter produk populer untuk memastikan produk utama tidak menjadi produk pendamping
  const filteredPopularProducts = popularProducts.filter(
    (p) => p.id !== selectedProductId,
  );

  // LOGIKA TAMBAHAN: Tentukan daftar produk yang akan ditampilkan.
  // Jika produk yang difilter kosong, gunakan semua produk populer
  // dan tampilkan peringatan.
  const productsToDisplay = filteredPopularProducts.length > 0
    ? filteredPopularProducts
    : popularProducts;

  useEffect(() => {
    if (isOpen && highStockProducts.length > 0) {
      setSelectedProductId(initialPromotion?.productId || highStockProducts[0].id);
    }
    // Jika mengedit promosi yang sudah ada, isi bidang
    if (initialPromotion) {
      // Menggunakan initialPromotion.productId jika ada, jika tidak gunakan produk dengan stok tinggi pertama
      setSelectedProductId(initialPromotion.productId || highStockProducts[0]?.id || "");
      setType(initialPromotion.type || "discount");
      setDiscountPercent(initialPromotion.discountPercent || 20);
      setBundleProductId(initialPromotion.bundleWith || "");
    } else {
      // Reset state saat modal dibuka tanpa data awal
      setType("discount");
      setDiscountPercent(20);
      setBundleProductId("");
    }
  }, [isOpen, highStockProducts, initialPromotion]);

  // Setel ulang bundleProductId jika selectedProductId berubah
  useEffect(() => {
    if (selectedProductId) {
      // Periksa apakah bundleProductId saat ini masih valid (bukan produk utama)
      if (bundleProductId === selectedProductId) {
        setBundleProductId(""); // Reset jika sama
      }
      // Jika produk yang difilter kosong, coba set bundleProductId ke produk pertama di daftar penuh.
      // Jika daftar yang difilter (filteredPopularProducts) kosong, bundleProductId harus di-reset,
      // karena tidak ada pilihan valid.
      if (type === "bundle" && filteredPopularProducts.length === 0) {
          // Tidak perlu melakukan apa-apa di sini, tapi kita harus pastikan
          // tidak memilih produk yang sama dengan produk utama
          setBundleProductId("");
      }
    }
  }, [selectedProductId, type]);


  const handleSubmit = async () => {
    // ... (Logika handleSubmit tetap sama)
    setLoading(true);

    if (type === "bundle" && !bundleProductId) {
      showError("Mohon pilih produk pendamping untuk promosi bundle.");
      setLoading(false);
      return;
    }
    
    // ... sisa logika handleSubmit
    
    // START: HANYA UNTUK SIMULASI/LOGIKA LAMA
    const promotionData = {
      productId: selectedProductId,
      type,
      discountPercent: type === "discount" ? discountPercent : null,
      bundleWith: type === "bundle" ? bundleProductId : null,
      timestamp: serverTimestamp(),
      userId: currentUser.uid,
    };

    try {
      if (initialPromotion) {
        // Update existing promotion
        await updateDoc(
          doc(db, "promotions", initialPromotion.id),
          promotionData,
        );
        showSuccess("Promosi berhasil diperbarui!");
      } else {
        // Create new promotion
        await addDoc(collection(db, "promotions"), promotionData);
        showSuccess("Promosi baru berhasil dibuat!");
      }
      onClose();
    } catch (e) {
      console.error("Error creating/updating promotion: ", e);
      showError("Gagal menyimpan promosi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
    // END: HANYA UNTUK SIMULASI/LOGIKA LAMA
  };

  if (!isOpen) return null;

  return (
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
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            {initialPromotion ? "Edit Promosi" : "Buat Promosi Baru"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Pilih Produk Utama */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produk Utama (Stok Tinggi)
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="input-field"
              disabled={highStockProducts.length === 0}
            >
              {highStockProducts.length === 0 ? (
                <option value="">Tidak ada produk stok tinggi</option>
              ) : (
                highStockProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} (Stok: {p.stok} {p.satuan})
                  </option>
                ))
              )}
            </select>
            {highStockProducts.length === 0 && (
              <p className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                <AlertCircle size={14} /><span>Tambahkan produk dengan stok &gt; 10 untuk promosi.</span>
              </p>
            )}
          </div>

          {/* Pilih Tipe Promosi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Promosi
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setType("discount")}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  type === "discount"
                    ? "bg-secondary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Diskon Harga
              </button>
              <button
                onClick={() => setType("bundle")}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  type === "bundle"
                    ? "bg-secondary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Paket (Bundle)
              </button>
            </div>
          </div>

          {/* Pengaturan Tipe Promosi */}
          {type === "discount" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persentase Diskon
              </label>
              <input
                type="number"
                min="5"
                max="90"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.max(5, Math.min(90, parseInt(e.target.value) || 0)))}
                className="input-field"
                placeholder="Contoh: 20"
              />
              <p className="text-xs text-gray-500 mt-1">
                Diskon yang akan diterapkan pada harga produk utama.
              </p>
            </div>
          )}

          {type === "bundle" && (
            <div className="mb-6 space-y-4">
              {/* Opsi Produk Pendamping */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Produk Pendamping
                </label>
                <select
                  value={bundleProductId}
                  onChange={(e) => setBundleProductId(e.target.value)}
                  className="input-field"
                  disabled={productsToDisplay.length === 0}
                >
                  <option value="">-- Pilih produk pendamping --</option>
                  {productsToDisplay.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} (Stok: {p.stok} {p.satuan})
                    </option>
                  ))}
                </select>

                {/* PESAN KESALAHAN/PERINGATAN JIKA PRODUK YANG DIFILTER KOSONG */}
                {filteredPopularProducts.length === 0 && popularProducts.length > 0 && (
                  <div className="flex items-center space-x-2 p-2 mt-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle size={16} className="text-yellow-600" />
                    <p className="text-xs text-yellow-700">
                      **Perhatian:** Produk utama tidak dapat menjadi produk pendamping. Anda melihat daftar lengkap produk. Jika memilih produk yang sama dengan produk utama, promosi bundle tidak akan dibuat.
                    </p>
                  </div>
                )}
                {popularProducts.length === 0 && (
                   <p className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                     <AlertCircle size={14} /><span>Tidak ada produk populer yang tersedia untuk bundle.</span>
                   </p>
                )}
              </div>

              {/* Preview Bundle */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  Preview Promosi Paket:
                </p>
                <div className="flex justify-center text-center">
                  {/* Produk Utama */}
                  <div className={`p-3 rounded-lg shadow-sm ${bundleProductId ? 'bg-white' : 'bg-blue-100'}`}>
                    <p className="font-bold text-gray-800">
                      {
                        highStockProducts.find(
                          (p) => p.id === selectedProductId,
                        )?.nama
                      }
                    </p>
                  </div>
                  
                  {/* Tanda Plus */}
                  <div className="flex items-center justify-center px-2">
                    <span className="text-2xl font-bold text-blue-600">+</span>
                  </div>

                  {/* Produk Pendamping */}
                  <div className={`p-3 rounded-lg shadow-sm ${bundleProductId ? 'bg-primary-light text-white' : 'bg-blue-100 text-gray-600'}`}>
                    <p className="font-bold">
                      {bundleProductId
                        ? productsToDisplay.find(
                            (p) => p.id === bundleProductId,
                          )?.nama || 'Memuat...'
                        : "Pilih Produk"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Umum */}
          {type === "discount" && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm font-semibold text-green-800">
                Preview Diskon:
              </p>
              <p className="text-lg font-bold text-green-700">
                Produk{" "}
                <span className="underline">
                  {
                    highStockProducts.find((p) => p.id === selectedProductId)
                      ?.nama
                  }
                </span>{" "}
                diskon <span className="text-2xl">{discountPercent}%</span>!
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                highStockProducts.length === 0 ||
                (type === "bundle" && !bundleProductId)
              }
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading
                ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Menyimpan...</span>
                    </div>
                  )
                : initialPromotion
                  ? "Update Promosi"
                  : "Buat Promosi"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}