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

async function prerender() {
  const allRoutes = [...staticRoutes, ...getDynamicRoutes()];
  const fileServer = new Server(path.join(__dirname, 'dist'));
  const server = createServer((req, res) => {
    req.addListener('end', () => {
      if (!req.url.includes('.')) req.url = '/index.html';
      fileServer.serve(req, res);
    }).resume();
  }).listen(3000);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const route of allRoutes) {
    try {
      const page = await browser.newPage();
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('#root');
      await new Promise(r => setTimeout(r, 2000)); // Wait for hydration
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