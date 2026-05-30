import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const pagesDir = path.join(root, 'src', 'pages');
const articlesPath = path.join(root, 'src', 'data', 'articles.js');

// Canonical site URL (hardcoded as requested)
const BASE_URL = 'https://infermieriweb.it';

function url(loc) {
  return `${BASE_URL.replace(/\/$/, '')}${loc}`;
}

async function loadArticles() {
  try {
    const mod = await import(pathToFileURL(articlesPath).href);
    return mod.articles || mod.default || [];
  } catch (err) {
    console.warn('Could not load articles data:', err.message);
    return [];
  }
}

function kebabCase(name) {
  // convert CamelCase or PascalCase and spaces to kebab-case
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
}

async function discoverPages() {
  const routes = new Set();
  routes.add('/');

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!/\.jsx?$/.test(e.name)) continue;
      const name = e.name.replace(/\.jsx?$/, '');
      const keb = kebabCase(name);
      if (keb === 'home' || keb === 'index') continue;
      // skip files that are clearly dynamic/detail handled via articles
      if (/detail|articolo|article|:slug/.test(keb)) continue;
      routes.add('/' + keb);
    }
  }

  try {
    await walk(pagesDir);
  } catch (err) {
    console.warn('Could not read pages directory:', err.message);
  }
  return Array.from(routes).sort();
}

function buildSitemap(urls) {
  const items = urls
    .map(u => {
      const last = u.lastmod ? new Date(u.lastmod).toISOString().split('T')[0] : new Date().toISOString();
      return `  <url>\n    <loc>${url(u.loc)}</loc>\n    <lastmod>${last}</lastmod>\n    <changefreq>${u.changefreq || 'monthly'}</changefreq>\n    <priority>${u.priority != null ? u.priority : '0.6'}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`;
}

async function ensurePublic() {
  try {
    await fs.mkdir(publicDir, { recursive: true });
  } catch (err) {
    // ignore
  }
}

async function fileMTime(p) {
  try {
    const st = await fs.stat(p);
    return st.mtime.toISOString();
  } catch (err) {
    return undefined;
  }
}

async function run() {
  const pages = await discoverPages();
  const articles = await loadArticles();

  const urls = [];
  // add discovered pages
  for (const p of pages) urls.push({ loc: p, changefreq: 'weekly', priority: p === '/' ? '1.0' : '0.7' });

  // ensure /articoli is present
  if (!pages.includes('/articoli')) {
    urls.push({ loc: '/articoli', changefreq: 'daily', priority: '0.9' });
  }

  // add known static / info pages (cover common routes)
  const known = ['/lavora-con-noi', '/contatti', '/chi-siamo', '/faq', '/servizi'];
  for (const k of known) {
    if (!pages.includes(k)) urls.push({ loc: k, changefreq: 'monthly', priority: '0.7' });
  }

  // determine fallback mtime for articles file
  const articlesFileMtime = await fileMTime(articlesPath);

  // add articles
  for (const a of articles) {
    if (!a.slug) continue;
    let last = undefined;
    if (a.updatedAt) last = a.updatedAt;
    else if (a.date) last = a.date;
    else last = articlesFileMtime;
    urls.push({ loc: `/articoli/${a.slug}`, lastmod: last, changefreq: 'monthly', priority: '0.8' });
  }

  await ensurePublic();
  const xml = buildSitemap(urls);
  const out = path.join(publicDir, 'sitemap.xml');
  await fs.writeFile(out, xml, 'utf8');
  console.log('Wrote sitemap to', out);

  // generate robots.txt referencing the sitemap
  const robots = `User-agent: *\nAllow: /\nSitemap: ${BASE_URL.replace(/\/$/, '')}/sitemap.xml\n`;
  const robotsOut = path.join(publicDir, 'robots.txt');
  await fs.writeFile(robotsOut, robots, 'utf8');
  console.log('Wrote robots.txt to', robotsOut);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
