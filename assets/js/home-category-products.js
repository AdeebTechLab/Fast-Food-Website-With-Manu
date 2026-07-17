(function () {
  'use strict';

  const track = document.getElementById('home-category-products');
  if (!track) return;
  const hotDealsContainer = document.querySelector('.dishes-container');

  // Remove the old demo markup immediately. Both home sections are now
  // populated only from the menu saved through the admin panel.
  track.innerHTML = '<p class="home-menu-status">Loading menu items...</p>';
  if (hotDealsContainer) {
    hotDealsContainer.innerHTML = '<p class="home-menu-status">Loading Hot Deals...</p>';
  }

  function imageSrc(image) {
    if (!image) return 'assets/images/burger.png';
    if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;
    return `assets/${image}`;
  }

  function itemPrice(item) {
    if (Array.isArray(item.variants) && item.variants.length) {
      const prices = item.variants.map((variant) => Number(variant.price) || 0);
      return `From Rs. ${Math.min(...prices)}`;
    }
    return `Rs. ${Number(item.price) || 0}`;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[character]);
  }

  function renderCategoryProducts(categories) {
    const cards = categories
      .filter((category) => Array.isArray(category.items) && category.items.length)
      .map((category) => {
        const item = category.items[0];
        const destination = `menu.html#${encodeURIComponent(category.categoryId)}`;
        return `
          <article class="product-card home-menu-link" data-category="${category.categoryId}" role="link" tabindex="0" aria-label="View ${item.name}">
            <div class="product-image">
              <img loading="lazy" decoding="async" src="${imageSrc(item.image)}" alt="${item.name}">
              <span class="wishlist-btn" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>
            </div>
            <span class="home-category-name">${category.title}</span>
            <h3>${item.name}</h3>
            <p>${itemPrice(item)}</p>
          </article>`;
      });

    if (!cards.length) return;
    track.innerHTML = cards.join('');

    track.querySelectorAll('.product-card').forEach((card) => {
      const openCategory = () => {
        window.location.href = `menu.html#${encodeURIComponent(card.dataset.category)}`;
      };
      card.addEventListener('click', openCategory);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCategory();
        }
      });
    });
  }

  function renderHotDeals(categories) {
    const container = hotDealsContainer;
    if (!container) return;

    const deals = categories.flatMap((category) =>
      (category.items || [])
        .filter((item) => item.bestDeal)
        .map((item) => ({ item, categoryId: category.categoryId }))
    );

    if (!deals.length) {
      container.innerHTML = '<p class="menu-empty">No Hot Deals selected yet.</p>';
      return;
    }

    container.innerHTML = deals.map(({ item, categoryId }) => `
      <article class="dish-card animate-on-scroll hot-deal-link">
        <div class="dish-image">
          <img loading="lazy" decoding="async" src="${imageSrc(item.image)}" alt="${escapeHtml(item.name)}">
          <div class="dish-badge">Hot Deal</div>
        </div>
        <div class="dish-content">
          <h3>${escapeHtml(item.name)}</h3>
          <div class="dish-rating" aria-label="Popular menu item">
            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
          </div>
          <p>${escapeHtml(item.description || 'Freshly prepared with quality ingredients.')}</p>
          <div class="dish-footer">
            <div class="dish-price">${itemPrice(item)}</div>
            <a class="btn" href="menu.html#${encodeURIComponent(categoryId)}">Order Now</a>
          </div>
        </div>
      </article>
    `).join('');
  }

  async function loadCategoryProducts() {
    try {
      const response = await fetch('/api/menu', { cache: 'no-store' });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const categories = await response.json();
      renderCategoryProducts(categories);
      renderHotDeals(categories);
    } catch (error) {
      track.innerHTML = '<p class="home-menu-status">Menu items will appear here after they are saved from the admin panel.</p>';
      if (hotDealsContainer) {
        hotDealsContainer.innerHTML = '<p class="home-menu-status">Select items as Hot Deals in the admin panel to show them here.</p>';
      }
      console.warn('Live category products are available when the site is served over HTTP.', error);
    }
  }

  function scrollTrack(direction) {
    track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.82, 280), behavior: 'smooth' });
  }

  document.getElementById('home-products-prev')?.addEventListener('click', () => scrollTrack(-1));
  document.getElementById('home-products-next')?.addEventListener('click', () => scrollTrack(1));
  loadCategoryProducts();
})();
