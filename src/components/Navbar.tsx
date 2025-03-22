import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Menu, X, Search, ChevronDown, User, Truck, Timer, MessageCircleHeart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useQuery } from 'urql';
import { gql } from 'urql';
import { useClickOutside } from '../hooks/useClickOutside';
import { useNavigation } from '../hooks/useNavigation';
import logo from '../assets/logo.png';
import BenefitsBar from './BenefitsBar';

const SEARCH_SUGGESTIONS_QUERY = gql`
  query SearchSuggestions($query: String!) {
    products(first: 5, query: $query) {
      edges {
        node {
          id
          title
          productType
          images(first: 1) {
            edges {
              node {
                originalSrc
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
            }
          }
        }
      }
    }
  }
`;

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const formatPrice = (price: number): string => {
  return price.toFixed(2).replace('.', ',');
};

export default function Navbar({ isMenuOpen, setIsMenuOpen }: NavbarProps) {
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const { categories, isLoading: isNavLoading } = useNavigation();

  const generateCategoryUrl = (categorySlug: string, linkSlug: string) => {
    return `/categorie/${categorySlug}/${linkSlug}`;
  };

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        setDebouncedQuery(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search suggestions query
  const [{ data: suggestionsData }] = useQuery({
    query: SEARCH_SUGGESTIONS_QUERY,
    variables: { query: debouncedQuery },
    pause: debouncedQuery.length < 2,
  });

  // Close suggestions on click outside
  useClickOutside(searchContainerRef, () => {
    setShowSuggestions(false);
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
      setIsSearchExpanded(false);
      setShowSuggestions(false);
      setSearchTerm('');
      setIsMenuOpen(false);
    }
  };

  const handleSuggestionClick = (productId: string) => {
    const id = productId.split('/').pop();
    navigate(`/product/${id}`);
    setSearchTerm('');
    setShowSuggestions(false);
    setIsSearchExpanded(false);
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
      setShowSuggestions(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <BenefitsBar />

      {/* Main Navigation */}
      <div className="container mx-auto px-4 sticky top-0 z-50">
        <div className="flex justify-between items-center h-20 relative">
          {/* Left section with menu button and logo */}
          <div className={`flex items-center transition-all duration-300 ease-in-out ${
            isSearchExpanded ? 'w-0 opacity-0 overflow-hidden md:w-auto md:opacity-100' : 'w-auto opacity-100'
          }`}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Happy Huisdier Logo" className="h-16 w-auto" />
            </Link>
          </div>

          {/* Search section */}
          <div 
            ref={searchContainerRef}
            className={`md:flex-1 md:mx-8 transition-all duration-300 ease-in-out transform ${
              isSearchExpanded 
                ? 'absolute left-4 right-[104px] md:static md:right-auto opacity-100 translate-x-0' 
                : 'hidden md:block opacity-0 -translate-x-4 md:translate-x-0 md:opacity-100'
            }`}
          >
            <div className="w-full relative">
              <form onSubmit={handleSearch} className="w-full flex items-center relative">
                <input
                  id="searchInput"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Zoek producten..."
                  className="w-full border rounded-full px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out"
                />
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="absolute right-3 p-2 transition-all duration-200 hover:scale-110"
                  aria-label="Close search"
                >
                  <X size={20} className="text-gray-500 hover:text-gray-800" />
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchTerm.length >= 2 && suggestionsData?.products?.edges?.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 max-h-96 overflow-y-auto z-50">
                  {suggestionsData.products.edges.map(({ node: product }: any) => (
                    <button
                      key={product.id}
                      onClick={() => handleSuggestionClick(product.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {product.images.edges[0] ? (
                          <img
                            src={product.images.edges[0].node.originalSrc}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {product.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          €{formatPrice(parseFloat(product.priceRange.minVariantPrice.amount))}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right section with search toggle, account, and cart */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className={`md:hidden p-2 transition-all duration-300 ease-in-out transform ${
                isSearchExpanded ? 'opacity-0 scale-95 invisible' : 'opacity-100 scale-100 visible'
              }`}
              aria-label="Toggle search"
            >
              <Search size={24} className="text-gray-600" />
            </button>

            <Link
              to="/account"
              className={`p-2 transition-colors ${
                location.pathname.startsWith('/account') || 
                location.pathname === '/login' || 
                location.pathname === '/register'
                  ? 'text-[#63D7B2]' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="My Account"
            >
              <User size={24} />
            </Link>

            <Link 
              to="/cart"
              className="relative p-2 text-gray-600"
              aria-label="Shopping cart"
            >
              <ShoppingCart 
                size={24} 
                className={location.pathname === '/cart' ? 'text-[#63D7B2]' : ''} 
              />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="border-t border-gray-100 md:bg-[#47C09A]">
        <div className="container mx-auto px-4">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {isNavLoading ? (
              // Loading skeleton
              <div className="flex space-x-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 w-24 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.mainCategory}
                  className="relative group"
                  onMouseEnter={() => handleCategoryClick(category.mainCategory)}
                  onMouseLeave={() => handleCategoryClick('')}
                >
                  <button
                    className={`py-3 flex items-center space-x-1 text-sm font-medium text-white hover:text-white/80`}
                  >
                    <span>{category.mainCategory}</span>
                    <ChevronDown size={16} className={`transform transition-transform ${
                      openCategory === category.mainCategory ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {openCategory === category.mainCategory && (
                    <div className="absolute left-0 mt-0 w-64 bg-white rounded-b-lg shadow-lg py-4 z-50">
                      {/* First link group */}
                      {category.link.length > 0 && (
                        <div className="px-4 py-2">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            {category.linkTitle}
                          </h3>
                          <div className="space-y-2">
                            {category.link.map((item) => (
                              <Link
                                key={item.fields.slug}
                                to={generateCategoryUrl(category.slug, item.fields.slug)}
                                className="block text-sm text-gray-600 hover:text-[#63D7B2]"
                                onClick={() => setOpenCategory(null)}
                              >
                                {item.fields.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Second link group */}
                      {category.link2 && category.link2.length > 0 && (
                        <div className="px-4 py-2">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            {category.linkTitle2}
                          </h3>
                          <div className="space-y-2">
                            {category.link2.map((item) => (
                              <Link
                                key={item.fields.slug}
                                to={generateCategoryUrl(category.slug, item.fields.slug)}
                                className="block text-sm text-gray-600 hover:text-[#63D7B2]"
                                onClick={() => setOpenCategory(null)}
                              >
                                {item.fields.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Third link group */}
                      {category.link3 && category.link3.length > 0 && (
                        <div className="px-4 py-2">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            {category.linkTitle3}
                          </h3>
                          <div className="space-y-2">
                            {category.link3.map((item) => (
                              <Link
                                key={item.fields.slug}
                                to={generateCategoryUrl(category.slug, item.fields.slug)}
                                className="block text-sm text-gray-600 hover:text-[#63D7B2]"
                                onClick={() => setOpenCategory(null)}
                              >
                                {item.fields.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Mobile Menu */}
          <div 
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white ${
              isMenuOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="py-2 space-y-1">
              {categories.map((category) => (
                <div key={category.mainCategory} className="border-b border-gray-100 last:border-b-0">
                  <button
                    onClick={() => handleCategoryClick(category.mainCategory)}
                    className="w-full px-4 py-2 flex items-center justify-between text-gray-700"
                  >
                    <span className="font-medium">{category.mainCategory}</span>
                    <ChevronDown
                      size={16}
                      className={`transform transition-transform duration-300 ${
                        openCategory === category.mainCategory ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      openCategory === category.mainCategory ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {/* First link group */}
                    {category.link.length > 0 && (
                      <div className="py-2">
                        <h3 className="px-6 py-1 text-sm font-semibold text-gray-900">
                          {category.linkTitle}
                        </h3>
                        {category.link.map((item) => (
                          <Link
                            key={item.fields.slug}
                            to={generateCategoryUrl(category.slug, item.fields.slug)}
                            className="block px-8 py-2 text-sm text-gray-600 hover:text-[#63D7B2]"
                            onClick={() => {
                              setOpenCategory(null);
                              setIsMenuOpen(false);
                            }}
                          >
                            {item.fields.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Second link group */}
                    {category.link2 && category.link2.length > 0 && (
                      <div className="py-2">
                        <h3 className="px-6 py-1 text-sm font-semibold text-gray-900">
                          {category.linkTitle2}
                        </h3>
                        {category.link2.map((item) => (
                          <Link
                            key={item.fields.slug}
                            to={generateCategoryUrl(category.slug, item.fields.slug)}
                            className="block px-8 py-2 text-sm text-gray-600 hover:text-[#63D7B2]"
                            onClick={() => {
                              setOpenCategory(null);
                              setIsMenuOpen(false);
                            }}
                          >
                            {item.fields.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Third link group */}
                    {category.link3 && category.link3.length > 0 && (
                      <div className="py-2">
                        <h3 className="px-6 py-1 text-sm font-semibold text-gray-900">
                          {category.linkTitle3}
                        </h3>
                        {category.link3.map((item) => (
                          <Link
                            key={item.fields.slug}
                            to={generateCategoryUrl(category.slug, item.fields.slug)}
                            className="block px-8 py-2 text-sm text-gray-600 hover:text-[#63D7B2]"
                            onClick={() => {
                              setOpenCategory(null);
                              setIsMenuOpen(false);
                            }}
                          >
                            {item.fields.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}