import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'node-static';

const __dirname = path.resolve();

const staticRoutes = [
  '/',
  '/algemene-voorwaarden',
  '/veelgestelde-vragen'
];

function getDynamicRoutes() {
  const dataPath = path.join(__dirname, 'public', 'contentful-data.json');
  const contentfulData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const navigation = contentfulData.navigation || [];
  const routes = [];
  navigation.forEach((entry) => {
    const mainCategorySlug = entry.slug;
    routes.push(`/categorie/${mainCategorySlug}`);
    [entry.link, entry.link2, entry.link3].forEach((group) => {
      if (group) {
        group.forEach((link) => {
          routes.push(`/categorie/${mainCategorySlug}/${link.fields.slug}`);
        });
      }
    });
  });
  return routes;
}

async function waitForContentfulData(page) {
  try {
    // Wait for the console log that indicates successful data loading
    await page.waitForFunction(() => {
      const logs = window.performance.getEntriesByType('resource');
      return logs.some(log => log.name.includes('contentful-data.json'));
    }, { timeout: 10000 });

    // Additional check to ensure data is loaded
    await page.waitForFunction(() => {
      return window.document.querySelector('[data-contentful-loaded="true"]') !== null;
    }, { timeout: 10000 });

    return true;
  } catch (error) {
    console.error('Error waiting for Contentful data:', error);
    return false;
  }
}

async function prerender() {
  const allRoutes = [...staticRoutes, ...getDynamicRoutes()];
  const fileServer = new Server(path.join(__dirname, 'dist'));
  const server = createServer((req, res) => {
    req.addListener('end', () => {
      if (!req.url.includes('.')) req.url = '/index.html';
      fileServer.serve(req, res);
    }).resume();
  }).listen(3000);

  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: ['--no-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  for (const route of allRoutes) {
    try {
      const page = await browser.newPage();
      
      // Enable request interception to monitor network requests
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      
      // Monitor console logs
      page.on('console', msg => console.log(`[${route}] ${msg.text()}`));

      console.log(`Prerendering ${route}...`);
      await page.goto(`http://localhost:3000${route}`, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for root element
      await page.waitForSelector('#root', { timeout: 10000 });

      // Wait for Contentful data to load
      const dataLoaded = await waitForContentfulData(page);
      if (!dataLoaded) {
        console.error(`Failed to load Contentful data for ${route}`);
        continue;
      }

      // Additional wait to ensure hydration is complete
      await new Promise(r => setTimeout(r, 3000));

      const html = await page.content();
      const dir = path.join(__dirname, 'dist', route === '/' ? '' : route);
      if (route !== '/') fs.mkdirSync(dir, { recursive: true });
      const filePath = route === '/' ? path.join(__dirname, 'dist/index.html') : path.join(dir, 'index.html');
      fs.writeFileSync(filePath, html);
      await page.close();
      console.log(`✓ Prerendered ${route}`);
    } catch (err) {
      console.error(`Error prerendering ${route}:`, err);
    }
  }
  await browser.close();
  server.close();
}

prerender(); 