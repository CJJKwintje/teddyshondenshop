import { gql } from 'urql';
import { shopifyClient } from '../services/shopify.js';
import { stripHtml } from 'string-strip-html';
import { CATEGORY_MAPPING } from '../pages/ProductsPage';

const PRODUCTS_PER_PAGE = 250;

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  vendor: string;
  collections: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        handle: string;
        metafields(first: number, namespace: string, key: string): {
          edges: Array<{
            node: {
              value: string;
            };
          }>;
        };
      };
    }>;
  };
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
        id: string;
        title: string;
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
        selectedOptions: Array<{
          name: string;
          value: string;
        }>;
        image: {
          originalSrc: string;
        };
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
          collections(first: 10) {
            edges {
              node {
                id
                title
                handle
                metafield(namespace: "custom", key: "parent_collection") {
                  value
                }
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                originalSrc
              }
            }
          }
          variants(first: 250) {
            edges {
              node {
                id
                title
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
                selectedOptions {
                  name
                  value
                }
                image {
                  originalSrc
                }
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
  additional_image_links?: string[];
  availability: 'in stock' | 'out of stock';
  price: string;
  sale_price: string;
  brand: string;
  shipping_weight: string;
  gtin: string;
  condition: 'new' | 'refurbished' | 'used';
  item_group_id: string;
  product_type: string;
  custom_label_0?: string;
  size?: string;
  color?: string;
  material?: string;
  pattern?: string;
  gender?: string;
  age_group?: string;
}

interface CategoryMapping {
  label: string;
  productTypes: string[];
}

// Helper function to delay execution with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle rate limiting
async function handleRateLimit(response: any): Promise<number> {
  const retryAfter = response.headers?.get('Retry-After');
  if (retryAfter) {
    const waitTime = parseInt(retryAfter, 10) * 1000; // Convert to milliseconds
    console.log(`Rate limit hit. Waiting ${waitTime}ms before retrying...`);
    await delay(waitTime);
    return waitTime;
  }
  return 0;
}

async function fetchAllProducts(): Promise<any[]> {
  let allProducts: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  let consecutiveErrors = 0;
  const MAX_RETRIES = 3;
  const BASE_DELAY = 200; // Base delay between requests in milliseconds

  while (hasNextPage) {
    try {
      const result: { data?: ProductsQueryResponse; error?: Error; response?: any } = await shopifyClient.query<ProductsQueryResponse>(PRODUCTS_QUERY, { cursor });

      // Reset consecutive errors on successful request
      consecutiveErrors = 0;

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
        await delay(BASE_DELAY);
      }
    } catch (error: any) {
      consecutiveErrors++;
      
      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        const waitTime = await handleRateLimit(error.response);
        console.log(`Retrying after rate limit (attempt ${consecutiveErrors}/${MAX_RETRIES})...`);
        continue; // Retry the same request
      }

      // If we've hit max retries, either return what we have or throw
      if (consecutiveErrors >= MAX_RETRIES) {
        console.error(`Failed after ${MAX_RETRIES} consecutive attempts`);
        if (allProducts.length > 0) {
          console.log(`Returning ${allProducts.length} products despite error`);
          return allProducts;
        }
        throw error;
      }

      // For other errors, implement exponential backoff
      const backoffTime = Math.min(1000 * Math.pow(2, consecutiveErrors), 10000);
      console.log(`Error occurred. Waiting ${backoffTime}ms before retry (attempt ${consecutiveErrors}/${MAX_RETRIES})...`);
      await delay(backoffTime);
    }
  }

  console.log(`Finished fetching all ${allProducts.length} products`);
  return allProducts;
}

// Helper function to determine the category and subcategory
function getCategoryAndSubcategory(collections: any[]): { category: string; subcategory: string | null } {
  // First, get all collection titles
  const collectionTitles = collections.map(c => c.node.title);
  
  // Find the main category by checking product types against CATEGORY_MAPPING
  let mainCategory = '';
  let subcategory = null;

  // First try to find a subcategory (product type)
  for (const [category, mapping] of Object.entries(CATEGORY_MAPPING)) {
    const categoryMapping = mapping as CategoryMapping;
    const matchingProductType = collectionTitles.find(title => 
      categoryMapping.productTypes.includes(title.toUpperCase())
    );
    
    if (matchingProductType) {
      mainCategory = category;
      subcategory = matchingProductType;
      break;
    }
  }

  // If no subcategory found, try to match the collection title directly to a main category
  if (!mainCategory) {
    for (const [category, mapping] of Object.entries(CATEGORY_MAPPING)) {
      if (collectionTitles.includes(category)) {
        mainCategory = category;
        break;
      }
    }
  }

  // If still no category found, use "Overige" as default category
  if (!mainCategory) {
    mainCategory = "Overige";
  }

  return {
    category: mainCategory,
    subcategory: subcategory
  };
}

