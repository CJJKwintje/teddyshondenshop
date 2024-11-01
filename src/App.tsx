import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider as UrqlProvider } from 'urql';
import { CartProvider } from './context/CartContext';
import { shopifyClient } from './services/shopify';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import Navbar from './components/Navbar';
import CartPreview from './components/CartPreview';

function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <UrqlProvider value={shopifyClient}>
      <BrowserRouter>
        <CartProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>

            <CartPreview />

            <footer className="bg-gray-900 text-white py-12 mt-16">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Happy Huisdier</h3>
                    <p className="text-gray-400">De beste producten voor jouw huisdier, direct bij jou thuisbezorgd.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Contact</h3>
                    <p className="text-gray-400">Email: info@happy-huisdier.nl</p>
                    <p className="text-gray-400">Tel: +31 (0)20 123 4567</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Volg ons</h3>
                    <div className="flex space-x-4">
                      <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                      <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </CartProvider>
      </BrowserRouter>
    </UrqlProvider>
  );
}

export default App;