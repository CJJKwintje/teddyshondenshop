import { Client, cacheExchange, fetchExchange } from 'urql';

const SHOPIFY_STORE_URL = 'https://yvdedm-5e.myshopify.com/api/2024-01/graphql';
const SHOPIFY_STOREFRONT_TOKEN = 'f2891c0e910edc30275cac0cc8e32cff';

// Maximum number of retry attempts
const MAX_RETRIES = 3;
// Base delay between retries (in milliseconds)
const BASE_RETRY_DELAY = 1000;

export const shopifyClient = new Client({
  url: SHOPIFY_STORE_URL,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: {
    headers: {
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
  },
});

export const PRODUCTS_QUERY = `
  query Products {
    products(first: 6) {
      edges {
        node {
          id
          title
          description
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          productType
        }
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
    if (retryCount >= MAX_RETRIES) {
      throw error;
    }

    // Calculate exponential backoff delay
    const backoffDelay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
    // Add some random jitter
    const jitter = Math.random() * 1000;
    const totalDelay = backoffDelay + jitter;

    await delay(totalDelay);
    
    return executeWithRetry(operation, retryCount + 1);
  }
};

export const CREATE_CHECKOUT_MUTATION = `
  mutation checkoutCreate($lineItems: [CheckoutLineItemInput!]!) {
    checkoutCreate(input: {
      lineItems: $lineItems
    }) {
      checkout {
        id
        webUrl
        totalPriceV2 {
          amount
          currencyCode
        }
      }
      checkoutUserErrors {
        code
        field
        message
      }
    }
  }
`;

export const createCheckout = async (
  lineItems: { variantId: string; quantity: number }[]
) => {
  try {
    // Validate input
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error('Winkelwagen is leeg');
    }

    // Ensure variant IDs are in the correct format
    const formattedLineItems = lineItems.map(item => {
      if (!item.variantId || !item.quantity) {
        throw new Error('Ongeldige product gegevens');
      }
      
      return {
        variantId: item.variantId,
        quantity: Math.max(1, Math.floor(item.quantity))
      };
    });

    // Execute mutation with retry logic
    const result = await executeWithRetry(async () => {
      const response = await shopifyClient
        .mutation(CREATE_CHECKOUT_MUTATION, {
          lineItems: formattedLineItems,
        })
        .toPromise();

      if (!response.data && response.error) {
        throw new Error('Netwerkfout: Kan geen verbinding maken met de betaalservice');
      }

      return response;
    });

    if (result.data?.checkoutCreate?.checkoutUserErrors?.length > 0) {
      const error = result.data.checkoutCreate.checkoutUserErrors[0];
      console.error('Checkout Error:', error);
      throw new Error(`Fout bij afrekenen: ${error.message}`);
    }

    if (!result.data?.checkoutCreate?.checkout) {
      throw new Error('Geen checkout gegevens ontvangen van de betaalservice');
    }

    return result.data.checkoutCreate.checkout;
  } catch (error) {
    console.error('Checkout creation error:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        throw new Error('Controleer je internetverbinding en probeer het opnieuw');
      }
      throw error;
    }
    
    throw new Error('Er is een onverwachte fout opgetreden. Probeer het later opnieuw');
  }
};