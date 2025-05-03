import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { Server } from 'node-static';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define static routes (without trailing slashes)
const staticRoutes = [
  // Main pages
  '/',
  '/algemene-voorwaarden',
  '/veelgestelde-vragen'
];

// Read navigation routes from static JSON
function getNavigationRoutesFromJson() {
  const dataPath = path.join(__dirname, '..', 'public', 'contentful-data.json');
  const contentfulData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const navigation = contentfulData.navigation || [];
  const routes = [];
  navigation.forEach((entry) => {
    const mainCategorySlug = entry.slug;
    routes.push(`/categorie/${mainCategorySlug}`);
    if (entry.link) {
      entry.link.forEach((link) => {
        routes.push(`/categorie/${mainCategorySlug}/${link.fields.slug}`);
      });
    }
    if (entry.link2) {
      entry.link2.forEach((link) => {
        routes.push(`/categorie/${mainCategorySlug}/${link.fields.slug}`);
      });
    }
    if (entry.link3) {
      entry.link3.forEach((link) => {
        routes.push(`/categorie/${mainCategorySlug}/${link.fields.slug}`);
      });
    }
  });
  return routes;
}

// Main prerender function
async function prerender() {
  console.log('\n=== Starting Pre-rendering Process ===');

  // Fetch dynamic routes from static JSON
  console.log('\nFetching dynamic routes from static JSON...');
  const dynamicRoutes = getNavigationRoutesFromJson();
  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  console.log('\n=== Routes to Prerender ===');
  console.log('Static routes:', staticRoutes);
  console.log('Dynamic routes:', dynamicRoutes);
  console.log(`Total routes: ${allRoutes.length}`);

  // Start a local server to serve the dist directory
  console.log('\nStarting local server...');
  const fileServer = new Server(path.join(__dirname, '..', 'dist'));
  const server = createServer((req, res) => {
    req.addListener('end', () => {
      // Serve index.html for all routes (SPA)
      if (!req.url.includes('.')) {
        req.url = '/index.html';
      }
      fileServer.serve(req, res);
    }).resume();
  }).listen(3000);

  try {
    console.log('\nLaunching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ]
    });

    for (const route of allRoutes) {
      console.log(`\n=== Pre-rendering ${route} ===`);

      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to the page
      console.log('Navigating to page...');
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle0'
      });

      // Wait for the main content to be loaded
      console.log('Waiting for root element...');
      await page.waitForSelector('#root');

      // Wait for React to hydrate and render content
      console.log('Waiting for content to load...');
      await page.waitForFunction(() => {
        // Check for Contentful Rich Text content
        const hasContentfulContent = document.querySelector('[data-contentful-rich-text]')?.textContent?.length > 0;

        // Check for specific page content
        const hasProseContent = document.querySelector('.prose')?.textContent?.length > 0;
        const hasFaqContent = document.querySelector('.faq-content')?.children?.length > 0;
        const hasLegalContent = document.querySelector('.max-w-4xl')?.textContent?.length > 0;

        // Check for main content sections
        const hasMainContent = document.querySelector('main')?.textContent?.length > 0;
        const hasProductGrid = document.querySelector('.product-grid')?.children?.length > 0;

        return hasContentfulContent || hasProseContent || hasFaqContent || hasLegalContent || hasMainContent || hasProductGrid;
      }, { timeout: 15000 }); // Increased timeout to 15 seconds

      // Additional wait to ensure all dynamic content is loaded
      console.log('Additional wait for dynamic content...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get the HTML content
      console.log('Capturing page content...');
      const html = await page.content();

      // Create the directory if it doesn't exist
      const dir = path.join(__dirname, '..', 'dist', route === '/' ? '' : route);
      if (route !== '/') {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the pre-rendered HTML to a file
      const filePath = route === '/'
        ? path.join(__dirname, '../dist/index.html')
        : path.join(dir, 'index.html');

      fs.writeFileSync(filePath, html);

      await page.close();
      console.log(`✓ Successfully pre-rendered ${route}`);
    }

    await browser.close();
    console.log('\n=== Pre-rendering completed successfully! ===');
  } catch (error) {
    console.error('\nError during pre-rendering:', error);
    process.exit(1);
  } finally {
    server.close();
  }
}

prerender(); 