import React, { useState } from 'react';
import { ShoppingCart, Menu, X, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo.png';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
      setIsSearchExpanded(false);
      setSearchTerm('');
    }
  };

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        searchInput?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left section with menu button and logo */}
          <div className={`flex items-center transition-all duration-300 ease-in-out transform ${
            isSearchExpanded ? 'md:flex md:opacity-100 opacity-0 -translate-x-full md:translate-x-0' : 'opacity-100 translate-x-0'
          }`}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center text-xl font-bold text-gray-800">
              <img src={logo} alt="Happy Huisdier Logo" className="h-12 w-auto mr-2" />
              <span className="hidden md:inline">Teddy's hondenshop</span>
            </Link>
          </div>

          {/* Search section */}
          <div className={`md:flex-1 md:mx-8 transition-all duration-300 ease-in-out ${
            isSearchExpanded 
              ? 'absolute left-0 right-0 px-4 flex items-center h-full bg-white opacity-100 transform translate-x-0' 
              : 'hidden md:flex opacity-0 md:opacity-100 transform translate-x-full md:translate-x-0'
          }`}>
            <form onSubmit={handleSearch} className="w-full flex items-center relative">
              <input
                id="searchInput"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Zoek producten..."
                className="w-full border rounded-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out"
              />
              {isSearchExpanded ? (
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="absolute right-3 p-2 transition-all duration-200 hover:scale-110"
                >
                  <X size={20} className="text-gray-500 hover:text-gray-800" />
                </button>
              ) : (
                <button type="submit" className="absolute right-3 p-2">
                  <Search size={20} className="text-gray-500 hover:text-gray-800" />
                </button>
              )}
            </form>
          </div>

          {/* Right section with search toggle and cart */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className="md:hidden p-2 transition-transform duration-200 hover:scale-110"
              aria-label="Toggle search"
            >
              {isSearchExpanded ? (
                <X size={24} className="text-gray-600" />
              ) : (
                <Search size={24} className="text-gray-600" />
              )}
            </button>

            <Link 
              to="/cart"
              className={`relative p-2 transition-all duration-300 ease-in-out transform ${
                location.pathname === '/cart' ? 'text-blue-500' : ''
              } ${
                isSearchExpanded ? 'md:flex md:opacity-100 opacity-0 translate-x-full md:translate-x-0' : 'opacity-100 translate-x-0'
              }`}
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
      </div>
    </nav>
  );
};

export default Navbar;