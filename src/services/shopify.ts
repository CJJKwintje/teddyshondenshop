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
  mutation cartCreate {
    cartCreate {
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
  lineItems: { variantId: string; quantity: number }[]
) => {
  try {
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error('Winkelwagen is leeg');
    }

    // First create a new cart
    const createCartResult = await executeWithRetry(async () => {
      const response = await shopifyClient
        .mutation(CREATE_CART_MUTATION, {})
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