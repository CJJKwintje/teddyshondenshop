import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { Server } from 'node-static';
import { createClient } from 'contentful';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Contentful client
const contentfulClient = createClient({
  space: process.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: process.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

// Define static routes (without trailing slashes)
const staticRoutes = [
  // Main pages
  '/',
  '/algemene-voorwaarden',
  '/veelgestelde-vragen'
];

async function getNavigationRoutes() {
  try {
    console.log('\nFetching navigation routes from Contentful...');
    const entries = await contentfulClient.getEntries({
      content_type: 'navigation',
      include: 2,
      order: 'fields.order'
    });

    console.log(`Found ${entries.items.length} navigation entries`);
    const routes = [];
    
    entries.items.forEach((entry, index) => {
      const fields = entry.fields;
      const mainCategorySlug = fields.mainCategory.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      console.log(`\nProcessing navigation entry ${index + 1}:`);
      console.log(`- Main category: ${fields.mainCategory}`);
      console.log(`- Generated slug: ${mainCategorySlug}`);

      // Add main category route
      routes.push(`/categorie/${mainCategorySlug}`);

      // Add subcategory routes
      if (fields.link) {
        console.log(`- Found ${fields.link.length} subcategories`);
        fields.link.forEach((link, linkIndex) => {
          const subCategorySlug = link.fields.title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
          console.log(`  ${linkIndex + 1}. ${link.fields.title} -> /categorie/${mainCategorySlug}/${subCategorySlug}`);
          routes.push(`/categorie/${mainCategorySlug}/${subCategorySlug}`);
        });
      } else {
        console.log('- No subcategories found');
      }
    });

    console.log(`\nTotal dynamic routes generated: ${routes.length}`);
    return routes;
  } catch (error) {
    console.error('Error fetching navigation routes:', error);
    return [];
  }
}

async function prerender() {
  console.log('\n=== Starting Pre-rendering Process ===');
  
  // Fetch dynamic routes from Contentful
  console.log('\nFetching dynamic routes...');
  const dynamicRoutes = await getNavigationRoutes();
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
    // Get Chrome executable path from environment or use default
    const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                      process.env.CHROME_BIN || 
                      undefined;

    console.log('\nChrome executable path:', chromePath || 'using default');

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
      ],
      executablePath: chromePath
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