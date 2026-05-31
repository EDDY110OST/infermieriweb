const colorMap = {
  ecg: '#8bc34a',
  holter: '#4caf50',
  medicazioni: '#3f51b5',
  prelievi: '#009688',
  cateteri: '#795548',
  stomie: '#6d28d9',
  'assistenza domiciliare': '#00897b',
};

function encodeSvg(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildPlaceholder(category, title) {
  const key = String(category || '').toLowerCase();
  const bg = '#f0fdfa';
  const accent = colorMap[key] || '#00897b';
  const label = category || 'Articolo';
  const safeTitle = String(title || 'Articolo').slice(0, 40);

  const svg = `
<svg width="900" height="540" viewBox="0 0 900 540" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="900" height="540" rx="32" fill="${bg}" />
  <rect x="40" y="40" width="220" height="220" rx="32" fill="${accent}" fill-opacity="0.15" />
  <rect x="40" y="292" width="140" height="16" rx="8" fill="${accent}" fill-opacity="0.35" />
  <rect x="40" y="324" width="250" height="16" rx="8" fill="${accent}" fill-opacity="0.25" />
  <rect x="40" y="358" width="180" height="16" rx="8" fill="${accent}" fill-opacity="0.2" />
  <circle cx="740" cy="180" r="100" fill="${accent}" fill-opacity="0.12" />
  <circle cx="760" cy="360" r="62" fill="${accent}" fill-opacity="0.18" />
  <text x="460" y="160" fill="#0f172a" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700">${label}</text>
  <text x="460" y="220" fill="#475569" font-family="Inter, Arial, sans-serif" font-size="24">${safeTitle}</text>
</svg>`;

  return encodeSvg(svg);
}

export function getArticleImage(article) {
  if (article && article.image) {
    return article.image;
  }

  if (!article) {
    return buildPlaceholder('Articolo', 'Contenuto professionale');
  }

  return buildPlaceholder(article.category || 'Articolo', article.title || 'Articolo');
}
