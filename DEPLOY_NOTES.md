Deploy notes
============

Summary of changes:

- Added automatic sitemap generation: `scripts/generate-sitemap.js`
- Generated `public/sitemap.xml` (uses canonical base URL `https://infermieriweb.it`)
- Generated `public/robots.txt` referencing the sitemap
- `package.json` build script updated to run sitemap generation before `vite build`
- Sitemap `lastmod` values computed from `updatedAt`, `date`, or fallback to `src/data/articles.js` mtime
- Fixed CSS syntax error in `src/App.css` and removed duplicate import in `src/pages/Home.jsx`

Verification:

- `npm run build` completes successfully and writes `dist/` output
- `public/sitemap.xml` contains homepage, static pages, `/articoli` and all article URLs from `src/data/articles.js`
- `public/robots.txt` contains `Sitemap: https://infermieriweb.it/sitemap.xml`

Deploy instructions / guidance:

1. The build pipeline already runs the sitemap generator before build via `npm run build`.
2. Ensure the CI environment runs `npm ci` / `npm install` and then `npm run build` as usual; the generator will write `public/sitemap.xml` and `public/robots.txt` and Vite will include them in the final `dist/` output.
3. Do NOT manually overwrite `public/sitemap.xml` or `public/robots.txt` in the repository; the generator maintains them during each build. If you must provide a custom robots policy, update the generator instead.
4. `SITEMAP_BASE_URL` is hardcoded to `https://infermieriweb.it` in the generator per request. If you later want to make it environment-specific, change `scripts/generate-sitemap.js` to read from `process.env.SITEMAP_BASE_URL`.

Notes and next steps:

- If in future articles are converted to individual files (e.g. `src/content/<slug>.md`), update the generator to read file mtimes per-article to get more accurate `lastmod` values.
- Optionally submit `https://infermieriweb.it/sitemap.xml` to Google Search Console for faster indexing.
