function detectBlogLanguage() {
  const keys = ['lang', 'language', 'site-lang', 'i18n-lang', 'locale', 'kora_lang'];

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

function getUiText() {
  return detectBlogLanguage() === 'en'
    ? {
        emptyTitle: 'We will publish articles soon',
        emptyText: 'This section will automatically show the latest posts from the KORA blog.',
        errorTitle: 'The blog could not be loaded',
        errorText: 'Check that the blog index file exists and has generated posts.',
        readText: 'Read article'
      }
    : {
        emptyTitle: 'Próximamente publicaremos artículos',
        emptyText: 'Esta sección mostrará automáticamente los últimos contenidos del blog de KORA.',
        errorTitle: 'No se pudo cargar el blog',
        errorText: 'Revisa que exista el índice del blog y que tenga artículos generados.',
        readText: 'Leer artículo'
      };
}

async function loadBlogPreview() {
  const previewGrid = document.getElementById('blog-preview-grid');
  const previewMoreLink = document.getElementById('blog-preview-more-link');

  if (!previewGrid) return;

  if (previewMoreLink) {
    previewMoreLink.setAttribute('href', getBlogBaseUrl());
  }

  try {
    const response = await fetch(`${getBlogIndexPath()}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar el índice del blog');

    const data = await response.json();
    const latestPosts = Array.isArray(data.posts) ? data.posts.slice(0, 3) : [];
    const t = getUiText();

    if (!latestPosts.length) {
      previewGrid.innerHTML = `
        <article class="blog-card">
          <h3>${t.emptyTitle}</h3>
          <p>${t.emptyText}</p>
        </article>
      `;
      return;
    }

    previewGrid.innerHTML = latestPosts.map(renderBlogCard).join('');
  } catch (error) {
    console.error('[blog-preview]', error);
    const t = getUiText();

    previewGrid.innerHTML = `
      <article class="blog-card">
        <h3>${t.errorTitle}</h3>
        <p>${t.errorText}</p>
      </article>
    `;
  }
}

function renderBlogCard(post) {
  const t = getUiText();

  return `
    <article class="blog-card blog-card-with-image">
      <a class="blog-card-cover-link" href="${escapeHtml(post.url)}" aria-label="${escapeHtml(post.title)}">
        <img
          class="blog-card-cover"
          src="${escapeHtml(post.coverImage || '/assets/blog/articulo-negocios.webp')}"
          alt="${escapeHtml(post.title)}"
          loading="lazy"
        >
      </a>

      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span class="blog-tag">${escapeHtml(post.category || 'Blog')}</span>
          <span>${escapeHtml(post.date || '')}</span>
        </div>

        <h3><a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a></h3>
        <p>${escapeHtml(post.excerpt || '')}</p>
        <a class="blog-card-link" href="${escapeHtml(post.url)}">${t.readText} <i class="fas fa-arrow-right"></i></a>
      </div>
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