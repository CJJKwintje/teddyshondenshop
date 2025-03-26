import { Handler } from '@netlify/functions';
import { generateMerchantFeed, convertToXML } from '../../src/utils/merchantFeed';
import fs from 'fs';
import path from 'path';

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let cachedFeed: string | null = null;
let lastGenerated: number = 0;

const handler: Handler = async (event) => {
  console.log('Feed generation started');
  
  try {
    // Check if we have a valid cached feed
    const now = Date.now();
    if (cachedFeed && (now - lastGenerated) < CACHE_DURATION) {
      console.log('Returning cached feed');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
        },
        body: cachedFeed
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

    // Update cache
    cachedFeed = xml;
    lastGenerated = now;

    // Write the feed to a file in the public directory
    const feedPath = path.join(process.cwd(), 'public', 'feeds', 'merchant-products.xml');
    fs.mkdirSync(path.dirname(feedPath), { recursive: true });
    fs.writeFileSync(feedPath, xml);

    console.log('Feed file written successfully');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
      body: xml
    };
  } catch (error) {
    console.error('Error generating feed:', error);
    
    // If we have a cached feed, return it even if it's expired
    if (cachedFeed) {
      console.log('Returning expired cached feed due to error');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
        },
        body: cachedFeed
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error generating feed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler }; 