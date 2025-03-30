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

    console.log('Chrome executable path:', chromePath || 'using default');

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

    for (const route of routes) {
      console.log(`Pre-rendering ${route}...`);
      
      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate to the page
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle0'
      });

      // Wait for the main content to be loaded
      await page.waitForSelector('#root');
      
      // Wait for React to hydrate and render content
      await page.waitForFunction(() => {
        // Check if the page has meaningful content
        const hasContent = document.querySelector('.prose') || 
                         document.querySelector('.grid') ||
                         document.querySelector('.container') ||
                         document.querySelector('.faq-content');
        return hasContent && hasContent.textContent.length > 0;
      }, { timeout: 10000 });
      
      // Additional wait to ensure all dynamic content is loaded
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the HTML content
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
      console.log(`✓ Pre-rendered ${route}`);
    }

    await browser.close();
    console.log('Pre-rendering completed successfully!');
  } catch (error) {
    console.error('Error during pre-rendering:', error);
    process.exit(1);
  } finally {
    server.close();
  }
}

prerender(); 