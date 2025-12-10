import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { StoreProvider } from './contexts/StoreContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ChatbotProvider } from './contexts/ChatbotContext'
import { ToastProvider } from './contexts/ToastContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import ToastContainer from './components/ToastContainer'
import { useToast } from './contexts/ToastContext'
import './index.css'
import 'maplibre-gl/dist/maplibre-gl.css'

// Directly import pages (non-lazy) to reduce Suspense-related DOM issues in dev
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Cashier from './pages/Cashier'
import Stock from './pages/Stock'
import Notifications from './pages/Notifications'
import Statistics from './pages/Statistics'
import Account from './pages/Account'
import Settings from './pages/Settings'
import TodayRevenue from './pages/TodayRevenue'
import CollectiveShopping from './pages/CollectiveShopping'
import ChatbotPage from './pages/ChatbotPage'
import LocationPage from './pages/LocationPage'
import Debts from './pages/Debts'
import PromotionManagement from './pages/PromotionManagement'

// Inner App component that uses toast context
function AppContent () {
  const { toasts, removeToast } = useToast()

  return (
    <div className="App">
      <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/cashier" element={
            <PrivateRoute>
              <Layout>
                <Cashier />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/stock" element={
            <PrivateRoute>
              <Layout>
                <Stock />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <Layout>
                <Notifications />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/statistics" element={
            <PrivateRoute>
              <Layout>
                <Statistics />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/account" element={
            <PrivateRoute>
              <Layout>
                <Account />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/today-revenue" element={
            <PrivateRoute>
              <Layout>
                <TodayRevenue />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/collective-shopping" element={
            <PrivateRoute>
              <Layout>
                <CollectiveShopping />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/promotions" element={
            <PrivateRoute>
              <Layout>
                <PromotionManagement />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/chatbot" element={
            <PrivateRoute>
              <Layout>
                <ChatbotPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/location" element={
            <PrivateRoute>
              <Layout>
                <LocationPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/debts" element={
            <PrivateRoute>
              <Layout>
                <Debts />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}

function App () {
  return (
    <ToastProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <StoreProvider>
            <NotificationProvider>
              <ChatbotProvider>
                <CartProvider>
                  <Router>
                    <AppContent />
                  </Router>
                </CartProvider>
              </ChatbotProvider>
            </NotificationProvider>
          </StoreProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
