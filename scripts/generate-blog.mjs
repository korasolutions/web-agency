import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_PATH = path.join(DATA_DIR, 'blog-index.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE_URL = 'https://koradigitalsolutions.com';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

if (!apiKey) {
  throw new Error('Falta OPENROUTER_API_KEY en las variables del workflow.');
}

const topicPool = [
  'por qué una pyme necesita una web orientada a conversión',
  'errores que hacen que una web de empresa no genere clientes',
  'cómo usar un chatbot con IA para captar leads',
  'automatizaciones con IA para negocios locales',
  'seo local para empresas en Lanzarote',
  'cómo mejorar la velocidad de una web para vender más',
  'qué debe tener una landing page que convierta',
  'cuándo una empresa necesita rediseñar su página web',
  'cómo automatizar respuestas de clientes sin perder calidad',
  'ia aplicada a reservas, formularios y atención al cliente',
  'por qué una web bonita no siempre vende',
  'cómo una pyme puede ahorrar tiempo automatizando procesos',
  'diferencias entre una web corporativa y una landing page',
  'cómo elegir una agencia de desarrollo web y automatización',
  'qué contenido ayuda a posicionar una web de servicios'
];

const categoryMap = {
  'desarrollo-web': 'Desarrollo web',
  'seo': 'SEO',
  'automatizacion': 'Automatización',
  'ia': 'IA',
  'negocios': 'Negocios'
};

await ensureBaseFiles();
const existingIndex = await readJson(INDEX_PATH, { updatedAt: '', posts: [] });
const usedTitles = new Set((existingIndex.posts || []).map((post) => post.title.toLowerCase()));
const recentTopics = new Set((existingIndex.posts || []).slice(0, 30).map((post) => (post.seedTopic || '').toLowerCase()));

const selectedTopic = pickTopic(recentTopics);
const post = await generateArticle(selectedTopic, usedTitles);
const html = renderArticleHtml(post);

await fs.writeFile(path.join(BLOG_DIR, `${post.slug}.html`), html, 'utf8');

const updatedPosts = [
  toIndexEntry(post),
  ...(existingIndex.posts || [])
].slice(0, 300);

await fs.writeFile(
  INDEX_PATH,
  JSON.stringify({ updatedAt: new Date().toISOString(), posts: updatedPosts }, null, 2),
  'utf8'
);

await updateSitemap(updatedPosts);
console.log(`Artículo generado: ${post.title}`);

function pickTopic(recentTopics) {
  const available = topicPool.filter((topic) => !recentTopics.has(topic.toLowerCase()));
  const pool = available.length ? available : topicPool;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function generateArticle(seedTopic, usedTitles) {
  const prompt = `
Eres el equipo editorial SEO de KORA Digital Solutions.

Contexto de marca:
- KORA es una agencia digital que crea webs de alto impacto y sistemas de IA para que los negocios conviertan más y trabajen menos.
- Cliente ideal: negocios locales y pymes que quieren digitalizarse rápido.
- Servicios: desarrollo web, rediseño web, automatizaciones con IA, chatbots, formularios inteligentes, reservas, FAQs dinámicas.
- Tono: profesional, claro, cercano, práctico, sin relleno.

Objetivo:
Crear un artículo SEO en español, útil de verdad y pensado para posicionar y convertir.

Tema semilla: ${seedTopic}

Instrucciones obligatorias:
- Devuelve SOLO JSON válido.
- No metas markdown de cierre ni comentarios.
- El artículo debe ser original y profundo.
- Longitud del contenido HTML: entre 1200 y 1800 palabras.
- Enfocado en intención informacional/comercial.
- Incluye al final un bloque CTA suave hacia KORA.
- No inventes estadísticas concretas.
- No abuses del nombre KORA.
- No escribas frases vacías.
- Debe sonar humano.
- El contenido debe venir en HTML limpio con etiquetas: <p>, <h2>, <h3>, <ul>, <li>, <strong>.

Estructura del JSON:
{
  "title": "",
  "slug": "",
  "excerpt": "",
  "metaDescription": "",
  "categorySlug": "desarrollo-web|seo|automatizacion|ia|negocios",
  "keywords": ["", "", ""],
  "coverImage": "/assets/blog/default-cover.jpg",
  "readingTime": "",
  "contentHtml": ""
}
`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Eres un redactor SEO senior especializado en webs corporativas, automatización e IA para empresas.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error OpenRouter: ${response.status} - ${text}`);
  }

  const result = await response.json();
  const raw = result?.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Respuesta vacía del modelo.');

  const jsonText = extractJson(raw);
  const parsed = JSON.parse(jsonText);

  if (!parsed.title || !parsed.contentHtml || !parsed.slug) {
    throw new Error('El JSON del modelo no trae title, slug o contentHtml.');
  }

  let finalSlug = slugify(parsed.slug);
  let finalTitle = String(parsed.title).trim();
  if (usedTitles.has(finalTitle.toLowerCase())) {
    finalSlug = `${finalSlug}-${Date.now()}`;
  }

  const publishedAt = new Date().toISOString();
  const date = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(publishedAt));

  return {
    title: finalTitle,
    slug: finalSlug,
    excerpt: String(parsed.excerpt || '').trim(),
    metaDescription: String(parsed.metaDescription || '').trim(),
    categorySlug: parsed.categorySlug in categoryMap ? parsed.categorySlug : 'negocios',
    category: categoryMap[parsed.categorySlug] || 'Negocios',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
    coverImage: parsed.coverImage || '/assets/blog/default-cover.jpg',
    readingTime: parsed.readingTime || estimateReadingTime(parsed.contentHtml),
    contentHtml: sanitizeHtml(parsed.contentHtml),
    publishedAt,
    date,
    url: `/blog/${finalSlug}.html`,
    seedTopic
  };
}

function renderArticleHtml(post) {
  const keywords = JSON.stringify(post.keywords || []);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} | Blog KORA</title>
  <meta name="description" content="${escapeHtml(post.metaDescription || post.excerpt)}">
  <link rel="canonical" href="${SITE_URL}${post.url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(post.title)} | Blog KORA">
  <meta property="og:description" content="${escapeHtml(post.metaDescription || post.excerpt)}">
  <meta property="og:url" content="${SITE_URL}${post.url}">
  <meta property="og:image" content="${SITE_URL}${post.coverImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(post.title)} | Blog KORA">
  <meta name="twitter:description" content="${escapeHtml(post.metaDescription || post.excerpt)}">
  <meta name="twitter:image" content="${SITE_URL}${post.coverImage}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/css/base.css?v=5">
  <link rel="stylesheet" href="/css/components.css?v=6">
  <link rel="stylesheet" href="/css/blog.css?v=1">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(post.title)},
    "description": ${JSON.stringify(post.metaDescription || post.excerpt)},
    "datePublished": ${JSON.stringify(post.publishedAt)},
    "dateModified": ${JSON.stringify(post.publishedAt)},
    "author": {
      "@type": "Organization",
      "name": "KORA Digital Solutions"
    },
    "publisher": {
      "@type": "Organization",
      "name": "KORA Digital Solutions",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_URL}/assets/seo/logo-kora-512.png"
      }
    },
    "mainEntityOfPage": "${SITE_URL}${post.url}",
    "image": ["${SITE_URL}${post.coverImage}"],
    "keywords": ${keywords}
  }
  </script>
</head>
<body>
  <div id="header-placeholder"></div>
  <main class="blog-article-main">
    <div class="container">
      <div class="blog-article-wrap">
        <header class="blog-article-header">
          <div class="blog-card-meta">
            <span class="blog-tag">${escapeHtml(post.category)}</span>
            <span>${escapeHtml(post.date)}</span>
            <span>${escapeHtml(post.readingTime)}</span>
          </div>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="blog-article-excerpt">${escapeHtml(post.excerpt)}</p>
        </header>

        <div class="blog-article-cover">
          <img src="${post.coverImage}" alt="${escapeHtml(post.title)}">
        </div>

        <article class="blog-article-content">
          ${post.contentHtml}
          <div class="blog-cta-box">
            <h3>¿Quieres aplicar esto en tu negocio?</h3>
            <p>En KORA desarrollamos webs orientadas a conversión y automatizaciones con IA pensadas para ahorrar tiempo y generar oportunidades reales.</p>
            <p><a class="blog-card-link" href="/index.html#contacto">Hablar con KORA <i class="fas fa-arrow-right"></i></a></p>
          </div>
        </article>
      </div>
    </div>
  </main>
  <div id="footer-placeholder"></div>
  <script src="/js/i18n.js?v=5"></script>
  <script src="/js/script.js?v=5"></script>
</body>
</html>`;
}

function toIndexEntry(post) {
  return {
    title: post.title,
    slug: post.slug,
    url: post.url,
    excerpt: post.excerpt,
    category: post.category,
    categorySlug: post.categorySlug,
    keywords: post.keywords,
    readingTime: post.readingTime,
    date: post.date,
    publishedAt: post.publishedAt,
    coverImage: post.coverImage,
    metaDescription: post.metaDescription,
    seedTopic: post.seedTopic
  };
}

async function updateSitemap(posts) {
  const staticUrls = [
    '/',
    '/index.html',
    '/sobre-nosotros.html',
    '/servicios.html',
    '/servicios/desarrollo-web.html',
    '/servicios/automatizaciones-ia.html',
    '/legal.html',
    '/blog/'
  ];

  const urls = [
    ...staticUrls.map((url) => ({ url, lastmod: new Date().toISOString() })),
    ...posts.map((post) => ({ url: post.url, lastmod: post.publishedAt }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url>\n    <loc>${SITE_URL}${item.url.replace('/index.html', '/')}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>`;

  await fs.writeFile(SITEMAP_PATH, xml, 'utf8');
}

async function ensureBaseFiles() {
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(INDEX_PATH);
  } catch {
    await fs.writeFile(INDEX_PATH, JSON.stringify({ updatedAt: '', posts: [] }, null, 2), 'utf8');
  }
}

async function readJson(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No se encontró JSON válido en la respuesta.');
  return match[0];
}

function sanitizeHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim();
}

function estimateReadingTime(html) {
  const text = String(html).replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(4, Math.ceil(words / 180));
  return `${minutes} min de lectura`;
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
