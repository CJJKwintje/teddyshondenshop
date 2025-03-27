import React, { useState } from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { MapPin, Plus, Edit2, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { shopifyClient } from '../../services/shopify';

interface Address {
  id: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone?: string;
}

interface AddressEdge {
  node: Address;
}

interface AddressConnection {
  edges: AddressEdge[];
}

export default function AddressesPage() {
  const { customer, accessToken, fetchCustomerData } = useCustomer();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Transform the addresses from the GraphQL structure to a flat array
  const addresses = ((customer?.addresses as unknown) as AddressConnection)?.edges?.map((edge: AddressEdge) => edge.node) || [];

  const refreshCustomerData = async () => {
    if (accessToken) {
      await fetchCustomerData(accessToken);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const addressData = {
      address1: formData.get('address1') as string,
      address2: formData.get('address2') as string,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      zip: formData.get('zip') as string,
      country: formData.get('country') as string,
      phone: formData.get('phone') as string,
    };

    try {
      if (editingAddress) {
        // Update existing address
        const response = await shopifyClient.mutation(`
          mutation customerAddressUpdate($customerAccessToken: String!, $address: MailingAddressInput!, $id: ID!) {
            customerAddressUpdate(customerAccessToken: $customerAccessToken, address: $address, id: $id) {
              customerAddress {
                id
                address1
                address2
                city
                province
                zip
                country
                phone
              }
              customerUserErrors {
                field
                message
              }
            }
          }
        `, {
          customerAccessToken: accessToken,
          address: addressData,
          id: editingAddress.id,
        }).toPromise();

        if (response.error || response.data?.customerAddressUpdate?.customerUserErrors?.length > 0) {
          throw new Error(response.data?.customerAddressUpdate?.customerUserErrors?.[0]?.message || 'Failed to update address');
        }

        setSuccess('Adres succesvol bijgewerkt');
      } else if (isAddingNew) {
        // Add new address
        const response = await shopifyClient.mutation(`
          mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
            customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
              customerAddress {
                id
                address1
                address2
                city
                province
                zip
                country
                phone
              }
              customerUserErrors {
                field
                message
              }
            }
          }
        `, {
          customerAccessToken: accessToken,
          address: addressData,
        }).toPromise();

        if (response.error || response.data?.customerAddressCreate?.customerUserErrors?.length > 0) {
          throw new Error(response.data?.customerAddressCreate?.customerUserErrors?.[0]?.message || 'Failed to create address');
        }

        setSuccess('Nieuw adres succesvol toegevoegd');
      }

      // Refresh customer data to show updated addresses
      await refreshCustomerData();

      setEditingAddress(null);
      setIsAddingNew(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan van het adres');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Weet je zeker dat je dit adres wilt verwijderen?')) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await shopifyClient.mutation(`
        mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
          customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
            deletedCustomerAddressId
            customerUserErrors {
              field
              message
            }
          }
        }
      `, {
        customerAccessToken: accessToken,
        id: addressId,
      }).toPromise();

      if (response.error || response.data?.customerAddressDelete?.customerUserErrors?.length > 0) {
        throw new Error(response.data?.customerAddressDelete?.customerUserErrors?.[0]?.message || 'Failed to delete address');
      }

      // Refresh customer data to show updated addresses
      await refreshCustomerData();

      setSuccess('Adres succesvol verwijderd');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het verwijderen van het adres');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <SEO
        title="Adressen - Mijn Account"
        description="Beheer je verzend- en factuuradressen"
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
          <h1 className="text-2xl font-bold text-gray-900">Adressen</h1>
          <p className="text-gray-600 mt-1">
            Beheer je verzend- en factuuradressen
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Address List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {addresses.map((address: Address) => (
            <div
              key={address.id}
              className="bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {address.address1}
                    </h3>
                    {address.address2 && (
                      <p className="text-gray-600">{address.address2}</p>
                    )}
                    <p className="text-gray-600">
                      {address.zip} {address.city}
                    </p>
                    <p className="text-gray-600">
                      {address.province}, {address.country}
                    </p>
                    {address.phone && (
                      <p className="text-gray-600">{address.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingAddress(address)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    title="Adres bewerken"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 text-red-500 hover:text-red-600"
                    title="Adres verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Address Button */}
        {!isAddingNew && !editingAddress && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#63D7B2] text-white rounded-lg hover:bg-[#47C09A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuw adres toevoegen</span>
          </button>
        )}

        {/* Address Form */}
        {(isAddingNew || editingAddress) && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAddress ? 'Adres bewerken' : 'Nieuw adres toevoegen'}
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
                  Adres
                </label>
                <input
                  type="text"
                  id="address1"
                  name="address1"
                  defaultValue={editingAddress?.address1}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#63D7B2] focus:ring-[#63D7B2] sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
                  Adres 2 (optioneel)
                </label>
                <input
                  type="text"
                  id="address2"
                  name="address2"
                  defaultValue={editingAddress?.address2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#63D7B2] focus:ring-[#63D7B2] sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    Stad
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    defaultValue={editingAddress?.city}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#63D7B2] focus:ring-[#63D7B2] sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                    Provincie
                  </label>
                  <input
                    type="text"
                    id="province"
                    name="province"
                    defaultValue={editingAddress?.province}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#63D7B2] focus:ring-[#63D7B2] sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                    Postcode
                  </label>
                  <input
                    type="text"
                    id="zip"
                    name="zip"
                    defaultValue={editingAddress?.zip}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#63D7B2] focus:ring-[#63D7B2] sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Land
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    defaultValue={editingAddress?.country}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#63D7B2] focus:ring-[#63D7B2] sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefoonnummer (optioneel)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  defaultValue={editingAddress?.phone}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#63D7B2] focus:ring-[#63D7B2] sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#63D7B2] text-white rounded-lg hover:bg-[#47C09A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Opslaan</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddingNew(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Annuleren
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 