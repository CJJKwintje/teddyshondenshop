import { Handler } from '@netlify/functions';
import { generateMerchantFeed, convertToXML } from '../../src/utils/merchantFeed';
import fs from 'fs';
import path from 'path';

const handler: Handler = async (event) => {
  console.log('Manual feed generation triggered');
  
  try {
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

    // Write the feed to a file in the public directory
    const feedPath = path.join(process.cwd(), 'public', 'feeds', 'merchant-products.xml');
    fs.mkdirSync(path.dirname(feedPath), { recursive: true });
    fs.writeFileSync(feedPath, xml);

    console.log('Feed file written successfully');
    return { 
      statusCode: 200, 
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Feed generated successfully',
        productCount: products.length
      })
    };
  } catch (error) {
    console.error('Error generating feed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
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