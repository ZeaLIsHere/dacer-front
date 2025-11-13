import React, { Suspense, lazy } from 'react'
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

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Cashier = lazy(() => import('./pages/Cashier'))
const Stock = lazy(() => import('./pages/Stock'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Statistics = lazy(() => import('./pages/Statistics'))
const Account = lazy(() => import('./pages/Account'))
const Settings = lazy(() => import('./pages/Settings'))
const TodayRevenue = lazy(() => import('./pages/TodayRevenue'))
const CollectiveShopping = lazy(() => import('./pages/CollectiveShopping'))
const ChatbotPage = lazy(() => import('./pages/ChatbotPage'))
const LocationPage = lazy(() => import('./pages/LocationPage'))

// Inner App component that uses toast context
function AppContent () {
  const { toasts, removeToast } = useToast()

  return (
    <div className="App">
      <Suspense fallback={<LoadingSpinner message="Memuat halaman..." type="default" />}>
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      
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
