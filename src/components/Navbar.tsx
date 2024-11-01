import React from 'react';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const { cart } = useCart();
  const location = useLocation();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="text-xl font-bold text-gray-800">
              Happy Huisdier
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="#" className="text-gray-600 hover:text-gray-900">Honden</Link>
            <Link to="#" className="text-gray-600 hover:text-gray-900">Katten</Link>
            <Link to="#" className="text-gray-600 hover:text-gray-900">Vogels</Link>
            <Link to="#" className="text-gray-600 hover:text-gray-900">Vissen</Link>
          </div>

          <Link 
            to="/cart"
            className={`relative p-2 ${location.pathname === '/cart' ? 'text-blue-500' : ''}`}
          >
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Honden</Link>
            <Link to="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Katten</Link>
            <Link to="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Vogels</Link>
            <Link to="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Vissen</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;