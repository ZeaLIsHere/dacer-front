// In src/pages/PromotionManagement.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { promotionService } from '../services';

const PromotionManagement = () => {
  // State declarations
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'discount',
    discountPercent: 20,
    bundleWith: '',
    startDate: '',
    endDate: '',
  });

  // Fetch data function
  const fetchData = async () => {
    try {
      const [promotionData, productData] = await Promise.all([
        promotionService.getPromotions(),
        promotionService.getProducts()
      ]);
      setPromotions(promotionData);
      setProducts(productData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal mendapatkan data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!selectedProductId) {
        toast.error('Silakan pilih produk terlebih dahulu');
        return;
      }

      const product = products.find(p => p.id === selectedProductId);
      if (!product) {
        toast.error('Produk tidak ditemukan');
        return;
      }

      const requiredStock = product.batchSize * 2;
      if (product.stock !== requiredStock) {
        toast.error(`Stok harus tepat ${requiredStock} unit (2x batch) untuk membuat/mengupdate promosi`);
        return;
      }

      if (editingPromotion) {
        await promotionService.updatePromotion(
          editingPromotion.id, 
          {
            ...formData,
            productId: selectedProductId
          },
          selectedProductId
        );
        toast.success('Promosi berhasil diperbarui');
      } else {
        await promotionService.createPromotion(
          {
            ...formData,
            productId: selectedProductId
          }, 
          selectedProductId
        );
        toast.success('Promosi berhasil dibuat');
      }

      // Reset form and refresh data
      setShowForm(false);
      setEditingPromotion(null);
      setSelectedProductId(null);
      await fetchData();

    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error(error.message || 'Gagal menyimpan promosi');
    }
  };

  // Handle product selection
  const handleProductSelection = (productId) => {
    setSelectedProductId(productId);
  };

  // Handle form field change
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle form toggle
  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setFormData({
        productId: '',
        type: 'discount',
        discountPercent: 20,
        bundleWith: '',
        startDate: '',
        endDate: '',
      });
    }
  };

  // Handle edit promotion
  const handleEditPromotion = (promotion) => {
    setShowForm(true);
    setEditingPromotion(promotion);
    setSelectedProductId(promotion.productId);
    setFormData({
      productId: promotion.productId,
      type: promotion.type,
      discountPercent: promotion.discountPercent || 20,
      bundleWith: promotion.bundleWith || '',
      startDate: new Date(promotion.startDate.toDate()).toISOString().split('T')[0],
      endDate: new Date(promotion.endDate.toDate()).toISOString().split('T')[0],
    });
  };

  // Other handler functions...

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      {/* Your existing JSX */}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          {/* Other form fields */}

          {/* Product selection dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Produk <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductId || ''}
              onChange={(e) => handleProductSelection(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Pilih Produk</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (Stok: {product.stock}, Batch: {product.batchSize})
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={!selectedProductId || products.find(p => p.id === selectedProductId)?.stock !== products.find(p => p.id === selectedProductId)?.batchSize * 2}
          >
            {editingPromotion ? 'Update Promosi' : 'Buat Promosi'}
          </button>
        </form>
      )}

      {/* Rest of your component */}
    </div>
  );
};

export default PromotionManagement;