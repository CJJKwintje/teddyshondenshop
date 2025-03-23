import { gql } from 'urql';
import { shopifyClient } from '../services/shopify';
import { stripHtml } from 'string-strip-html';

const PRODUCTS_QUERY = gql`
  query GetProductsForFeed($cursor: String) {
    products(first: 250, after: $cursor) {
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
}

async function fetchAllProducts(): Promise<any[]> {
  let allProducts: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const { data, error } = await shopifyClient.query(PRODUCTS_QUERY, { cursor });

    if (error) {
      console.error('Error fetching products for feed:', error);
      throw error;
    }

    allProducts = [...allProducts, ...data.products.edges];
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

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

      return {
        id: node.id.split('/').pop(),
        title: node.title,
        description: stripHtml(node.description).result,
        link: `https://teddyshondenshop.nl/product/${node.handle}`,
        image_link: image?.originalSrc || '',
        availability: variant?.availableForSale ? 'in stock' : 'out of stock',
        price: isOnSale ? `${compareAtPrice.toFixed(2)} EUR` : `${price.toFixed(2)} EUR`,
        sale_price: isOnSale ? `${price.toFixed(2)} EUR` : '',
        brand: node.vendor
      };
    });
  } catch (error) {
    console.error('Error generating merchant feed:', error);
    throw error;
  }
}

export function convertToCSV(products: ProductFeedItem[]): string {
  const headers = ['id', 'title', 'description', 'link', 'image_link', 'availability', 'price', 'sale_price', 'brand'];
  const rows = products.map(product => 
    headers.map(header => {
      const value = product[header as keyof ProductFeedItem];
      // Escape commas and quotes in the value
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
} 