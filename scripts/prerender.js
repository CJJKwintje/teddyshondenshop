import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { Server } from 'node-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define all routes to pre-render (without trailing slashes)
const routes = [
  // Main pages
  '/',
  '/over-ons',
  '/algemene-voorwaarden',
  '/privacy-policy',
  '/contact',
  '/veelgestelde-vragen',
  
  // Main categories
  '/categorie/hondenvoeding',
  '/categorie/hondensnacks',
  '/categorie/op-pad',
  '/categorie/slapen',
  '/categorie/hondenkleding',
  
  // Hondenvoeding subcategories
  '/categorie/hondenvoeding/droogvoer',
  '/categorie/hondenvoeding/diepvriesvoer',
  '/categorie/hondenvoeding/natvoer',
  '/categorie/hondenvoeding/graanvrij-hondenvoer',
  '/categorie/hondenvoeding/hypoallergeen-hondenvoer',
  '/categorie/hondenvoeding/biologisch-hondenvoer',
  
  // Hondensnacks subcategories
  '/categorie/hondensnacks/gedroogde-hondensnacks',
  '/categorie/hondensnacks/zachte-hondensnacks',
  '/categorie/hondensnacks/kauwsnacks-honden',
  
  // Op pad subcategories
  '/categorie/op-pad/hond-vervoeren',
  '/categorie/op-pad/hondenriemen-en-halsbanden',
  '/categorie/op-pad/hondenluiken',
  
  // Slapen subcategories
  '/categorie/slapen/hondenmanden',
  '/categorie/slapen/hondenkussens',
  '/categorie/slapen/hondendekens',
  
  // Hondenkleding subcategories
  '/categorie/hondenkleding/hondenjassen',
  '/categorie/hondenkleding/hondensokken'
];

async function prerender() {
  console.log('Starting pre-rendering...');
  
  // Start a local server to serve the dist directory
  const fileServer = new Server(path.join(__dirname, '..', 'dist'));
  const server = createServer((req, res) => {
    req.addListener('end', () => {
      // Clean up the URL path
      const url = req.url.split('?')[0];
      console.log(`\n[Server] Request received for: ${url}`);
      
      // Skip prerendering for product pages
      if (url.startsWith('/product/')) {
        console.log(`[Server] Skipping prerender for product page: ${url}`);
        req.url = '/index.html';
        fileServer.serve(req, res);
        return;
      }
      
      // Serve index.html for all other routes (SPA)
      if (!url.includes('.')) {
        // Ensure the path is properly formatted
        const path = url.endsWith('/') ? url.slice(0, -1) : url;
        req.url = path === '' ? '/index.html' : `${path}/index.html`;
        console.log(`[Server] Serving SPA route: ${req.url}`);
      }
      
      fileServer.serve(req, res);
    }).resume();
  }).listen(3000);

  try {
    // Get Chrome executable path from environment or use default
    const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                      process.env.CHROME_BIN || 
                      undefined;

    console.log('\n[Setup] Chrome executable path:', chromePath || 'using default');

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

    console.log(`\n[Setup] Starting prerender for ${routes.length} routes`);

    for (const route of routes) {
      console.log(`\n[Prerender] Starting prerender for: ${route}`);
      
      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate to the page
      console.log(`[Prerender] Navigating to: http://localhost:3000${route}`);
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle0'
      });

      // Wait for the main content to be loaded
      console.log('[Prerender] Waiting for #root element...');
      await page.waitForSelector('#root');
      
      // Wait for React to hydrate and render content
      console.log('[Prerender] Waiting for content to load...');
      await page.waitForFunction(() => {
        // Check if the page has meaningful content
        const hasContent = document.querySelector('.prose') || 
                         document.querySelector('.grid') ||
                         document.querySelector('.container') ||
                         document.querySelector('.faq-content');
        return hasContent && hasContent.textContent.length > 0;
      }, { timeout: 10000 });
      
      // Additional wait to ensure all dynamic content is loaded
      console.log('[Prerender] Additional wait for dynamic content...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the HTML content
      const html = await page.content();
      
      // Create the directory if it doesn't exist
      const dir = path.join(__dirname, '..', 'dist', route === '/' ? '' : route);
      if (route !== '/') {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[Prerender] Created directory: ${dir}`);
      }
      
      // Write the pre-rendered HTML to a file
      const filePath = route === '/' 
        ? path.join(__dirname, '../dist/index.html')
        : path.join(dir, 'index.html');
      
      fs.writeFileSync(filePath, html);
      console.log(`[Prerender] Wrote HTML to: ${filePath}`);
      
      await page.close();
      console.log(`[Prerender] ✓ Successfully prerendered ${route}`);
    }

    await browser.close();
    console.log('\n[Complete] Pre-rendering completed successfully!');
  } catch (error) {
    console.error('\n[Error] Error during pre-rendering:', error);
    process.exit(1);
  } finally {
    server.close();
    console.log('[Cleanup] Server closed');
  }
}

prerender(); 