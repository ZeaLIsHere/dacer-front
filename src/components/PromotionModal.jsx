import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
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

  useEffect(() => {
    if (isOpen && highStockProducts.length > 0) {
      setSelectedProductId(highStockProducts[0].id);
    }
    // If editing an existing promotion, prefill fields
    if (initialPromotion) {
      setSelectedProductId(initialPromotion.productId || "");
      setType(initialPromotion.type || "discount");
      setDiscountPercent(initialPromotion.discountPercent || 20);
      setBundleProductId(initialPromotion.bundleWith || "");
    }
  }, [isOpen, highStockProducts, initialPromotion]);

  const { showSuccess, showError, showWarning } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validation
    if (!selectedProductId)
      return showWarning("Pilih produk untuk dipromosikan");
    if (type === "bundle" && !bundleProductId)
      return showWarning("Pilih produk untuk dibundling");
    if (type === "discount" && (discountPercent <= 0 || discountPercent > 80)) {
      return showWarning("Persentase diskon harus antara 1% dan 80%");
    }

    setLoading(true);

    try {
      let ref;
      const now = serverTimestamp();

      if (initialPromotion && initialPromotion.id) {
        // update existing promotion
        ref = { id: initialPromotion.id };
        await updateDoc(doc(db, "promotions", initialPromotion.id), {
          productId: selectedProductId,
          type,
          discountPercent: type === "discount" ? discountPercent : null,
          bundleWith: type === "bundle" ? bundleProductId : null,
          updatedAt: now,
          status: "active",
        });
      } else {
        // create new promotion
        const promotion = {
          userId: currentUser?.uid,
          productId: selectedProductId,
          type,
          createdAt: now,
          updatedAt: now,
          status: "active",
          discountPercent: type === "discount" ? discountPercent : null,
          bundleWith: type === "bundle" ? bundleProductId : null,
        };

        ref = await addDoc(collection(db, "promotions"), promotion);
      }

      // Immediately update product documents so dashboard reflects promotion
      const selectedProduct = highStockProducts.find(
        (p) => p.id === selectedProductId,
      );
      if (type === "discount" && selectedProduct) {
        const salePrice = Math.round(
          (selectedProduct.harga || 0) * (1 - discountPercent / 100),
        );
        await updateDoc(doc(db, "products", selectedProductId), {
          promo: {
            id: ref.id,
            type: "discount",
            discountPercent,
            salePrice,
            active: true,
          },
        });
      }

      if (type === "bundle") {
        // set promo meta on both products (selected and bundle target) so dashboard can show bundle
        await updateDoc(doc(db, "products", selectedProductId), {
          promo: {
            id: ref.id,
            type: "bundle",
            bundleWith: bundleProductId,
            active: true,
          },
        });

        // also tag the partner product
        await updateDoc(doc(db, "products", bundleProductId), {
          promo: {
            id: ref.id,
            type: "bundle",
            bundleWith: selectedProductId,
            active: true,
          },
        });
      }

      showSuccess(
        "Promosi berhasil dibuat. Anda dapat melihatnya di Dashboard Promosi.",
      );
      onClose();
    } catch (error) {
      console.error("Error creating promotion:", error);
      showError("Gagal membuat promosi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Filter popularProducts to exclude same product when bundling
  const filteredPopularProducts = popularProducts.filter(
    (p) => p.id !== selectedProductId,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-secondary">
              {initialPromotion ? "Edit Promosi" : "Buat Promosi"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Produk untuk Dipromosikan
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {highStockProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nama} - Stok: {product.stok} - Rp{" "}
                    {product.harga?.toLocaleString("id-ID")}
                  </option>
                ))}
              </select>
            </div>

            {/* Promotion Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Promosi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setType("discount")}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    type === "discount"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-gray-700 hover:border-primary"
                  }`}
                >
                  Diskon
                </button>
                <button
                  onClick={() => setType("bundle")}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    type === "bundle"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-gray-700 hover:border-primary"
                  }`}
                >
                  Bundle
                </button>
              </div>
            </div>

            {/* Discount Settings */}
            {type === "discount" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persentase Diskon (%)
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() =>
                      setDiscountPercent(Math.max(5, discountPercent - 5))
                    }
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(
                        Math.max(
                          1,
                          Math.min(80, parseInt(e.target.value) || 0),
                        ),
                      )
                    }
                    className="flex-1 text-center p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={() =>
                      setDiscountPercent(Math.min(80, discountPercent + 5))
                    }
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal 80% untuk menjaga profitabilitas
                </p>
              </div>
            )}

            {/* Bundle Settings */}
            {type === "bundle" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bundling dengan Produk
                </label>
                <select
                  value={bundleProductId}
                  onChange={(e) => setBundleProductId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Pilih produk untuk bundle...</option>
                  {filteredPopularProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nama} - Rp{" "}
                      {product.harga?.toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Preview */}
            {selectedProductId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  Preview Promosi
                </h4>
                <div className="text-sm text-blue-700">
                  {type === "discount" ? (
                    <div>
                      <p>
                        Produk:{" "}
                        {
                          highStockProducts.find(
                            (p) => p.id === selectedProductId,
                          )?.nama
                        }
                      </p>
                      <p>
                        Harga Normal: Rp{" "}
                        {highStockProducts
                          .find((p) => p.id === selectedProductId)
                          ?.harga?.toLocaleString("id-ID")}
                      </p>
                      <p className="font-medium">
                        Harga Diskon: Rp{" "}
                        {Math.round(
                          (highStockProducts.find(
                            (p) => p.id === selectedProductId,
                          )?.harga || 0) *
                            (1 - discountPercent / 100),
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>
                        Bundle:{" "}
                        {
                          highStockProducts.find(
                            (p) => p.id === selectedProductId,
                          )?.nama
                        }
                      </p>
                      {bundleProductId && (
                        <p>
                          +{" "}
                          {
                            filteredPopularProducts.find(
                              (p) => p.id === bundleProductId,
                            )?.nama
                          }
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading
                ? "Menyimpan..."
                : initialPromotion
                  ? "Update"
                  : "Buat Promosi"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
