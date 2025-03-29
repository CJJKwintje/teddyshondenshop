import { generateMerchantFeed, convertToXML } from '../src/utils/merchantFeed.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFeed() {
  console.log('Feed generation started');
  
  try {
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
    const feedPath = path.join(__dirname, '..', 'public', 'feeds', 'merchant-products.xml');
    fs.mkdirSync(path.dirname(feedPath), { recursive: true });
    fs.writeFileSync(feedPath, xml);

    console.log('Feed file written successfully');
  } catch (error) {
    console.error('Error generating feed:', error);
    process.exit(1);
  }
}

generateFeed(); 