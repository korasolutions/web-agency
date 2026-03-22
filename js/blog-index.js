let allPosts = [];

async function initBlogIndex() {
  const grid = document.getElementById('blog-grid');
  const empty = document.getElementById('blog-empty');
  const search = document.getElementById('blog-search');
  const category = document.getElementById('blog-category');

  if (!grid) return;

  try {
    const response = await fetch('/data/blog-index.json?v=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar el índice');

    const data = await response.json();
    allPosts = Array.isArray(data.posts) ? data.posts : [];

    const applyFilters = () => {
      const query = (search?.value || '').trim().toLowerCase();
      const currentCategory = category?.value || 'all';

      const filtered = allPosts.filter((post) => {
        const text = `${post.title} ${post.excerpt} ${post.keywords?.join(' ') || ''}`.toLowerCase();
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
    grid.innerHTML = `
      <article class="blog-card">
        <h2>No se pudo cargar el blog</h2>
        <p>Verifica que exista el archivo /data/blog-index.json.</p>
      </article>
    `;
  }
}

function renderPosts(posts, grid, empty) {
  if (!posts.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  grid.innerHTML = posts.map((post) => `
    <article class="blog-card">
      <div class="blog-card-meta">
        <span class="blog-tag">${escapeHtml(post.category || 'Blog')}</span>
        <span>${escapeHtml(post.date || '')}</span>
        <span>${escapeHtml(post.readingTime || '')}</span>
      </div>
      <h2><a href="${post.url}">${escapeHtml(post.title)}</a></h2>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <a class="blog-card-link" href="${post.url}">Leer artículo <i class="fas fa-arrow-right"></i></a>
    </article>
  `).join('');
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
