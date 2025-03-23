import { Handler } from '@netlify/functions';
import { generateMerchantFeed, convertToXML } from '../../src/utils/merchantFeed';

// Cache the feed for 1 hour
let cachedFeed: string | null = null;
let lastGenerated: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const handler: Handler = async (event) => {
  console.log('Function started');
  
  try {
    // Check if we have a valid cached feed
    const now = Date.now();
    if (cachedFeed && (now - lastGenerated) < CACHE_DURATION) {
      console.log('Returning cached feed');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': 'inline; filename=merchant-products.xml',
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff'
        },
        body: cachedFeed,
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

    console.log('Converting to XML...');
    const xml = convertToXML(products);
    console.log('XML conversion complete');

    // Cache the feed
    cachedFeed = xml;
    lastGenerated = now;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': 'inline; filename=merchant-products.xml',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
      },
      body: xml,
    };
  } catch (error) {
    console.error('Error in merchant feed function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Error generating feed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler }; 