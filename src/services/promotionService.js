import { db } from '../config/firebase'
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore'

const PROMOTIONS_COLLECTION = 'promotions'
const PRODUCTS_COLLECTION = 'products'

export const createPromotion = async (promotionData, productId) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId)
    const productSnap = await getDoc(productRef)
    
    if (!productSnap.exists()) {
      throw new Error('Produk tidak ditemukan')
    }
    
    const product = productSnap.data()
    const requiredStock = product.batchSize * 2
    
    if (product.stock !== requiredStock) {
      throw new Error(`Stok harus tepat ${requiredStock} unit (2x batch) untuk membuat promosi`)
    }

    // If validations pass, create the promotion
    const promotionRef = await addDoc(collection(db, PROMOTIONS_COLLECTION), {
      ...promotionData,
      productId,
      startDate: Timestamp.fromDate(new Date(promotionData.startDate)),
      endDate: Timestamp.fromDate(new Date(promotionData.endDate)),
      isActive: true,
      currentUsage: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return promotionRef.id
  } catch (error) {
    console.error('Error creating promotion:', error)
    throw error
  }
}

export const getAllPromotions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PROMOTIONS_COLLECTION))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }))
  } catch (error) {
    console.error('Error getting promotions:', error)
    throw error
  }
}

export const getPromotionById = async (id) => {
  try {
    const docRef = doc(db, PROMOTIONS_COLLECTION, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        startDate: docSnap.data().startDate?.toDate(),
        endDate: docSnap.data().endDate?.toDate(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      }
    } else {
      throw new Error('Promosi tidak ditemukan')
    }
  } catch (error) {
    console.error('Error getting promotion:', error)
    throw error
  }
}

export const updatePromotion = async (id, promotionData, productId) => {
  try {
    const docRef = doc(db, PROMOTIONS_COLLECTION, id)
    await updateDoc(docRef, {
      ...promotionData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating promotion:', error)
    throw error
  }
}

export const togglePromotionStatus = async (id, currentStatus) => {
  try {
    const docRef = doc(db, PROMOTIONS_COLLECTION, id)
    await updateDoc(docRef, {
      isActive: !currentStatus,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error toggling promotion status:', error)
    throw error
  }
}

export const checkPromotionEligibility = async (productId) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId)
    const productSnap = await getDoc(productRef)
    
    if (!productSnap.exists()) {
      return { 
        isEligible: false, 
        message: 'Produk tidak ditemukan',
        requiredStock: 0,
        currentStock: 0
      }
    }
    
    const product = productSnap.data()
    const requiredStock = product.batchSize * 2
    const isEligible = product.stock === requiredStock
    
    return {
      isEligible,
      requiredStock,
      currentStock: product.stock,
      message: isEligible 
        ? 'Produk memenuhi syarat untuk promo (stok = 2x batch)' 
        : product.stock > requiredStock
          ? `Promo hanya tersedia saat stok tepat ${requiredStock} unit (2x batch)`
          : `Stok harus tepat ${requiredStock} unit (2x batch) untuk menggunakan promo`
    }
  } catch (error) {
    console.error('Error checking promotion eligibility:', error)
    return { 
      isEligible: false, 
      message: 'Terjadi kesalahan saat memeriksa kelayakan promo',
      requiredStock: 0,
      currentStock: 0
    }
  }
}

export const getProducts = async () => {
  try {
    const qs = await getDocs(collection(db, PRODUCTS_COLLECTION))
    return qs.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting products:', error)
    throw error
  }
}

const promotionService = {
  createPromotion,
  getPromotions: getAllPromotions,
  getProducts,
  updatePromotion,
  togglePromotionStatus,
  checkPromotionEligibility,
  getPromotionById
}

export default promotionService


