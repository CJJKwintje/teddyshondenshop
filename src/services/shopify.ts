import { Client, cacheExchange, fetchExchange } from 'urql';

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
      throw new Error('Invalid line items provided');
    }

    // Ensure variant IDs are in the correct format
    const formattedLineItems = lineItems.map(item => {
      if (!item.variantId || !item.quantity) {
        throw new Error('Invalid line item: missing required fields');
      }
      
      return {
        variantId: item.variantId,
        quantity: Math.max(1, Math.floor(item.quantity)) // Ensure quantity is a positive integer
      };
    });

    const result = await shopifyClient
      .mutation(CREATE_CHECKOUT_MUTATION, {
        lineItems: formattedLineItems,
      })
      .toPromise();

    if (!result.data && result.error) {
      console.error('Shopify API Error:', result.error);
      throw new Error('Failed to create checkout: Network error');
    }

    if (result.data?.checkoutCreate?.checkoutUserErrors?.length > 0) {
      const error = result.data.checkoutCreate.checkoutUserErrors[0];
      console.error('Checkout Error:', error);
      throw new Error(`Checkout error: ${error.message}`);
    }

    if (!result.data?.checkoutCreate?.checkout) {
      throw new Error('No checkout data received');
    }

    return result.data.checkoutCreate.checkout;
  } catch (error) {
    console.error('Checkout creation error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during checkout'
    );
  }
};