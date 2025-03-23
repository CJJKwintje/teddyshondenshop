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