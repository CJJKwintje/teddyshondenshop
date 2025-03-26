import { Client, cacheExchange, fetchExchange } from 'urql';
import { gql } from 'urql';

const SHOPIFY_STORE_URL = 'https://yvdedm-5e.myshopify.com/api/2024-01/graphql';
const SHOPIFY_STOREFRONT_TOKEN = 'f2891c0e910edc30275cac0cc8e32cff';

export const shopifyClient = new Client({
  url: SHOPIFY_STORE_URL,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: {
    headers: {
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
  },
});

// Product search query
const SEARCH_PRODUCTS_QUERY = `
  query SearchProducts($query: String!, $first: Int!) {
    products(query: $query, first: $first, sortKey: RELEVANCE) {
      edges {
        node {
          id
          title
          description
          productType
          vendor
          tags
          onlineStoreUrl
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                quantityAvailable
              }
            }
          }
          images(first: 1) {
            edges {
              node {
                originalSrc
                altText
              }
            }
          }
        }
      }
    }
  }
`;

export const searchProducts = async (context: string) => {
  try {
    // Use the context directly as the search query
    const response = await shopifyClient
      .query(SEARCH_PRODUCTS_QUERY, { 
        query: context,
        first: 4 // Limit to 4 most relevant results
      })
      .toPromise();

    if (response.data?.products?.edges) {
      return response.data.products.edges.map(({ node }: any) => ({
        id: node.id,
        title: node.title,
        description: node.description,
        productType: node.productType,
        vendor: node.vendor,
        tags: node.tags,
        url: node.onlineStoreUrl,
        price: node.variants.edges[0]?.node.price.amount,
        compareAtPrice: node.variants.edges[0]?.node.compareAtPrice?.amount,
        image: node.images.edges[0]?.node.originalSrc,
        variantId: node.variants.edges[0]?.node.id
      }));
    }

    return [];
  } catch (error) {
    console.error('Product search error:', error);
    return [];
  }
};

// Cart API mutations
const CREATE_CART_MUTATION = `
  mutation cartCreate($customerAccessToken: String) {
    cartCreate(input: { buyerIdentity: { customerAccessToken: $customerAccessToken } }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ADD_TO_CART_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retryCount >= 3) {
      throw error;
    }

    const backoffDelay = 1000 * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    await delay(backoffDelay + jitter);
    
    return executeWithRetry(operation, retryCount + 1);
  }
};

export const createCheckout = async (
  lineItems: { variantId: string; quantity: number }[],
  customerAccessToken?: string | null
) => {
  try {
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error('Winkelwagen is leeg');
    }

    // First create a new cart
    const createCartResult = await executeWithRetry(async () => {
      const response = await shopifyClient
        .mutation(CREATE_CART_MUTATION, {
          customerAccessToken
        })
        .toPromise();

      if (!response.data && response.error) {
        throw new Error('Netwerkfout: Kan geen verbinding maken met de betaalservice');
      }

      return response;
    });

    if (createCartResult.data?.cartCreate?.userErrors?.length > 0) {
      throw new Error(`Fout bij aanmaken winkelwagen: ${createCartResult.data.cartCreate.userErrors[0].message}`);
    }

    const cartId = createCartResult.data?.cartCreate?.cart?.id;
    if (!cartId) {
      throw new Error('Geen winkelwagen ID ontvangen van de betaalservice');
    }

    // Then add items to the cart
    const addToCartResult = await executeWithRetry(async () => {
      const response = await shopifyClient
        .mutation(ADD_TO_CART_MUTATION, {
          cartId,
          lines: lineItems.map(item => ({
            merchandiseId: item.variantId,
            quantity: item.quantity
          }))
        })
        .toPromise();

      if (!response.data && response.error) {
        throw new Error('Netwerkfout: Kan geen producten toevoegen aan de winkelwagen');
      }

      return response;
    });

    if (addToCartResult.data?.cartLinesAdd?.userErrors?.length > 0) {
      throw new Error(`Fout bij toevoegen producten: ${addToCartResult.data.cartLinesAdd.userErrors[0].message}`);
    }

    const checkoutUrl = addToCartResult.data?.cartLinesAdd?.cart?.checkoutUrl;
    if (!checkoutUrl) {
      throw new Error('Geen checkout URL ontvangen van de betaalservice');
    }

    return {
      id: cartId,
      webUrl: checkoutUrl
    };
  } catch (error) {
    console.error('Checkout creation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        throw new Error('Controleer je internetverbinding en probeer het opnieuw');
      }
      throw error;
    }
    
    throw new Error('Er is een onverwachte fout opgetreden. Probeer het later opnieuw');
  }
};

interface ShopifyCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing: boolean;
}

interface ShopifyCustomerResponse {
  customer: ShopifyCustomer;
  customerUserErrors: Array<{
    field: string[];
    message: string;
  }>;
}

interface ShopifyCustomerSearchResponse {
  customers: ShopifyCustomer[];
  customerUserErrors: Array<{
    field: string[];
    message: string;
  }>;
}

const SEARCH_CUSTOMER = gql`
  query SearchCustomer($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          email
          firstName
          lastName
          acceptsMarketing
        }
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        acceptsMarketing
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        acceptsMarketing
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`;

// Add these validation functions at the top of the file
const validateEmail = (email: string): boolean => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check length (max 254 characters is standard email length limit)
  if (email.length > 254) {
    return false;
  }

  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.com', 'throwawaymail.com', 'mailinator.com', 'tempmail.net',
    'disposablemail.com', 'tempmailaddress.com', 'tempmail.ninja', 'tempmail.plus',
    'tempmail.website', 'tempmail.ws', 'tempmail.xyz', 'tempmail.org',
    'tempmail.net', 'tempmail.com', 'tempmail.co', 'tempmail.cc'
  ];
  
  const domain = email.split('@')[1].toLowerCase();
  if (disposableDomains.includes(domain)) {
    return false;
  }

  return true;
};

const sanitizeInput = (input: string): string => {
  // Remove any HTML tags
  const withoutHtml = input.replace(/<[^>]*>/g, '');
  // Remove any script tags
  const withoutScripts = withoutHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Trim whitespace
  return withoutScripts.trim();
};

export async function subscribeToNewsletter(email: string, firstName?: string, lastName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('=== Newsletter Subscription Request ===');
    console.log('Email:', email);
    console.log('First Name:', firstName);
    console.log('Last Name:', lastName);

    // Validate email
    if (!validateEmail(email)) {
      throw new Error('Invalid email address. Please use a valid email address.');
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedFirstName = firstName ? sanitizeInput(firstName) : undefined;
    const sanitizedLastName = lastName ? sanitizeInput(lastName) : undefined;

    // Validate input lengths
    if (sanitizedFirstName && sanitizedFirstName.length > 50) {
      throw new Error('First name is too long. Maximum length is 50 characters.');
    }
    if (sanitizedLastName && sanitizedLastName.length > 50) {
      throw new Error('Last name is too long. Maximum length is 50 characters.');
    }

    const response = await fetch('/.netlify/functions/subscribe-newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: sanitizedEmail, 
        firstName: sanitizedFirstName, 
        lastName: sanitizedLastName 
      }),
    });

    console.log('=== Newsletter Subscription Response ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response Data:', data);

    if (!response.ok) {
      console.error('Subscription failed:', data.error);
      throw new Error(data.error || 'Failed to subscribe to newsletter');
    }

    return { success: true };
  } catch (error) {
    console.error('=== Newsletter Subscription Error ===');
    console.error('Error details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to subscribe to newsletter' 
    };
  }
}