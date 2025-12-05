// Debt Service - Business logic layer for debt/kasbon operations
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc,
  deleteDoc,
  getDocs,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

class DebtService {
  constructor () {
    this.collection = 'debts'
    this.customersCollection = 'customers'
  }

  // Subscribe to user's debts with real-time updates
  subscribeToUserDebts (userId, callback) {
    if (!userId) {
      callback([])
      return () => {}
    }

    const debtsQuery = query(
      collection(db, this.collection),
      where('userId', '==', userId),
      orderBy('dueDate', 'asc')
    )

    return onSnapshot(debtsQuery, (snapshot) => {
      try {
        const debts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        callback(debts)
      } catch (error) {
        console.error('Error processing debts data:', error)
        callback([])
      }
    }, (error) => {
      console.error('Error fetching debts:', error)
      callback([])
    })
  }

  // Subscribe to user's customers with real-time updates
  subscribeToUserCustomers (userId, callback) {
    if (!userId) {
      callback([])
      return () => {}
    }

    const customersQuery = query(
      collection(db, this.customersCollection),
      where('userId', '==', userId),
      orderBy('nama', 'asc')
    )

    return onSnapshot(customersQuery, (snapshot) => {
      try {
        const customers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        callback(customers)
      } catch (error) {
        console.error('Error processing customers data:', error)
        callback([])
      }
    }, (error) => {
      console.error('Error fetching customers:', error)
      callback([])
    })
  }

  // Create new debt
  async createDebt (debtData) {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...debtData,
        status: 'unpaid', // unpaid, partially_paid, paid
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return { id: docRef.id, ...debtData }
    } catch (error) {
      console.error('Error creating debt:', error)
      throw new Error('Failed to create debt')
    }
  }

  // Add new customer
  async addCustomer(customerData, userId) {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const customerWithUserId = {
        ...customerData,
        userId: userId,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'customers'), customerWithUserId);
      return { id: docRef.id, ...customerWithUserId };
    } catch (error) {
      console.error('Error adding customer:', error);
      throw new Error('Failed to add customer');
    }
  }

  // Update debt (for payment)
  async updateDebt (debtId, updateData) {
    try {
      await updateDoc(doc(db, this.collection, debtId), {
        ...updateData,
        updatedAt: serverTimestamp()
      })
      return { id: debtId, ...updateData }
    } catch (error) {
      console.error('Error updating debt:', error)
      throw new Error('Failed to update debt')
    }
  }

  // Make payment for debt
  async makePayment (debtId, paymentAmount) {
    try {
      const debtDoc = await getDocs(
        query(collection(db, this.collection), where('__name__', '==', debtId))
      )
      
      if (debtDoc.empty) {
        throw new Error('Debt not found')
      }
      
      const debt = { id: debtDoc.docs[0].id, ...debtDoc.docs[0].data() }
      const currentPaid = debt.paidAmount || 0
      const newPaidAmount = currentPaid + paymentAmount
      const remainingAmount = debt.totalAmount - newPaidAmount
      
      let status = 'partially_paid'
      if (remainingAmount <= 0) {
        status = 'paid'
      }
      
      await updateDoc(doc(db, this.collection, debtId), {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, remainingAmount),
        status,
        lastPaymentDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return {
        id: debtId,
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, remainingAmount),
        status
      }
    } catch (error) {
      console.error('Error making payment:', error)
      throw new Error('Failed to make payment')
    }
  }

  // Delete debt
  async deleteDebt (debtId) {
    try {
      await deleteDoc(doc(db, this.collection, debtId))
      return { id: debtId }
    } catch (error) {
      console.error('Error deleting debt:', error)
      throw new Error('Failed to delete debt')
    }
  }

  // Get debt analytics
  getDebtAnalytics (debts) {
    const totalDebt = debts.reduce((sum, debt) => sum + (debt.totalAmount || 0), 0)
    const totalPaid = debts.reduce((sum, debt) => sum + (debt.paidAmount || 0), 0)
    const totalRemaining = totalDebt - totalPaid
    
    const overdueDebts = debts.filter(debt => {
      if (debt.status === 'paid') return false
      const dueDate = debt.dueDate?.toDate ? debt.dueDate.toDate() : new Date(debt.dueDate)
      return dueDate < new Date()
    })
    
    const paidDebts = debts.filter(debt => debt.status === 'paid')
    const partiallyPaidDebts = debts.filter(debt => debt.status === 'partially_paid')
    const unpaidDebts = debts.filter(debt => debt.status === 'unpaid')
    
    return {
      totalDebt,
      totalPaid,
      totalRemaining,
      totalDebts: debts.length,
      paidDebts: paidDebts.length,
      partiallyPaidDebts: partiallyPaidDebts.length,
      unpaidDebts: unpaidDebts.length,
      overdueDebts: overdueDebts.length,
      overdueAmount: overdueDebts.reduce((sum, debt) => sum + (debt.remainingAmount || debt.totalAmount || 0), 0)
    }
  }

  // Get overdue debts
  getOverdueDebts (debts) {
    return debts.filter(debt => {
      if (debt.status === 'paid') return false
      const dueDate = debt.dueDate?.toDate ? debt.dueDate.toDate() : new Date(debt.dueDate)
      return dueDate < new Date()
    })
  }

  // Get debts by customer
  getDebtsByCustomer (debts, customerId) {
    return debts.filter(debt => debt.customerId === customerId)
  }

  // Get debts by status
  getDebtsByStatus (debts, status) {
    return debts.filter(debt => debt.status === status)
  }

  // Get debts due soon (within 7 days)
  getDebtsDueSoon (debts, days = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)
    
    return debts.filter(debt => {
      if (debt.status === 'paid') return false
      const dueDate = debt.dueDate?.toDate ? debt.dueDate.toDate() : new Date(debt.dueDate)
      return dueDate <= cutoffDate && dueDate >= new Date()
    })
  }

  // Format debt for display
  formatDebtForDisplay (debt) {
    if (!debt) return null
    
    const dueDate = debt.dueDate?.toDate ? debt.dueDate.toDate() : new Date(debt.dueDate)
    const isOverdue = dueDate < new Date() && debt.status !== 'paid'
    
    return {
      ...debt,
      displayDueDate: dueDate.toLocaleDateString('id-ID'),
      displayAmount: debt.totalAmount?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      displayPaid: debt.paidAmount?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      displayRemaining: debt.remainingAmount?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      isOverdue,
      statusColor: this.getStatusColor(debt.status),
      statusText: this.getStatusText(debt.status)
    }
  }

  // Get status color
  getStatusColor (status) {
    switch (status) {
      case 'paid': return '#10B981' // Green
      case 'partially_paid': return '#F59E0B' // Yellow
      case 'unpaid': return '#EF4444' // Red
      default: return '#6B7280' // Gray
    }
  }

  // Get status text
  getStatusText (status) {
    switch (status) {
      case 'paid': return 'Lunas'
      case 'partially_paid': return 'Sebagian'
      case 'unpaid': return 'Belum Bayar'
      default: return 'Tidak Diketahui'
    }
  }
}

export default new DebtService()
