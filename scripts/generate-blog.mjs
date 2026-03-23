import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');
const EN_DIR = path.join(ROOT, 'en');
const EN_BLOG_DIR = path.join(EN_DIR, 'blog');
const DATA_DIR = path.join(ROOT, 'data');
const GENERATED_IMAGES_DIR = path.join(ROOT, 'assets', 'blog', 'generated');

const ES_INDEX_PATH = path.join(DATA_DIR, 'blog-index.json');
const EN_INDEX_PATH = path.join(DATA_DIR, 'blog-index-en.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

const SITE_URL = 'https://koradigitalsolutions.com';

const apiKey = process.env.OPENROUTER_API_KEY;
const textModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const imageModel = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image-preview';

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

const categoryMapEs = {
  'desarrollo-web': 'Desarrollo web',
  'seo': 'SEO',
  'automatizacion': 'Automatización',
  'ia': 'IA',
  'negocios': 'Negocios'
};

const categoryMapEn = {
  'desarrollo-web': 'Web development',
  'seo': 'SEO',
  'automatizacion': 'Automation',
  'ia': 'AI',
  'negocios': 'Business'
};

await ensureBaseFiles();

const existingEsIndex = await readJson(ES_INDEX_PATH, { updatedAt: '', posts: [] });
const existingEnIndex = await readJson(EN_INDEX_PATH, { updatedAt: '', posts: [] });

const usedTitlesEs = new Set((existingEsIndex.posts || []).map((post) => post.title.toLowerCase()));
const recentTopics = new Set((existingEsIndex.posts || []).slice(0, 30).map((post) => (post.seedTopic || '').toLowerCase()));

const selectedTopic = pickTopic(recentTopics);
console.log(`Tema seleccionado: ${selectedTopic}`);

const esPostDraft = await generateSpanishArticle(selectedTopic, usedTitlesEs);
const coverImage = await generateCoverImage(esPostDraft);

const esPost = {
  ...esPostDraft,
  coverImage
};

const enPostDraft = await generateEnglishVersion(esPost);
const enPost = {
  ...enPostDraft,
  coverImage
};

const linkedEsPost = {
  ...esPost,
  alternateUrl: enPost.url
};

const linkedEnPost = {
  ...enPost,
  alternateUrl: esPost.url
};

const esHtml = renderArticleHtml('es', linkedEsPost);
const enHtml = renderArticleHtml('en', linkedEnPost);

await fs.writeFile(path.join(BLOG_DIR, `${linkedEsPost.slug}.html`), esHtml, 'utf8');
await fs.writeFile(path.join(EN_BLOG_DIR, `${linkedEnPost.slug}.html`), enHtml, 'utf8');

const updatedEsPosts = [
  toIndexEntry('es', linkedEsPost),
  ...(existingEsIndex.posts || [])
].slice(0, 300);

const updatedEnPosts = [
  toIndexEntry('en', linkedEnPost),
  ...(existingEnIndex.posts || [])
].slice(0, 300);

await fs.writeFile(
  ES_INDEX_PATH,
  JSON.stringify({ updatedAt: new Date().toISOString(), posts: updatedEsPosts }, null, 2),
  'utf8'
);

await fs.writeFile(
  EN_INDEX_PATH,
  JSON.stringify({ updatedAt: new Date().toISOString(), posts: updatedEnPosts }, null, 2),
  'utf8'
);

await updateSitemap(updatedEsPosts, updatedEnPosts);

console.log(`Artículo ES generado: ${linkedEsPost.title}`);
console.log(`Article EN generated: ${linkedEnPost.title}`);
console.log(`Imagen generada: ${coverImage}`);

function pickTopic(recentTopics) {
  const available = topicPool.filter((topic) => !recentTopics.has(topic.toLowerCase()));
  const pool = available.length ? available : topicPool;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function generateSpanishArticle(seedTopic, usedTitles) {
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
- Longitud del contenido HTML: entre 1000 y 1400 palabras.
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

  const raw = await fetchTextCompletion({
    model: textModel,
    messages: [
      {
        role: 'system',
        content: 'Eres un redactor SEO senior especializado en webs corporativas, automatización e IA para empresas.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2600
  });

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
  const date = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(publishedAt));

  return {
    locale: 'es',
    title: finalTitle,
    slug: finalSlug,
    excerpt: String(parsed.excerpt || '').trim(),
    metaDescription: String(parsed.metaDescription || '').trim(),
    categorySlug: parsed.categorySlug in categoryMapEs ? parsed.categorySlug : 'negocios',
    category: categoryMapEs[parsed.categorySlug] || 'Negocios',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
    coverImage: parsed.coverImage || '/assets/blog/default-cover.jpg',
    readingTime: parsed.readingTime || estimateReadingTime(parsed.contentHtml, 'es'),
    contentHtml: sanitizeHtml(parsed.contentHtml),
    publishedAt,
    date,
    url: `/blog/${finalSlug}.html`,
    seedTopic
  };
}

async function generateEnglishVersion(esPost) {
  const prompt = `
Translate and adapt this Spanish article into high-quality natural English for the KORA Digital Solutions blog.

Requirements:
- Return ONLY valid JSON.
- Keep the same meaning and commercial intent.
- Adapt the writing so it sounds native in English.
- Keep SEO quality.
- Do not translate word by word in a robotic way.
- Keep HTML content with clean tags: <p>, <h2>, <h3>, <ul>, <li>, <strong>.
- The CTA must sound natural in English.
- Generate an English slug.
- Do not invent data.

Spanish source article:
${JSON.stringify({
  title: esPost.title,
  excerpt: esPost.excerpt,
  metaDescription: esPost.metaDescription,
  categorySlug: esPost.categorySlug,
  keywords: esPost.keywords,
  coverImage: esPost.coverImage,
  readingTime: esPost.readingTime,
  contentHtml: esPost.contentHtml
})}

JSON structure:
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

  const raw = await fetchTextCompletion({
    model: textModel,
    messages: [
      {
        role: 'system',
        content: 'You are a senior SEO editor specialized in web development, automation and AI content for businesses.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 2600
  });

  const jsonText = extractJson(raw);
  const parsed = JSON.parse(jsonText);

  if (!parsed.title || !parsed.contentHtml || !parsed.slug) {
    throw new Error('The English JSON does not include title, slug or contentHtml.');
  }

  const finalSlug = slugify(parsed.slug);
  const publishedAt = esPost.publishedAt;
  const date = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(publishedAt));

  return {
    locale: 'en',
    title: String(parsed.title).trim(),
    slug: finalSlug,
    excerpt: String(parsed.excerpt || '').trim(),
    metaDescription: String(parsed.metaDescription || '').trim(),
    categorySlug: parsed.categorySlug in categoryMapEn ? parsed.categorySlug : esPost.categorySlug,
    category: categoryMapEn[parsed.categorySlug] || categoryMapEn[esPost.categorySlug] || 'Business',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
    coverImage: esPost.coverImage,
    readingTime: parsed.readingTime || estimateReadingTime(parsed.contentHtml, 'en'),
    contentHtml: sanitizeHtml(parsed.contentHtml),
    publishedAt,
    date,
    url: `/en/blog/${finalSlug}.html`,
    seedTopic: esPost.seedTopic
  };
}

async function generateCoverImage(post) {
  const imagePrompt = buildImagePrompt(post);
  const filename = `${post.slug}.webp`;
  const relativePath = `/assets/blog/generated/${filename}`;
  const absolutePath = path.join(GENERATED_IMAGES_DIR, filename);

  try {
    const imageDataUrl = await fetchImageGeneration({
      model: imageModel,
      messages: [
        {
          role: 'user',
          content: imagePrompt
        }
      ]
    });

    const { mimeType, buffer } = dataUrlToBuffer(imageDataUrl);
    console.log(`Imagen recibida (${mimeType}) para ${post.slug}`);

    await fs.writeFile(absolutePath, buffer);
    return relativePath;
  } catch (error) {
    console.error(`No se pudo generar imagen para ${post.slug}: ${error.message}`);
    return '/assets/blog/default-cover.jpg';
  }
}

function buildImagePrompt(post) {
  return `
Create a premium horizontal blog cover image for a digital agency article.

Brand context:
- Brand: KORA Digital Solutions
- Industry: web development, AI automation, SEO, digital strategy
- Audience: local businesses and SMEs
- Style: premium, modern, dark, elegant, high-contrast, technological
- Composition: clean editorial hero image, wide 16:9
- No text, no letters, no words, no logo, no watermark
- No people looking at camera
- Avoid cliché stock-photo look
- Cinematic lighting
- Abstract or semi-realistic visual metaphor related to the article topic

Article title:
${post.title}

Article excerpt:
${post.excerpt}

Topic:
${post.seedTopic}

Make it visually suitable as a professional blog cover for a premium tech agency website.
`.trim();
}

async function fetchTextCompletion(body) {
  const json = await fetchJsonWithRetry(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    },
    3,
    90000
  );

  const raw = json?.choices?.[0]?.message?.content?.trim();

  if (!raw) {
    throw new Error('Respuesta vacía del modelo de texto.');
  }

  return raw;
}

async function fetchImageGeneration({ model, messages }) {
  const json = await fetchJsonWithRetry(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        modalities: ['image', 'text'],
        messages
      })
    },
    3,
    120000
  );

  const message = json?.choices?.[0]?.message;
  if (!message) {
    throw new Error('Respuesta vacía del modelo de imagen.');
  }

  const possibleDataUrl =
    message?.images?.[0]?.image_url ||
    message?.images?.[0]?.url ||
    message?.image_url ||
    extractFirstDataUrlFromMessage(message);

  if (!possibleDataUrl || !possibleDataUrl.startsWith('data:image/')) {
    throw new Error('No se encontró una imagen válida en la respuesta.');
  }

  return possibleDataUrl;
}

function extractFirstDataUrlFromMessage(message) {
  if (typeof message?.content === 'string') {
    const match = message.content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/);
    return match ? match[0].replace(/\s+/g, '') : null;
  }

  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (typeof part?.image_url === 'string' && part.image_url.startsWith('data:image/')) {
        return part.image_url;
      }

      if (typeof part?.url === 'string' && part.url.startsWith('data:image/')) {
        return part.url;
      }

      if (typeof part?.text === 'string') {
        const match = part.text.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/);
        if (match) return match[0].replace(/\s+/g, '');
      }
    }
  }

  return null;
}

function dataUrlToBuffer(dataUrl) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Formato de data URL no válido.');
  }

  const mimeType = match[1];
  const base64 = match[2];
  return {
    mimeType,
    buffer: Buffer.from(base64, 'base64')
  };
}

function renderArticleHtml(locale, post) {
  const isEn = locale === 'en';
  const canonicalUrl = `${SITE_URL}${post.url}`;
  const esAlt = isEn ? `${SITE_URL}${post.alternateUrl}` : canonicalUrl;
  const enAlt = isEn ? canonicalUrl : `${SITE_URL}${post.alternateUrl}`;
  const keywords = JSON.stringify(post.keywords || []);
  const pageTitle = isEn ? `${post.title} | KORA Blog` : `${post.title} | Blog KORA`;
  const ctaTitle = isEn ? 'Want to apply this to your business?' : '¿Quieres aplicar esto en tu negocio?';
  const ctaText = isEn
    ? 'At KORA, we build conversion-focused websites and AI automations designed to save time and create real business opportunities.'
    : 'En KORA desarrollamos webs orientadas a conversión y automatizaciones con IA pensadas para ahorrar tiempo y generar oportunidades reales.';
  const ctaLinkText = isEn ? 'Talk to KORA' : 'Hablar con KORA';

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(post.metaDescription || post.excerpt)}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="es" href="${esAlt}">
  <link rel="alternate" hreflang="en" href="${enAlt}">
  <link rel="alternate" hreflang="x-default" href="${esAlt}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(post.metaDescription || post.excerpt)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${SITE_URL}${post.coverImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
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
    "inLanguage": ${JSON.stringify(locale)},
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
    "mainEntityOfPage": "${canonicalUrl}",
    "image": ["${SITE_URL}${post.coverImage}"],
    "keywords": ${keywords}
  }
  </script>
</head>
<body data-page-lang="${locale}" data-alt-es-url="${isEn ? post.alternateUrl : post.url}" data-alt-en-url="${isEn ? post.url : post.alternateUrl}">
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
            <h3>${ctaTitle}</h3>
            <p>${ctaText}</p>
            <p><a class="blog-card-link" href="/index.html#contacto">${ctaLinkText} <i class="fas fa-arrow-right"></i></a></p>
          </div>
        </article>
      </div>
    </div>
  </main>
  <div id="footer-placeholder"></div>
  <script src="/js/i18n.js?v=5"></script>
  <script src="/js/script.js?v=5"></script>
  <script src="/js/blog-language-switch.js?v=1"></script>
</body>
</html>`;
}

function toIndexEntry(locale, post) {
  return {
    locale,
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
    alternateUrl: post.alternateUrl,
    seedTopic: post.seedTopic
  };
}

async function updateSitemap(esPosts, enPosts) {
  const staticUrls = [
    '/',
    '/index.html',
    '/sobre-nosotros.html',
    '/servicios.html',
    '/servicios/desarrollo-web.html',
    '/servicios/automatizaciones-ia.html',
    '/legal.html',
    '/blog/',
    '/en/blog/'
  ];

  const urls = [
    ...staticUrls.map((url) => ({
      url,
      lastmod: new Date().toISOString()
    })),
    ...esPosts.map((post) => ({
      url: post.url,
      lastmod: post.publishedAt
    })),
    ...enPosts.map((post) => ({
      url: post.url,
      lastmod: post.publishedAt
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url>\n    <loc>${SITE_URL}${item.url.replace('/index.html', '/')}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>`;

  await fs.writeFile(SITEMAP_PATH, xml, 'utf8');
}

async function ensureBaseFiles() {
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.mkdir(EN_DIR, { recursive: true });
  await fs.mkdir(EN_BLOG_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(GENERATED_IMAGES_DIR, { recursive: true });

  try {
    await fs.access(ES_INDEX_PATH);
  } catch {
    await fs.writeFile(ES_INDEX_PATH, JSON.stringify({ updatedAt: '', posts: [] }, null, 2), 'utf8');
  }

  try {
    await fs.access(EN_INDEX_PATH);
  } catch {
    await fs.writeFile(EN_INDEX_PATH, JSON.stringify({ updatedAt: '', posts: [] }, null, 2), 'utf8');
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

async function fetchJsonWithRetry(url, options, retries = 3, timeoutMs = 90000) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Intento ${attempt}/${retries}...`);
      return await fetchJsonWithTimeout(url, options, timeoutMs);
    } catch (error) {
      lastError = error;
      console.error(`Intento ${attempt} fallido: ${error.message}`);
      if (attempt < retries) {
        await wait(4000 * attempt);
      }
    }
  }

  throw lastError;
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Error OpenRouter: ${response.status} - ${text}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function estimateReadingTime(html, locale = 'es') {
  const text = String(html).replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(4, Math.ceil(words / 180));
  return locale === 'en'
    ? `${minutes} min read`
    : `${minutes} min de lectura`;
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