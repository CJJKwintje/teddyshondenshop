import React from 'react';
import { Navigate, Link, Routes, Route } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import { Package, User, MapPin, LogOut, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import OrdersPage from './account/OrdersPage';

export default function AccountPage() {
  const { customer, isLoading, logout } = useCustomer();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <Routes>
      <Route
        path="orders"
        element={<OrdersPage />}
      />
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-gray-50 py-12">
            <SEO
              title="Mijn Account"
              description="Beheer je account, bekijk je bestellingen en update je gegevens."
              noindex={true}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welkom, {customer.firstName || customer.email}
                </h1>
                <p className="text-gray-600 mt-1">
                  Beheer je account en bekijk je bestellingen
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Orders Section */}
                <Link
                  to="/account/orders"
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Bestellingen</h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Bekijk je bestellingen en volg de status
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Profile Section */}
                <Link
                  to="/account/profile"
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <User className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Profiel</h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Update je persoonlijke gegevens
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Addresses Section */}
                <Link
                  to="/account/addresses"
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <MapPin className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Adressen</h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Beheer je verzend- en factuuradres
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Uitloggen</span>
                </button>
              </div>
            </div>
          </div>
        }
      />
    </Routes>
  );
}