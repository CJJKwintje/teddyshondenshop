import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'contentful-data.json');

if (!fs.existsSync(filePath)) {
  console.error('ERROR: public/contentful-data.json is missing! Please generate it before building.');
  process.exit(1);
} else {
  console.log('Pre-build check passed: public/contentful-data.json exists.');
} 