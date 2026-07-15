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
  const accent = colorMap[key] || '#00897b';
  const label = (category || 'Guida').toUpperCase();
  const safeTitle = String(title || 'Articolo').slice(0, 46);

  // Copertina brand: gradiente della piattaforma + croce sanitaria, niente finti scheletri
  const svg = `
<svg width="900" height="540" viewBox="0 0 900 540" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}" />
      <stop offset="1" stop-color="#065f52" />
    </linearGradient>
  </defs>
  <rect width="900" height="540" fill="url(#g)" />
  <circle cx="780" cy="90" r="220" fill="#ffffff" fill-opacity="0.06" />
  <circle cx="120" cy="470" r="180" fill="#ffffff" fill-opacity="0.05" />
  <g transform="translate(660, 300)" fill="#ffffff" fill-opacity="0.16">
    <rect x="-36" y="-110" width="72" height="220" rx="20" />
    <rect x="-110" y="-36" width="220" height="72" rx="20" />
  </g>
  <rect x="56" y="60" rx="999" width="${44 + label.length * 15}" height="46" fill="#ffffff" fill-opacity="0.18" />
  <text x="78" y="91" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="1">${label}</text>
  <text x="56" y="300" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800">${safeTitle}</text>
  <text x="56" y="470" fill="#ffffff" fill-opacity="0.85" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600">InfermieriWeb · guide per pazienti e famiglie</text>
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
