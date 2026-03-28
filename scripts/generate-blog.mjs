import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');
const EN_DIR = path.join(ROOT, 'en');
const EN_BLOG_DIR = path.join(EN_DIR, 'blog');
const DATA_DIR = path.join(ROOT, 'data');

const ES_INDEX_PATH = path.join(DATA_DIR, 'blog-index.json');
const EN_INDEX_PATH = path.join(DATA_DIR, 'blog-index-en.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

const SITE_URL = 'https://koradigitalsolutions.com';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

if (!apiKey) {
  throw new Error('Falta OPENROUTER_API_KEY en las variables del workflow.');
}

// scope: 'lanzarote' | 'canarias' | 'generic'
const topicPool = [
  // --- Lanzarote ---
  { topic: 'seo local en lanzarote para negocios de servicios', scope: 'lanzarote', category: 'seo' },
  { topic: 'cómo captar clientes en lanzarote con una web profesional', scope: 'lanzarote', category: 'desarrollo-web' },
  { topic: 'por qué un negocio local en lanzarote necesita una web que convierta', scope: 'lanzarote', category: 'desarrollo-web' },
  { topic: 'automatizaciones con ia para negocios locales en lanzarote', scope: 'lanzarote', category: 'automatizacion' },
  { topic: 'cómo usar un chatbot con ia para captar leads en lanzarote', scope: 'lanzarote', category: 'ia' },
  { topic: 'errores que hacen que una web de empresa en lanzarote no genere clientes', scope: 'lanzarote', category: 'desarrollo-web' },
  { topic: 'qué debe tener una landing page para negocios locales en lanzarote', scope: 'lanzarote', category: 'desarrollo-web' },
  { topic: 'cuándo una empresa en lanzarote necesita rediseñar su página web', scope: 'lanzarote', category: 'desarrollo-web' },
  { topic: 'ia aplicada a reservas formularios y atención al cliente en lanzarote', scope: 'lanzarote', category: 'ia' },
  { topic: 'cómo una pyme en lanzarote puede ahorrar tiempo automatizando procesos', scope: 'lanzarote', category: 'automatizacion' },
  { topic: 'cómo elegir una agencia de desarrollo web y automatización en lanzarote', scope: 'lanzarote', category: 'desarrollo-web' },
  { topic: 'qué contenido ayuda a posicionar una web de servicios en lanzarote', scope: 'lanzarote', category: 'seo' },
  { topic: 'seo para clínicas restaurantes y negocios turísticos en lanzarote', scope: 'lanzarote', category: 'seo' },
  { topic: 'cómo digitalizar un negocio local en lanzarote paso a paso', scope: 'lanzarote', category: 'negocios' },
  { topic: 'cómo conseguir más contactos desde una web de empresa en lanzarote', scope: 'lanzarote', category: 'desarrollo-web' },
  { topic: 'automatización de whatsapp y formularios para negocios en lanzarote', scope: 'lanzarote', category: 'automatizacion' },
  { topic: 'cómo mejorar la velocidad de una web para vender más en lanzarote', scope: 'lanzarote', category: 'desarrollo-web' },
  { topic: 'estrategia de contenidos para negocios locales en lanzarote', scope: 'lanzarote', category: 'seo' },
  { topic: 'cómo los negocios turísticos de lanzarote pueden usar la ia para crecer', scope: 'lanzarote', category: 'ia' },

  // --- Canarias ---
  { topic: 'marketing digital para negocios locales en canarias', scope: 'canarias', category: 'negocios' },
  { topic: 'cómo posicionar una empresa en canarias con seo local', scope: 'canarias', category: 'seo' },
  { topic: 'automatización de procesos para pymes en canarias', scope: 'canarias', category: 'automatizacion' },
  { topic: 'ia para el sector turístico en canarias', scope: 'canarias', category: 'ia' },
  { topic: 'desarrollo web para negocios en las islas canarias', scope: 'canarias', category: 'desarrollo-web' },
  { topic: 'cómo una empresa canaria puede competir online con grandes marcas', scope: 'canarias', category: 'negocios' },
  { topic: 'seo local para restaurantes y hoteles en canarias', scope: 'canarias', category: 'seo' },
  { topic: 'digitalización de pymes en canarias oportunidades y retos', scope: 'canarias', category: 'negocios' },
  { topic: 'chatbots e ia para el comercio local en canarias', scope: 'canarias', category: 'ia' },
  { topic: 'landing pages que convierten para negocios de servicios en canarias', scope: 'canarias', category: 'desarrollo-web' },

  // --- Genérico ---
  { topic: 'cómo automatizar respuestas de clientes sin perder calidad en negocios locales', scope: 'generic', category: 'automatizacion' },
  { topic: 'diferencias entre una web corporativa y una landing page para captar clientes', scope: 'generic', category: 'desarrollo-web' },
  { topic: 'por qué una web bonita no siempre vende en negocios locales', scope: 'generic', category: 'desarrollo-web' },
  { topic: 'qué es un chatbot con ia y cómo puede aumentar las ventas de tu negocio', scope: 'generic', category: 'ia' },
  { topic: 'cómo medir si tu web está generando clientes de verdad', scope: 'generic', category: 'negocios' },
  { topic: 'automatización del proceso de onboarding para clientes de servicios', scope: 'generic', category: 'automatizacion' },
  { topic: 'por qué los formularios de contacto mal diseñados pierden clientes', scope: 'generic', category: 'desarrollo-web' },
  { topic: 'cómo crear un embudo de ventas digital para un negocio de servicios', scope: 'generic', category: 'negocios' },
  { topic: 'qué es el seo local y por qué importa para cualquier negocio', scope: 'generic', category: 'seo' },
  { topic: 'inteligencia artificial aplicada a la atención al cliente en pymes', scope: 'generic', category: 'ia' },
  { topic: 'cómo reducir el tiempo de respuesta a clientes con automatizaciones', scope: 'generic', category: 'automatizacion' },
  { topic: 'por qué tu empresa necesita una landing page además de una web corporativa', scope: 'generic', category: 'desarrollo-web' },
  { topic: 'cómo el diseño web influye en la tasa de conversión de un negocio', scope: 'generic', category: 'desarrollo-web' },
  { topic: 'señales de que tu web necesita una actualización urgente', scope: 'generic', category: 'desarrollo-web' },
  { topic: 'automatización de emails y seguimiento para negocios de servicios', scope: 'generic', category: 'automatizacion' },
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

const imageTopicMap = {
  'desarrollo-web': 'desarrollo-web',
  'seo': 'seo',
  'automatizacion': 'automatizacion',
  'ia': 'ia',
  'negocios': 'negocios'
};

await ensureBaseFiles();

const existingEsIndex = await readJson(ES_INDEX_PATH, { updatedAt: '', posts: [] });
const existingEnIndex = await readJson(EN_INDEX_PATH, { updatedAt: '', posts: [] });

const usedTitlesEs = new Set((existingEsIndex.posts || []).map((post) => String(post.title || '').toLowerCase()));
const usedSlugsEs = new Set((existingEsIndex.posts || []).map((post) => String(post.slug || '').toLowerCase()));
const usedSlugsEn = new Set((existingEnIndex.posts || []).map((post) => String(post.slug || '').toLowerCase()));
const recentTopics = new Set((existingEsIndex.posts || []).slice(0, 40).map((post) => String(post.seedTopic || '').toLowerCase()));

const lastTwoCategories = getLastCategories(existingEsIndex.posts || [], 2);
const lastCategory = lastTwoCategories[0] || null;
const secondLastCategory = lastTwoCategories[1] || null;

let selectedTopic;
if (lastCategory && lastCategory === secondLastCategory) {
  selectedTopic = pickTopic(recentTopics, lastCategory);
} else {
  selectedTopic = pickTopic(recentTopics, null);
}

const esPost = await generateSpanishArticle(selectedTopic, usedTitlesEs, usedSlugsEs);
const enPost = await generateEnglishVersion(esPost, usedSlugsEn);

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

function pickTopic(recentTopicsSet, lastCategory) {
  const available = topicPool.filter((t) => !recentTopicsSet.has(t.topic.toLowerCase()));
  const pool = available.length >= 3 ? available : topicPool;

  if (lastCategory) {
    const differentCategory = pool.filter((t) => t.category !== lastCategory);
    if (differentCategory.length > 0) {
      return differentCategory[Math.floor(Math.random() * differentCategory.length)];
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function getLastCategories(posts, count = 2) {
  const categories = [];
  for (let i = 0; i < Math.min(count, posts.length); i++) {
    if (posts[i] && posts[i].categorySlug) {
      categories.push(posts[i].categorySlug);
    }
  }
  return categories;
}

function buildGeoContext(scope) {
  if (scope === 'lanzarote') {
    return {
      positioningLine: 'Zona de posicionamiento principal: Lanzarote.',
      contentGuideline: 'Incluye referencias naturales al contexto de negocios locales en Lanzarote cuando tenga sentido.',
      enPreserveLine: 'Preserve the local Lanzarote context where relevant.'
    };
  }
  if (scope === 'canarias') {
    return {
      positioningLine: 'Zona de posicionamiento: Canarias (islas canarias en general).',
      contentGuideline: 'Haz referencia al contexto canario cuando tenga sentido, sin limitarte a una sola isla.',
      enPreserveLine: 'Preserve the Canary Islands context where relevant, without limiting to a single island.'
    };
  }
  // generic
  return {
    positioningLine: 'Dirigido a cualquier pyme o negocio local, sin referencia geográfica específica.',
    contentGuideline: 'No hagas referencias geográficas específicas. Habla de negocios locales o pymes en general.',
    enPreserveLine: 'Do not add geographic references. Keep the content general, applicable to any local business.'
  };
}

async function generateSpanishArticle(topicObj, usedTitles, usedSlugs) {
  const { topic: seedTopic, scope } = topicObj;
  const geo = buildGeoContext(scope);

  const prompt = `
Eres el equipo editorial SEO de KORA Digital Solutions.

Contexto de marca:
- KORA es una agencia digital que crea webs de alto impacto y sistemas de IA para que los negocios conviertan más y trabajen menos.
- Cliente ideal: negocios locales y pymes que quieren digitalizarse rápido.
- Servicios: desarrollo web, rediseño web, automatizaciones con IA, chatbots, formularios inteligentes, reservas, FAQs dinámicas.
- ${geo.positioningLine}
- Tono: profesional, claro, cercano, práctico, sin relleno.
- Debe sonar experto, local y útil de verdad.

Objetivo:
Crear un artículo SEO en español, de alta calidad, pensado para posicionar búsquedas relacionadas con desarrollo web, automatización e IA para empresas.

Tema semilla:
${seedTopic}

Instrucciones obligatorias:
- Devuelve SOLO JSON válido.
- No metas markdown ni comentarios.
- El artículo debe ser original y profundo.
- Longitud del contenido HTML: entre 1200 y 1700 palabras.
- Enfocado en intención informacional + comercial.
- ${geo.contentGuideline}
- No inventes estadísticas ni casos falsos.
- No abuses del nombre KORA.
- No escribas frases vacías.
- Debe sonar humano y convincente.
- Debe venir en HTML limpio con etiquetas: <p>, <h2>, <h3>, <ul>, <li>, <strong>.
- Añade al final un CTA suave y natural para contactar.
- Incluye un bloque FAQ SEO al final con 3 preguntas y respuestas útiles en HTML.
- El título debe ser atractivo pero profesional, sin clickbait barato.
- El excerpt debe ser claro y vender el valor del artículo.
- La metaDescription debe tener entre 140 y 160 caracteres aprox.
- El slug debe ser corto, natural y SEO friendly.
- El campo imageTopicSlug debe devolver SOLO uno de estos valores:
  "seo", "automatizacion", "ia", "desarrollo-web", "negocios", "chatbot", "landing-page", "lanzarote"

Estructura del JSON:
{
  "title": "",
  "slug": "",
  "excerpt": "",
  "metaDescription": "",
  "categorySlug": "desarrollo-web|seo|automatizacion|ia|negocios",
  "keywords": ["", "", "", ""],
  "imageTopicSlug": "",
  "contentHtml": ""
}
`;

  const raw = await fetchWithRetry(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Eres un redactor SEO senior especializado en desarrollo web, automatización, IA y posicionamiento local para empresas.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3200
      })
    },
    3,
    90000
  );

  const jsonText = extractJson(raw);
  const parsed = JSON.parse(jsonText);

  if (!parsed.title || !parsed.contentHtml || !parsed.slug) {
    throw new Error('El JSON del modelo no trae title, slug o contentHtml.');
  }

  const baseSlug = slugify(parsed.slug);
  const finalSlug = ensureUniqueSlug(baseSlug, usedSlugs);
  const finalTitle = String(parsed.title).trim();

  const imageTopicSlug = normalizeImageTopicSlug(parsed.imageTopicSlug, parsed.categorySlug, seedTopic);
  const coverImage = `/assets/blog/articulo-${imageTopicSlug}.webp`;

  const publishedAt = new Date().toISOString();
  const date = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(publishedAt));

  let safeTitle = finalTitle;
  if (usedTitles.has(safeTitle.toLowerCase())) {
    safeTitle = `${safeTitle} | ${new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(publishedAt))}`;
  }

  return {
    locale: 'es',
    title: safeTitle,
    slug: finalSlug,
    excerpt: cleanText(parsed.excerpt),
    metaDescription: trimMetaDescription(parsed.metaDescription, parsed.excerpt),
    categorySlug: parsed.categorySlug in categoryMapEs ? parsed.categorySlug : 'negocios',
    category: categoryMapEs[parsed.categorySlug] || 'Negocios',
    keywords: normalizeKeywords(parsed.keywords, seedTopic, scope),
    imageTopicSlug,
    coverImage,
    contentHtml: sanitizeHtml(parsed.contentHtml),
    publishedAt,
    date,
    url: `/blog/${finalSlug}`,
    seedTopic,
    scope
  };
}

async function generateEnglishVersion(esPost, usedSlugsEn) {
  const geo = buildGeoContext(esPost.scope);

  const prompt = `
Translate and adapt this Spanish article into high-quality natural English for the KORA Digital Solutions blog.

Requirements:
- Return ONLY valid JSON.
- Keep the same meaning and commercial intent.
- Adapt the writing so it sounds native in English.
- Keep SEO quality.
- Do not translate word by word in a robotic way.
- Keep HTML content with clean tags: <p>, <h2>, <h3>, <ul>, <li>, <strong>.
- ${geo.enPreserveLine}
- Keep the CTA natural in English.
- Keep the FAQ block in English.
- Generate an English slug.
- Do not invent data.
- The field imageTopicSlug must keep one of these values only:
  "seo", "automatizacion", "ia", "desarrollo-web", "negocios", "chatbot", "landing-page", "lanzarote"

Spanish source article:
${JSON.stringify({
  title: esPost.title,
  excerpt: esPost.excerpt,
  metaDescription: esPost.metaDescription,
  categorySlug: esPost.categorySlug,
  keywords: esPost.keywords,
  imageTopicSlug: esPost.imageTopicSlug,
  contentHtml: esPost.contentHtml
})}

JSON structure:
{
  "title": "",
  "slug": "",
  "excerpt": "",
  "metaDescription": "",
  "categorySlug": "desarrollo-web|seo|automatizacion|ia|negocios",
  "keywords": ["", "", "", ""],
  "imageTopicSlug": "",
  "contentHtml": ""
}
`;

  const raw = await fetchWithRetry(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a senior SEO editor specialized in web development, automation, AI, and local business content.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 3200
      })
    },
    3,
    90000
  );

  const jsonText = extractJson(raw);
  const parsed = JSON.parse(jsonText);

  if (!parsed.title || !parsed.contentHtml || !parsed.slug) {
    throw new Error('The English JSON does not include title, slug or contentHtml.');
  }

  const finalSlug = ensureUniqueSlug(slugify(parsed.slug), usedSlugsEn);
  const publishedAt = esPost.publishedAt;
  const date = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(publishedAt));

  const imageTopicSlug = normalizeImageTopicSlug(parsed.imageTopicSlug, parsed.categorySlug, esPost.seedTopic);
  const coverImage = `/assets/blog/articulo-${imageTopicSlug}.webp`;

  return {
    locale: 'en',
    title: cleanText(parsed.title),
    slug: finalSlug,
    excerpt: cleanText(parsed.excerpt),
    metaDescription: trimMetaDescription(parsed.metaDescription, parsed.excerpt),
    categorySlug: parsed.categorySlug in categoryMapEn ? parsed.categorySlug : esPost.categorySlug,
    category: categoryMapEn[parsed.categorySlug] || categoryMapEn[esPost.categorySlug] || 'Business',
    keywords: normalizeKeywords(parsed.keywords, esPost.seedTopic, esPost.scope),
    imageTopicSlug,
    coverImage,
    contentHtml: sanitizeHtml(parsed.contentHtml),
    publishedAt,
    date,
    url: `/en/blog/${finalSlug}`,
    seedTopic: esPost.seedTopic,
    scope: esPost.scope
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
    ? 'At KORA, we create conversion-focused websites and AI automations designed to save time and generate real opportunities for businesses.'
    : 'En KORA creamos webs orientadas a conversión y automatizaciones con IA pensadas para ahorrar tiempo y generar oportunidades reales para negocios.';
  const ctaLinkText = isEn ? 'Talk to KORA' : 'Hablar con KORA';
  const backText = isEn ? 'Back to blog' : 'Volver al blog';
  const contactHref = '/#contacto';
  const blogHref = isEn ? '/en/blog/' : '/blog/';

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
  <!-- FAVICONS -->
  <link rel="icon" href="/assets/logo/icon/favicon.ico" sizes="any">
  <link rel="icon" type="image/svg+xml" href="/assets/logo/icon/favicon.svg">
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/logo/icon/favicon-48.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/logo/icon/favicon-192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/logo/icon/apple-touch-icon.png">
  <meta property="article:published_time" content="${post.publishedAt}">
  <meta property="article:section" content="${escapeHtml(post.category)}">
  ${post.keywords.map((keyword) => `<meta property="article:tag" content="${escapeHtml(keyword)}">`).join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(post.metaDescription || post.excerpt)}">
  <meta name="twitter:image" content="${SITE_URL}${post.coverImage}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/css/base.css?v=6">
  <link rel="stylesheet" href="/css/components.css?v=7">
  <link rel="stylesheet" href="/css/blog.css?v=2">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(post.title)},
    "description": ${JSON.stringify(post.metaDescription || post.excerpt)},
    "datePublished": ${JSON.stringify(post.publishedAt)},
    "dateModified": ${JSON.stringify(post.publishedAt)},
    "inLanguage": ${JSON.stringify(locale)},
    "articleSection": ${JSON.stringify(post.category)},
    "keywords": ${keywords},
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
    "image": ["${SITE_URL}${post.coverImage}"]
  }
  </script>
