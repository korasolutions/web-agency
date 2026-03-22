async function loadBlogPreview() {
  const previewGrid = document.getElementById('blog-preview-grid');
  if (!previewGrid) return;

  try {
    const response = await fetch('/data/blog-index.json?v=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar el índice del blog');

    const data = await response.json();
    const latestPosts = Array.isArray(data.posts) ? data.posts.slice(0, 3) : [];

    if (!latestPosts.length) {
      previewGrid.innerHTML = `
        <article class="blog-card">
          <h3>Próximamente publicaremos artículos</h3>
          <p>Esta sección mostrará automáticamente los últimos contenidos del blog de KORA.</p>
        </article>
      `;
      return;
    }

    previewGrid.innerHTML = latestPosts.map(renderBlogCard).join('');
  } catch (error) {
    console.error('[blog-preview]', error);
    previewGrid.innerHTML = `
      <article class="blog-card">
        <h3>No se pudo cargar el blog</h3>
        <p>Revisa que exista /data/blog-index.json y que tenga artículos generados.</p>
      </article>
    `;
  }
}

function renderBlogCard(post) {
  return `
    <article class="blog-card">
      <div class="blog-card-meta">
        <span class="blog-tag">${escapeHtml(post.category || 'Blog')}</span>
        <span>${escapeHtml(post.date || '')}</span>
        <span>${escapeHtml(post.readingTime || '')}</span>
      </div>
      <h3><a href="${post.url}">${escapeHtml(post.title)}</a></h3>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <a class="blog-card-link" href="${post.url}">Leer artículo <i class="fas fa-arrow-right"></i></a>
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
