import { Handler } from '@netlify/functions';
import { generateMerchantFeed, convertToXML } from '../../src/utils/merchantFeed';
import fs from 'fs';
import path from 'path';

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_FILE = path.join(process.cwd(), 'public', 'feeds', 'merchant-products.xml');
const CACHE_META_FILE = path.join(process.cwd(), 'public', 'feeds', 'merchant-products.meta.json');

interface CacheMeta {
  lastGenerated: number;
  productCount: number;
}

function readCacheMeta(): CacheMeta | null {
  try {
    if (fs.existsSync(CACHE_META_FILE)) {
      const meta = JSON.parse(fs.readFileSync(CACHE_META_FILE, 'utf-8'));
      return meta;
    }
  } catch (error) {
    console.error('Error reading cache meta:', error);
  }
  return null;
}

function writeCacheMeta(meta: CacheMeta): void {
  try {
    fs.mkdirSync(path.dirname(CACHE_META_FILE), { recursive: true });
    fs.writeFileSync(CACHE_META_FILE, JSON.stringify(meta, null, 2));
  } catch (error) {
    console.error('Error writing cache meta:', error);
  }
}

function isCacheValid(): boolean {
  const meta = readCacheMeta();
  if (!meta) return false;

  const now = Date.now();
  return (now - meta.lastGenerated) < CACHE_DURATION;
}

const handler: Handler = async (event) => {
  console.log('Feed generation started');
  
  try {
    // Check if we have a valid cached feed
    if (isCacheValid() && fs.existsSync(CACHE_FILE)) {
      console.log('Returning cached feed');
      const feed = fs.readFileSync(CACHE_FILE, 'utf-8');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
        body: feed
      };
    }

    // Set environment variables for the Shopify client
    const storeDomain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!storeDomain || !accessToken) {
      console.error('Missing required environment variables:', { storeDomain, accessToken });
      throw new Error('Missing required environment variables');
    }

    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_URL = `https://${storeDomain}/api/2024-01/graphql`;
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = accessToken;

    console.log('Fetching products...');
    const products = await generateMerchantFeed();
    console.log(`Successfully fetched ${products.length} products`);

    if (products.length === 0) {
      throw new Error('No products were fetched');
    }

    console.log('Converting to XML...');
    const xml = convertToXML(products);
    console.log('XML conversion complete');

    // Write the feed to a file in the public directory
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, xml);

    // Write cache metadata
    writeCacheMeta({
      lastGenerated: Date.now(),
      productCount: products.length
    });

    console.log('Feed file written successfully');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
      body: xml
    };
  } catch (error) {
    console.error('Error generating feed:', error);
    
    // If we have a cached feed, return it even if it's expired
    if (fs.existsSync(CACHE_FILE)) {
      console.log('Returning expired cached feed due to error');
      const feed = fs.readFileSync(CACHE_FILE, 'utf-8');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
        body: feed
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Error generating feed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler }; 