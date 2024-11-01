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