const POSTS_PER_PAGE = 6; // Alternativa: 4 artículos con 2 columnas
let allPosts = [];
let currentPage = 1;
let currentFiltered = [];

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
        readMore: 'Read article',
        emptyFilter: 'No articles match your search.',
        emptyUnavailable: 'No articles available.',
        prev: 'Previous page',
        next: 'Next page'
      }
    : {
        readMore: 'Leer artículo',
        emptyFilter: 'No hay artículos que coincidan con tu búsqueda.',
        emptyUnavailable: 'No hay artículos disponibles.',
        prev: 'Página anterior',
        next: 'Página siguiente'
      };
}

function updateCategoryCounts(select, posts) {
  if (!select) return;

  const counts = {};
  for (const post of posts) {
    counts[post.categorySlug] = (counts[post.categorySlug] || 0) + 1;
  }

  for (const option of select.options) {
    const base = option.dataset.label || option.textContent.replace(/\s*\(\d+\)$/, '').trim();
    option.dataset.label = base;
    const count = option.value === 'all' ? posts.length : (counts[option.value] || 0);
    option.textContent = `${base} (${count})`;
  }
}

async function initBlogIndex() {
  const grid = document.getElementById('blog-grid');
  const empty = document.getElementById('blog-empty');
  const search = document.getElementById('blog-search');
  const category = document.getElementById('blog-category');

  if (!grid) return;

  try {
    const response = await fetch(`${getBlogIndexPath()}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('fetch failed');

    const data = await response.json();
    allPosts = Array.isArray(data.posts) ? data.posts : [];

    updateCategoryCounts(category, allPosts);

    const applyFilters = () => {
      const query = (search?.value || '').trim().toLowerCase();
      const currentCategory = category?.value || 'all';

      currentFiltered = allPosts.filter((post) => {
        const text = `${post.title} ${post.excerpt} ${post.metaDescription || ''} ${(post.keywords || []).join(' ')}`.toLowerCase();
        const matchQuery = !query || text.includes(query);
        const matchCategory = currentCategory === 'all' || post.categorySlug === currentCategory;
        return matchQuery && matchCategory;
      });

      currentPage = 1;
      renderPage(grid, empty);
    };

    search?.addEventListener('input', applyFilters);
    category?.addEventListener('change', applyFilters);
    applyFilters();
  } catch (error) {
    console.error('[blog-index]', error);
    grid.innerHTML = '';
    showEmptyState(empty, 'unavailable');
    hidePagination();
  }
}

function renderPage(grid, empty) {
  if (currentFiltered.length === 0) {
    grid.innerHTML = '';
    showEmptyState(empty, allPosts.length === 0 ? 'unavailable' : 'filter');
    hidePagination();
    return;
  }

  hideEmptyState(empty);

  const totalPages = Math.ceil(currentFiltered.length / POSTS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = currentFiltered.slice(start, start + POSTS_PER_PAGE);

  renderPosts(pagePosts, grid);
  renderPagination(totalPages);
}

function showEmptyState(empty, type) {
  if (!empty) return;
  const t = getUiText();
  const isFilter = type === 'filter';
  empty.innerHTML = `
    <span class="blog-empty-text">${isFilter ? t.emptyFilter : t.emptyUnavailable}</span>
    <i class="fas ${isFilter ? 'fa-magnifying-glass' : 'fa-newspaper'} blog-empty-icon"></i>
  `;
  empty.hidden = false;
}

function hideEmptyState(empty) {
  if (!empty) return;
  empty.hidden = true;
  empty.innerHTML = '';
}

function hidePagination() {
  const top = document.getElementById('blog-pagination-top');
  const bottom = document.getElementById('blog-pagination-bottom');
  if (top) top.hidden = true;
  if (bottom) bottom.hidden = true;
}

function renderPagination(totalPages) {
  const paginationTop = document.getElementById('blog-pagination-top');
  const paginationBottom = document.getElementById('blog-pagination-bottom');

  if (!paginationTop || !paginationBottom) return;

  paginationTop.hidden = false;
  paginationBottom.hidden = totalPages <= 1;

  const t = getUiText();
  const html = `
    <button class="pagination-btn" data-dir="prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="${t.prev}">
      <i class="fas fa-chevron-left"></i>
    </button>
    <span class="pagination-info">${currentPage} / ${totalPages}</span>
    <button class="pagination-btn" data-dir="next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="${t.next}">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationTop.innerHTML = html;
  paginationBottom.innerHTML = html;

  const grid = document.getElementById('blog-grid');
  const empty = document.getElementById('blog-empty');
  const listingSection = document.querySelector('.blog-listing-section');

  paginationTop.querySelectorAll('.pagination-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      const total = Math.ceil(currentFiltered.length / POSTS_PER_PAGE);
      if (dir === 'prev' && currentPage > 1) currentPage--;
      if (dir === 'next' && currentPage < total) currentPage++;
      renderPage(grid, empty);
    });
  });

  paginationBottom.querySelectorAll('.pagination-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      const total = Math.ceil(currentFiltered.length / POSTS_PER_PAGE);
      if (dir === 'prev' && currentPage > 1) currentPage--;
      if (dir === 'next' && currentPage < total) currentPage++;
      renderPage(grid, empty);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderPosts(posts, grid) {
  const t = getUiText();

  grid.innerHTML = posts
    .map(
      (post) => `
      <article class="blog-card blog-card-with-image">
        <a class="blog-card-cover-link" href="${escapeHtml(post.url)}" aria-label="${escapeHtml(post.title)}">
          <img
            class="blog-card-cover"
            src="${escapeHtml(post.coverImage || '/assets/blog/article-default-image.webp')}"
            alt="${escapeHtml(post.title)}"
            loading="lazy"
            onerror="this.onerror=null;this.src='/assets/blog/article-default-image.webp';"
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
