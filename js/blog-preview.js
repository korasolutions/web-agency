function detectBlogLanguage() {
  const keys = ['lang', 'language', 'site-lang', 'i18n-lang', 'locale'];

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value === 'en') return 'en';
    if (value === 'es') return 'es';
  }

  const htmlLang = document.documentElement.lang?.toLowerCase();
  if (htmlLang?.startsWith('en')) return 'en';

  return 'es';
}

function getBlogIndexPath() {
  return detectBlogLanguage() === 'en'
    ? '/data/blog-index-en.json'
    : '/data/blog-index.json';
}

function getBlogBaseUrl() {
  return detectBlogLanguage() === 'en'
    ? '/en/blog/'
    : '/blog/';
}

async function loadBlogPreview() {
  const previewGrid = document.getElementById('blog-preview-grid');
  const previewMoreLink = document.getElementById('blog-preview-more-link');

  if (!previewGrid) return;

  if (previewMoreLink) {
    previewMoreLink.setAttribute('href', getBlogBaseUrl());
  }

  try {
    const response = await fetch(getBlogIndexPath() + '?v=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar el índice del blog');

    const data = await response.json();
    const latestPosts = Array.isArray(data.posts) ? data.posts.slice(0, 3) : [];

    if (!latestPosts.length) {
      previewGrid.innerHTML = `
        <article class="blog-card">
          <h3>${detectBlogLanguage() === 'en' ? 'We will publish articles soon' : 'Próximamente publicaremos artículos'}</h3>
          <p>${detectBlogLanguage() === 'en'
            ? 'This section will automatically show the latest posts from the KORA blog.'
            : 'Esta sección mostrará automáticamente los últimos contenidos del blog de KORA.'}</p>
        </article>
      `;
      return;
    }

    previewGrid.innerHTML = latestPosts.map(renderBlogCard).join('');
  } catch (error) {
    console.error('[blog-preview]', error);
    previewGrid.innerHTML = `
      <article class="blog-card">
        <h3>${detectBlogLanguage() === 'en' ? 'The blog could not be loaded' : 'No se pudo cargar el blog'}</h3>
        <p>${detectBlogLanguage() === 'en'
          ? 'Check that the blog index file exists and has generated posts.'
          : 'Revisa que exista el índice del blog y que tenga artículos generados.'}</p>
      </article>
    `;
  }
}

function renderBlogCard(post) {
  const readText = detectBlogLanguage() === 'en' ? 'Read article' : 'Leer artículo';

  return `
    <article class="blog-card">
      <div class="blog-card-meta">
        <span class="blog-tag">${escapeHtml(post.category || 'Blog')}</span>
        <span>${escapeHtml(post.date || '')}</span>
      </div>
      <h3><a href="${post.url}">${escapeHtml(post.title)}</a></h3>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <a class="blog-card-link" href="${post.url}">${readText} <i class="fas fa-arrow-right"></i></a>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

loadBlogPreview();