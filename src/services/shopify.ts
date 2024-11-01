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

export const createCheckout = async (lineItems: { variantId: string; quantity: number }[]) => {
  const result = await shopifyClient.mutation(CREATE_CHECKOUT_MUTATION, {
    lineItems
  }).toPromise();

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (result.data?.checkoutCreate?.checkoutUserErrors?.length > 0) {
    throw new Error(result.data.checkoutCreate.checkoutUserErrors[0].message);
  }

  return result.data.checkoutCreate.checkout;
};