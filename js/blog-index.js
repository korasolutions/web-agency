let allPosts = [];

function detectBlogLanguage() {
  const bodyLang = document.body?.dataset?.pageLang;
  if (bodyLang === 'en' || bodyLang === 'es') return bodyLang;

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

function getUiText() {
  return detectBlogLanguage() === 'en'
    ? {
        loadErrorTitle: 'The blog could not be loaded',
        loadErrorText: 'Check that the blog index file exists.',
        readMore: 'Read article',
        empty: 'No articles match your search.'
      }
    : {
        loadErrorTitle: 'No se pudo cargar el blog',
        loadErrorText: 'Verifica que exista el archivo del índice del blog.',
        readMore: 'Leer artículo',
        empty: 'No hay artículos que coincidan con tu búsqueda.'
      };
}

async function initBlogIndex() {
  const grid = document.getElementById('blog-grid');
  const empty = document.getElementById('blog-empty');
  const search = document.getElementById('blog-search');
  const category = document.getElementById('blog-category');

  if (!grid) return;

  if (empty) {
    empty.textContent = getUiText().empty;
  }

  try {
    const response = await fetch(`${getBlogIndexPath()}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar el índice');

    const data = await response.json();
    allPosts = Array.isArray(data.posts) ? data.posts : [];

    const applyFilters = () => {
      const query = (search?.value || '').trim().toLowerCase();
      const currentCategory = category?.value || 'all';

      const filtered = allPosts.filter((post) => {
        const text = `${post.title} ${post.excerpt} ${post.metaDescription || ''} ${(post.keywords || []).join(' ')}`.toLowerCase();
        const matchQuery = !query || text.includes(query);
        const matchCategory = currentCategory === 'all' || post.categorySlug === currentCategory;
        return matchQuery && matchCategory;
      });

      renderPosts(filtered, grid, empty);
    };

    search?.addEventListener('input', applyFilters);
    category?.addEventListener('change', applyFilters);
    applyFilters();
  } catch (error) {
    console.error('[blog-index]', error);
    const t = getUiText();

    grid.innerHTML = `
      <article class="blog-card">
        <h2>${t.loadErrorTitle}</h2>
        <p>${t.loadErrorText}</p>
      </article>
    `;
  }
}

function renderPosts(posts, grid, empty) {
  const t = getUiText();

  if (!posts.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  grid.innerHTML = posts
    .map(
      (post) => `
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

          <h2>${escapeHtml(post.title)}</h2>
          <p>${escapeHtml(post.excerpt || '')}</p>
          <a class="blog-preview-card-link" href="${escapeHtml(post.url)}">${t.readMore} <i class="fas fa-arrow-right"></i></a>
        </div>
      </article>
    `
    )
    .join('');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

initBlogIndex();