export async function generateMerchantFeed(): Promise<ProductFeedItem[]> {
  try {
    const products = await fetchAllProducts();

    return products.flatMap(({ node }: any) => {
      const productId = node.id.split('/').pop();
      
      // Get all product images
      const productImages = node.images.edges.map((edge: any) => edge.node.originalSrc);
      const mainImage = productImages[0] || '';
      const additionalImages = productImages.slice(1);
      
      // Get category and subcategory
      const { category, subcategory } = getCategoryAndSubcategory(node.collections.edges);
      
      // Process each variant of the product
      return node.variants.edges.map(({ node: variant }: any) => {
        const price = parseFloat(variant?.price?.amount || '0');
        const compareAtPrice = parseFloat(variant?.compareAtPrice?.amount || '0');
        const isOnSale = compareAtPrice > price;

        // Get weight from variant
        const weight = variant?.weight || 0;
        const weightUnit = variant?.weightUnit || 'KILOGRAMS';
        const weightInGrams = weightUnit === 'KILOGRAMS' ? weight * 1000 : weight;

        // Get GTIN from variant barcode
        const gtin = variant?.barcode || '';

        // Process variant options
        const variantOptions: Record<string, string> = {};
        variant.selectedOptions.forEach((option: { name: string; value: string }) => {
          const name = option.name.toLowerCase();
          if (name.includes('size') || name.includes('maat')) {
            variantOptions.size = option.value;
          } else if (name.includes('color') || name.includes('kleur')) {
            variantOptions.color = option.value;
          } else if (name.includes('material') || name.includes('materiaal')) {
            variantOptions.material = option.value;
          } else if (name.includes('pattern') || name.includes('patroon')) {
            variantOptions.pattern = option.value;
          } else if (name.includes('gender') || name.includes('geslacht')) {
            variantOptions.gender = option.value;
          } else if (name.includes('age') || name.includes('leeftijd')) {
            variantOptions.age_group = option.value;
          }
        });

        // Create title with size if available
        const titleSuffix = variantOptions.size 
          ? ` - ${variantOptions.size}`
          : '';

        // Use variant image if available, otherwise use main product image
        const variantImage = variant.image?.originalSrc;
        const imageLink = variantImage || mainImage;

        return {
          id: `${productId}_${variant.id.split('/').pop()}`,
          title: `${node.title}${titleSuffix}`,
          description: stripHtml(node.description).result,
          link: `https://teddyshondenshop.nl/product/${node.handle}?variant=${variant.id.split('/').pop()}`,
          image_link: imageLink,
          additional_image_links: variantImage ? undefined : additionalImages,
          availability: variant?.availableForSale ? 'in stock' : 'out of stock',
          price: isOnSale ? `${compareAtPrice.toFixed(2)} EUR` : `${price.toFixed(2)} EUR`,
          sale_price: isOnSale ? `${price.toFixed(2)} EUR` : '',
          brand: node.vendor,
          shipping_weight: `${weightInGrams}g`,
          gtin,
          condition: 'new',
          item_group_id: productId,
          product_type: category,
          custom_label_0: subcategory || undefined,
          ...variantOptions
        };
      });
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
      ...(product.additional_image_links || []).map(img => `    <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`),
      `    <g:availability>${product.availability}</g:availability>`,
      `    <g:price>${product.price}</g:price>`,
      product.sale_price ? `    <g:sale_price>${product.sale_price}</g:sale_price>` : '',
      `    <g:brand>${escapeXml(product.brand)}</g:brand>`,
      `    <g:shipping_weight>${product.shipping_weight}</g:shipping_weight>`,
      product.gtin ? `    <g:gtin>${product.gtin}</g:gtin>` : '',
      `    <g:condition>${product.condition}</g:condition>`,
      `    <g:item_group_id>${product.item_group_id}</g:item_group_id>`,
      product.product_type ? `    <g:product_type>${escapeXml(product.product_type)}</g:product_type>` : '',
      product.custom_label_0 ? `    <g:custom_label_0>${escapeXml(product.custom_label_0)}</g:custom_label_0>` : '',
      product.size ? `    <g:size>${escapeXml(product.size)}</g:size>` : '',
      product.color ? `    <g:color>${escapeXml(product.color)}</g:color>` : '',
      product.material ? `    <g:material>${escapeXml(product.material)}</g:material>` : '',
      product.pattern ? `    <g:pattern>${escapeXml(product.pattern)}</g:pattern>` : '',
      product.gender ? `    <g:gender>${escapeXml(product.gender)}</g:gender>` : '',
      product.age_group ? `    <g:age_group>${escapeXml(product.age_group)}</g:age_group>` : '',
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