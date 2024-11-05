import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider as UrqlProvider } from 'urql';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { shopifyClient } from './services/shopify';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import Navbar from './components/Navbar';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import CategoryPage from './pages/CategoryPage';
import ContentPage from './pages/ContentPage';
import CartPreview from './components/CartPreview';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <UrqlProvider value={shopifyClient}>
          <BrowserRouter>
            <CartProvider>
              <ScrollToTop />
              <div className="min-h-screen bg-gray-50">
                <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/categorie/:category" element={<CategoryPage />} />
                  <Route path="/content/:slug" element={<ContentPage />} />
                  <Route path="/over-ons" element={<ContentPage />} />
                  <Route path="/algemene-voorwaarden" element={<ContentPage />} />
                </Routes>

                <CartPreview />

                <footer className="bg-gray-900 text-white py-12 mt-16">
                  <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">
                          Teddy's hondenshop
                        </h3>
                        <p className="text-gray-400">
                          De beste producten voor jouw hond, direct bij jou
                          thuisbezorgd.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Contact</h3>
                        <p className="text-gray-400">
                          Email: info@teddyshondenshop.nl
                        </p>
                        <p className="text-gray-400">Tel: +31 (0)6 411 32 964</p>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Links</h3>
                        <div className="flex flex-col space-y-2">
                          <a href="/over-ons" className="text-gray-400 hover:text-white">
                            Over ons
                          </a>
                          <a href="/algemene-voorwaarden" className="text-gray-400 hover:text-white">
                            Algemene voorwaarden
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </CartProvider>
          </BrowserRouter>
        </UrqlProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;