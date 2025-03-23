import { Handler } from '@netlify/functions';
import { generateMerchantFeed, convertToCSV } from '../../src/utils/merchantFeed';

const handler: Handler = async (event) => {
  try {
    // Set environment variables for the Shopify client
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_URL = `https://${process.env.VITE_SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql`;
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    const products = await generateMerchantFeed();
    const csv = convertToCSV(products);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/csv',
        'Content-Disposition': 'attachment; filename=merchant-products.csv',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
      },
      body: csv,
    };
  } catch (error) {
    console.error('Error generating merchant feed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error generating feed' }),
    };
  }
};

export { handler }; 