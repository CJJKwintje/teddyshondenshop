import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { shopifyClient } from '../services/shopify';

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  defaultAddress?: any;
  addresses?: any[];
  orders?: any[];
}

interface CustomerContextType {
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateCustomer: (data: Partial<Customer>) => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  fetchCustomerData: (token: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const CUSTOMER_ACCESS_TOKEN_COOKIE = 'customerAccessToken';

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get(CUSTOMER_ACCESS_TOKEN_COOKIE);
    if (token) {
      setAccessToken(token);
      fetchCustomerData(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCustomerData = async (token: string) => {
    try {
      const response = await shopifyClient.query(`
        query GetCustomer($customerAccessToken: String!) {
          customer(customerAccessToken: $customerAccessToken) {
            id
            email
            firstName
            lastName
            phone
            defaultAddress {
              id
              address1
              address2
              city
              province
              zip
              country
              phone
            }
            addresses(first: 10) {
              edges {
                node {
                  id
                  address1
                  address2
                  city
                  province
                  zip
                  country
                  phone
                }
              }
            }
            orders(first: 10) {
              edges {
                node {
                  id
                  orderNumber
                  totalPrice {
                    amount
                    currencyCode
                  }
                  processedAt
                  fulfillmentStatus
                  statusUrl
                  lineItems(first: 10) {
                    edges {
                      node {
                        title
                        quantity
                        variant {
                          price {
                            amount
                            currencyCode
                          }
                          image {
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `, { customerAccessToken: token }).toPromise();

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.customer) {
        throw new Error('No customer data found');
      }

      setCustomer(response.data.customer);
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customer data');
      Cookies.remove(CUSTOMER_ACCESS_TOKEN_COOKIE);
      setAccessToken(null);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await shopifyClient.mutation(`
        mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
          customerAccessTokenCreate(input: $input) {
            customerAccessToken {
              accessToken
              expiresAt
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `, {
        input: {
          email,
          password,
        },
      }).toPromise();

      if (response.error || response.data?.customerAccessTokenCreate?.customerUserErrors?.length > 0) {
        const error = response.data?.customerAccessTokenCreate?.customerUserErrors?.[0]?.message || 
                     response.error?.message ||
                     'Invalid email or password';
        throw new Error(error);
      }

      const token = response.data?.customerAccessTokenCreate?.customerAccessToken?.accessToken;
      const expiresAt = response.data?.customerAccessTokenCreate?.customerAccessToken?.expiresAt;
      
      if (!token) {
        throw new Error('No access token received');
      }

      Cookies.set(CUSTOMER_ACCESS_TOKEN_COOKIE, token, {
        expires: new Date(expiresAt),
        sameSite: 'strict'
      });
      
      setAccessToken(token);
      await fetchCustomerData(token);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await shopifyClient.mutation(`
        mutation customerCreate($input: CustomerCreateInput!) {
          customerCreate(input: $input) {
            customer {
              id
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `, {
        input: {
          email,
          password,
          acceptsMarketing: true
        },
      }).toPromise();

      if (response.error || response.data?.customerCreate?.customerUserErrors?.length > 0) {
        const error = response.data?.customerCreate?.customerUserErrors?.[0]?.message || 
                     response.error?.message ||
                     'Failed to create account';
        throw new Error(error);
      }

      // After successful registration, log the user in
      await login(email, password);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove(CUSTOMER_ACCESS_TOKEN_COOKIE);
    setAccessToken(null);
    setCustomer(null);
  };

  const updateCustomer = async (data: Partial<Customer>) => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await shopifyClient.mutation(`
        mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
          customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
            customer {
              id
              email
              firstName
              lastName
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
        customer: data,
      }).toPromise();

      if (response.error || response.data?.customerUpdate?.customerUserErrors?.length > 0) {
        const error = response.data?.customerUpdate?.customerUserErrors?.[0]?.message || 
                     response.error?.message ||
                     'Failed to update customer data';
        throw new Error(error);
      }

      if (response.data?.customerUpdate?.customer) {
        setCustomer(prev => ({ ...prev, ...response.data.customerUpdate.customer }));
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update customer data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const recoverPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await shopifyClient.mutation(`
        mutation customerRecover($email: String!) {
          customerRecover(email: $email) {
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `, {
        email,
      }).toPromise();

      if (response.error || response.data?.customerRecover?.customerUserErrors?.length > 0) {
        const error = response.data?.customerRecover?.customerUserErrors?.[0]?.message || 
                     response.error?.message ||
                     'Failed to send recovery email';
        throw new Error(error);
      }
    } catch (err) {
      console.error('Password recovery error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send recovery email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoading,
        error,
        accessToken,
        login,
        register,
        logout,
        updateCustomer,
        recoverPassword,
        fetchCustomerData,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};