import { NextApiRequest, NextApiResponse } from 'next';
import { generateMerchantFeed, convertToCSV } from '../../../utils/merchantFeed';

// Cache the feed for 1 hour
let cachedFeed: string | null = null;
let lastGenerated: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if we have a valid cached feed
    const now = Date.now();
    if (cachedFeed && (now - lastGenerated) < CACHE_DURATION) {
      return res
        .status(200)
        .setHeader('Content-Type', 'text/csv')
        .setHeader('Content-Disposition', 'inline; filename=merchant-products.csv')
        .send(cachedFeed);
    }

    // Generate new feed
    const products = await generateMerchantFeed();
    const csv = convertToCSV(products);

    // Update cache
    cachedFeed = csv;
    lastGenerated = now;

    return res
      .status(200)
      .setHeader('Content-Type', 'text/csv')
      .setHeader('Content-Disposition', 'inline; filename=merchant-products.csv')
      .send(csv);
  } catch (error) {
    console.error('Error generating merchant feed:', error);
    return res.status(500).json({ message: 'Error generating feed' });
  }
} 