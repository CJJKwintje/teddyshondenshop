import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider as UrqlProvider } from 'urql';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { CustomerProvider } from './context/CustomerContext';
import { shopifyClient } from './services/shopify';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import CategoryPage from './pages/CategoryPage';
import ContentPage from './pages/ContentPage';
import ProductsPage from './pages/ProductsPage';
import ChatbotPage from './pages/ChatbotPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CartPreview from './components/CartPreview';
import ScrollToTop from './components/ScrollToTop';
import SubCategoryPage from './pages/SubCategoryPage';
import CookieBanner from './components/CookieBanner';
import { CookieProvider } from './context/CookieContext';
import { GoogleTagManagerScript, GoogleTagManagerNoScript } from './components/GoogleTagManager';
import { usePageTracking } from './hooks/usePageTracking';
import FAQPage from './pages/FAQPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentfulDataTest } from './components/test/ContentfulDataTest';
import { useContentfulData } from './hooks/useContentfulData';

// Create a separate component for the routes that needs access to router hooks
function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data, isLoading } = useContentfulData();
  const contentfulLoaded = !!(data && Object.keys(data).length > 0);
  usePageTracking();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/producten" element={<ProductsPage />} />
        <Route path="/product/:handle" element={<ProductPage />} />
        <Route path="/categorie/:category" element={<CategoryPage />} />
        <Route path="/categorie/:category/:subcategory" element={<SubCategoryPage />} />
        <Route path="/chat" element={<ChatbotPage />} />
        <Route path="/account/*" element={<AccountPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/account/reset/:customerId/:resetToken" element={<AccountPage />} />
        <Route path="/veelgestelde-vragen" element={<FAQPage />} />
        <Route path="/:slug" element={<ContentPage />} />
        <Route path="/test-contentful" element={<ContentfulDataTest />} />
      </Routes>
      <CartPreview />
      <Footer />
      <CookieBanner />
    </div>
  );
}

// Create a single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ErrorBoundary>
          <UrqlProvider value={shopifyClient}>
            <CustomerProvider>
              <BrowserRouter>
                <CartProvider>
                  <CookieProvider>
                    <GoogleTagManagerScript />
                    <GoogleTagManagerNoScript />
                    <ScrollToTop />
                    <AppContent />
                  </CookieProvider>
                </CartProvider>
              </BrowserRouter>
            </CustomerProvider>
          </UrqlProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;