</head>
<body data-page-lang="${locale}" data-alt-es-url="${isEn ? post.alternateUrl : post.url}" data-alt-en-url="${isEn ? post.url : post.alternateUrl}">
  <div id="header-placeholder"></div>

  <main class="blog-article-main">
    <div class="container">
      <div class="blog-article-wrap">
        <nav class="blog-breadcrumb" aria-label="Breadcrumb">
          <a href="${blogHref}">${backText}</a>
        </nav>

        <header class="blog-article-header">
          <div class="blog-card-meta">
            <span class="blog-tag">${escapeHtml(post.category)}</span>
            <span>${escapeHtml(post.date)}</span>
          </div>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="blog-article-excerpt">${escapeHtml(post.excerpt)}</p>
        </header>

        <div class="blog-article-cover">
          <img src="${post.coverImage}" alt="${escapeHtml(post.title)}" loading="eager" fetchpriority="high" onerror="this.onerror=null;this.src='/assets/blog/article-default-image.webp';">
        </div>

        <article class="blog-article-content">
          ${post.contentHtml}
          <div class="blog-cta-box">
            <h3>${ctaTitle}</h3>
            <p>${ctaText}</p>
            <p><a class="blog-card-link" href="${contactHref}">${ctaLinkText} <i class="fas fa-arrow-right"></i></a></p>
          </div>
        </article>
      </div>
    </div>
  </main>

  <div id="footer-placeholder"></div>

  <script src="/js/i18n.js?v=5"></script>
  <script src="https://unpkg.com/lenis@1.3.18/dist/lenis.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/lenis@1.3.18/dist/lenis.css">
  <script src="/js/script.js?v=6"></script>
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
    date: post.date,
    publishedAt: post.publishedAt,
    coverImage: post.coverImage,
    metaDescription: post.metaDescription,
    alternateUrl: post.alternateUrl,
    seedTopic: post.seedTopic,
    imageTopicSlug: post.imageTopicSlug,
    scope: post.scope
  };
}

