import { gql } from 'urql';
import { shopifyClient } from '../services/shopify';
import { stripHtml } from 'string-strip-html';

const PRODUCTS_PER_PAGE = 250;

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  vendor: string;
  images: {
    edges: Array<{
      node: {
        originalSrc: string;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        price: {
          amount: string;
        };
        compareAtPrice: {
          amount: string;
        };
        availableForSale: boolean;
        weight: number;
        weightUnit: string;
        barcode: string;
      };
    }>;
  };
}

interface ProductsQueryResponse {
  products: {
    edges: Array<{
      node: ShopifyProduct;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  };
}

const PRODUCTS_QUERY = gql`
  query GetProductsForFeed($cursor: String) {
    products(first: ${PRODUCTS_PER_PAGE}, after: $cursor) {
      edges {
        node {
          id
          title
          description
          handle
          vendor
          images(first: 1) {
            edges {
              node {
                originalSrc
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                price {
                  amount
                }
                compareAtPrice {
                  amount
                }
                availableForSale
                weight
                weightUnit
                barcode
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

interface ProductFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  availability: 'in stock' | 'out of stock';
  price: string;
  sale_price: string;
  brand: string;
  shipping_weight: string;
  gtin: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllProducts(): Promise<any[]> {
  let allProducts: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    try {
      const result: { data?: ProductsQueryResponse; error?: Error } = await shopifyClient.query<ProductsQueryResponse>(PRODUCTS_QUERY, { cursor });

      if (result.error) {
        console.error('Error fetching products for feed:', result.error);
        throw result.error;
      }

      if (!result.data) {
        throw new Error('No data received from Shopify');
      }

      allProducts = [...allProducts, ...result.data.products.edges];
      hasNextPage = result.data.products.pageInfo.hasNextPage;
      cursor = result.data.products.pageInfo.endCursor;

      // Log progress
      console.log(`Fetched ${allProducts.length} products so far...`);

      // Add a small delay between requests to prevent rate limiting
      if (hasNextPage) {
        await delay(1000); // 1 second delay between requests
      }
    } catch (error) {
      console.error('Error during pagination:', error);
      // If we have products, return what we have instead of failing completely
      if (allProducts.length > 0) {
        console.log(`Returning ${allProducts.length} products despite error`);
        return allProducts;
      }
      throw error;
    }
  }

  console.log(`Finished fetching all ${allProducts.length} products`);
  return allProducts;
}

export async function generateMerchantFeed(): Promise<ProductFeedItem[]> {
  try {
    const products = await fetchAllProducts();

    return products.map(({ node }: any) => {
      const variant = node.variants.edges[0]?.node;
      const image = node.images.edges[0]?.node;
      const price = parseFloat(variant?.price?.amount || '0');
      const compareAtPrice = parseFloat(variant?.compareAtPrice?.amount || '0');
      const isOnSale = compareAtPrice > price;

      // Get weight from variant only
      const weight = variant?.weight || 0;
      const weightUnit = variant?.weightUnit || 'KILOGRAMS';
      
      // Convert weight to grams (Google Merchant requirement)
      const weightInGrams = weightUnit === 'KILOGRAMS' ? weight * 1000 : weight;

      // Get GTIN from variant barcode
      const gtin = variant?.barcode || '';

      return {
        id: node.id.split('/').pop(),
        title: node.title,
        description: stripHtml(node.description).result,
        link: `https://teddyshondenshop.nl/product/${node.handle}`,
        image_link: image?.originalSrc || '',
        availability: variant?.availableForSale ? 'in stock' : 'out of stock',
        price: isOnSale ? `${compareAtPrice.toFixed(2)} EUR` : `${price.toFixed(2)} EUR`,
        sale_price: isOnSale ? `${price.toFixed(2)} EUR` : '',
        brand: node.vendor,
        shipping_weight: `${weightInGrams}g`,
        gtin
      };
    });
  } catch (error) {
    console.error('Error generating merchant feed:', error);
    throw error;
  }
}

export function convertToXML(products: ProductFeedItem[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const rssHeader = '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n';
  const channelHeader = '<channel>\n';
  const channelFooter = '</channel>\n';
  const rssFooter = '</rss>';

  const items = products.map(product => {
    const item = [
      '  <item>',
      `    <g:id>${product.id}</g:id>`,
      `    <title>${escapeXml(product.title)}</title>`,
      `    <description>${escapeXml(product.description)}</description>`,
      `    <link>${escapeXml(product.link)}</link>`,
      `    <g:image_link>${escapeXml(product.image_link)}</g:image_link>`,
      `    <g:availability>${product.availability}</g:availability>`,
      `    <g:price>${product.price}</g:price>`,
      product.sale_price ? `    <g:sale_price>${product.sale_price}</g:sale_price>` : '',
      `    <g:brand>${escapeXml(product.brand)}</g:brand>`,
      `    <g:shipping_weight>${product.shipping_weight}</g:shipping_weight>`,
      product.gtin ? `    <g:gtin>${product.gtin}</g:gtin>` : '',
      '  </item>'
    ].filter(Boolean).join('\n');

    return item;
  }).join('\n\n');

  return xmlHeader + rssHeader + channelHeader + items + '\n' + channelFooter + rssFooter;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
} 