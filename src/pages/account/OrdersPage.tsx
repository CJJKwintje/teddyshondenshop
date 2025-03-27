import React from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { ArrowLeft, Package, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { formatPrice } from '../../utils/formatPrice';

export default function OrdersPage() {
  const { customer, isLoading } = useCustomer();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const orders = customer.orders?.edges || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <SEO
        title="Mijn Bestellingen"
        description="Bekijk je bestellingen en volg de status."
        noindex={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/account"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Terug naar account
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mijn Bestellingen</h1>
          <p className="text-gray-600 mt-1">
            Bekijk je bestellingen en volg de status
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Geen bestellingen gevonden
            </h2>
            <p className="text-gray-600 mb-6">
              Je hebt nog geen bestellingen geplaatst.
            </p>
            <Link
              to="/"
              className="inline-flex bg-[#63D7B2] text-white px-6 py-3 rounded-lg hover:bg-[#47C09A] transition-colors"
            >
              Begin met winkelen
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(({ node: order }: any) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Bestelnummer: {order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        Datum:{' '}
                        {new Date(order.processedAt).toLocaleDateString('nl-NL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        €{formatPrice(Number(order.totalPrice.amount))}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.fulfillmentStatus === 'FULFILLED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.fulfillmentStatus === 'FULFILLED'
                          ? 'Verzonden'
                          : 'In behandeling'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {order.lineItems.edges.map(({ node: item }: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {item.variant?.image ? (
                            <img
                              src={item.variant.image.url}
                              alt={item.variant.image.altText || item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Aantal: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          €
                          {formatPrice(
                            Number(item.variant.price.amount) * item.quantity
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50">
                  <a
                    href={order.statusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    Bekijk bestelling
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}