async function updateSitemap(esPosts, enPosts) {
  const now = new Date().toISOString();

  const staticUrls = [
    { url: '/', lastmod: now },
    { url: '/sobre-nosotros', lastmod: now },
    { url: '/servicios', lastmod: now },
    { url: '/servicios/desarrollo-web', lastmod: now },
    { url: '/servicios/automatizaciones-ia', lastmod: now },
    { url: '/blog/', lastmod: now }
  ];

  const dynamicUrls = [
    ...esPosts.map((post) => ({ url: post.url, lastmod: post.publishedAt })),
    ...enPosts.map((post) => ({ url: post.url, lastmod: post.publishedAt }))
  ];

  const uniqueMap = new Map();
  [...staticUrls, ...dynamicUrls].forEach((item) => {
    const normalizedUrl = item.url.replace(/\.html$/, '');
    uniqueMap.set(normalizedUrl, {
      url: normalizedUrl,
      lastmod: item.lastmod
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(uniqueMap.values())
  .map(
    (item) => `  <url>
    <loc>${SITE_URL}${item.url}</loc>
    <lastmod>${item.lastmod}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>`;

  await fs.writeFile(SITEMAP_PATH, xml, 'utf8');
}

async function ensureBaseFiles() {
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.mkdir(EN_DIR, { recursive: true });
  await fs.mkdir(EN_BLOG_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });

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

async function fetchWithRetry(url, options, retries = 3, timeoutMs = 90000) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Intento ${attempt}/${retries}...`);
      const json = await fetchJsonWithTimeout(url, options, timeoutMs);
      const raw = json?.choices?.[0]?.message?.content?.trim();

      if (!raw) {
        throw new Error('Respuesta vacía del modelo.');
      }

      return raw;
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
  if (!match) {
    throw new Error('No se encontró JSON válido en la respuesta.');
  }
  return match[0];
}

function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sstyle='[^']*'/gi, '')
    .replace(/<h1[\s\S]*?<\/h1>/gi, '')
    .trim();
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeKeywords(keywords, seedTopic, scope) {
  const base = Array.isArray(keywords) ? keywords : [];
  const geoKeyword = scope === 'lanzarote' ? 'Lanzarote' : scope === 'canarias' ? 'Canarias' : null;
  const merged = [
    ...base,
    ...(geoKeyword ? [geoKeyword] : []),
    'desarrollo web',
    'automatización',
    'IA',
    seedTopic
  ];
  const cleaned = merged
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 10);

  return Array.from(new Set(cleaned));
}

function trimMetaDescription(metaDescription, fallback = '') {
  const source = cleanText(metaDescription) || cleanText(fallback);
  const max = 160;

  if (!source) {
    return 'Ideas sobre desarrollo web, automatización e IA para negocios y pymes.';
  }

  return source.length <= max ? source : `${source.slice(0, max - 1).trim()}…`;
}

function normalizeImageTopicSlug(value, categorySlug, seedTopic) {
  const allowed = new Set([
    'seo',
    'automatizacion',
    'ia',
    'desarrollo-web',
    'negocios',
    'chatbot',
    'landing-page',
    'lanzarote'
  ]);

  const normalized = slugify(value);
  if (allowed.has(normalized)) {
    return normalized;
  }

  const seed = slugify(seedTopic);

  if (seed.includes('chatbot')) return 'chatbot';
  if (seed.includes('landing')) return 'landing-page';
  if (seed.includes('lanzarote')) return 'lanzarote';
  if (seed.includes('seo')) return 'seo';
  if (seed.includes('automat')) return 'automatizacion';
  if (seed.includes('ia')) return 'ia';

  return imageTopicMap[categorySlug] || 'negocios';
}

function ensureUniqueSlug(baseSlug, usedSlugs) {
  let finalSlug = baseSlug || `articulo-${Date.now()}`;
  let counter = 2;

  while (usedSlugs.has(finalSlug.toLowerCase())) {
    finalSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  usedSlugs.add(finalSlug.toLowerCase());
  return finalSlug;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}