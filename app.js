// --- Data Structure ---
// --- Reusable inline SVG icons (outline style, matches header/footer icon set) ---
const ICON_TRASH = '<svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
const ICON_BAG = '<svg class="icon" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
const ICON_FLAME = '<svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5"/></svg>';
const ICON_CHEVRON_LEFT = '<svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>';
const ICON_CHEVRON_RIGHT = '<svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>';
const ICON_LIST = '<svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>';
const ICON_TAG = '<svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42Z"/><path d="M7 7h.01"/></svg>';
const ICON_ARROW_RIGHT = '<svg class="icon" style="width:16px;height:16px" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

// Maps each category's categoryId to its banner photo in /assets. One
// photo per category, shown above the product grid in that category's
// section. sizzling-steaks-chicken has no dedicated asset yet, so it
// falls back to the general chicken photo.
const CATEGORY_IMAGES = {
    'appetizer': 'cat-appetizer.webp',
    'chinese-soups': 'cat-chinese-soups.webp',
    'fish': 'cat-fish.webp',
    'chicken': 'cat-chicken.webp',
    'rice': 'cat-rice.webp',
    'noodles': 'cat-noodles.webp',
    'chopsuey': 'cat-chopsuey.webp',
    'burgers': 'cat-burgers.webp',
    'sandwiches': 'cat-sandwiches.webp',
    'english-food': 'cat-english-food.webp',
    'sizzling-steaks-chicken': 'cat-chicken.webp',
    'pakistani-food-chicken': 'cat-pakistani-chicken.webp',
    'pakistani-food-mutton': 'cat-pakistani-mutton.webp',
    'bar-b-q': 'cat-bar-bq.webp',
    'special-deals': 'deal-combo.webp',
    'tandoor': 'cat-tandoor.webp',
    'royal-drinks': 'cat-royal-drinks.webp',
    'ice-cream': 'cat-ice-cream.webp',
    'seasonal-fresh-juices': 'cat-juices.webp',
    'milk-shakes': 'cat-milk-shakes.webp',
    'cold-drinks': 'cat-cold-drinks.webp'
};

// The menu itself now lives in /data/menu-data.json and is served through
// /api/menu, so it can be edited from /admin without a code change or
// redeploy. `menuData` starts empty and is populated by loadMenuData()
// below before anything tries to render it.
let menuData = [];

// Flat lookup of every item by id, tagged with its categoryId - rebuilt
// every time menuData is (re)loaded.
let allItemsById = {};

function rebuildItemIndex() {
    allItemsById = {};
    menuData.forEach(category => {
        category.items.forEach(item => {
            allItemsById[item.id] = { ...item, categoryId: category.categoryId };
        });
    });
}

// --- Variant helpers ---
// Some items (e.g. "Chicken Wings") come in more than one size/portion -
// each with its own price (Half/Full, Small/Large, etc.). Those items carry
// a `variants` array instead of (or in addition to) a flat `price`. A
// single card is shown for the item; picking "+" lets the customer choose
// which variant to add, each tracked as its own line in the cart.
function hasVariants(item) {
    return !!(item && Array.isArray(item.variants) && item.variants.length > 0);
}

// The price to show/sort by on the card before a variant is chosen -
// the lowest-priced variant, so the card reads "From Rs. X".
function displayPrice(item) {
    if (hasVariants(item)) {
        return Math.min(...item.variants.map(v => v.price));
    }
    return item.price;
}

// Builds the unique key used to track a cart line: plain item id for
// items without variants, or "id::VariantLabel" for a specific variant -
// this lets Half and Full of the same item sit in the cart as separate lines.
function cartKey(id, variantLabel) {
    return variantLabel ? `${id}::${variantLabel}` : `${id}`;
}

// Resolves an item's `image` field to a real <img src>. Admin-uploaded
// photos are stored as full Vercel Blob URLs; the original bundled photos
// are just filenames that live in /assets.
function imageSrc(image) {
    if (!image) return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;
    return `assets/${image}`;
}

// Fetches the current menu from /api/menu (which serves the admin-edited
// copy from Vercel Blob, falling back to the bundled JSON on the server
// side). Falls back to an empty menu with a console warning if the API
// itself is unreachable, so a network hiccup doesn't throw and block the
// rest of the page's init.
async function loadMenuData() {
    try {
        const response = await fetch('/api/menu', { cache: 'no-store' });
        if (!response.ok) throw new Error(`status ${response.status}`);
        menuData = await response.json();
    } catch (err) {
        console.error('Failed to load menu data from /api/menu.', err);
        menuData = [];
    }
    rebuildItemIndex();
}

// WhatsApp business number that orders are sent to at checkout.
// Restaurant WhatsApp: 0333 3103031 (international format for wa.me).
const WHATSAPP_NUMBER = "923333103031";

// --- Shared Header/Footer Loader ---
// Fetches header.html (overlay, location modal, sidebars, main header)
// and footer.html (site footer + floating action buttons), injecting
// each into any page that includes the matching placeholder div.
// NOTE: requires the page to be served over http/https (e.g. a local dev
// server) - fetch() of local files is blocked under the file:// protocol.
async function loadHeader() {
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('header.html?v=20260717a', { cache: 'no-cache' });
        const html = await response.text();
        placeholder.innerHTML = html;
        unwrapPlaceholder(placeholder);
    } catch (err) {
        console.error('Failed to load header.html. Make sure the site is served via a local/live server, not opened directly as a file.', err);
    }
}

async function loadFooter() {
    const placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('footer.html?v=20260717a', { cache: 'no-cache' });
        const html = await response.text();
        placeholder.innerHTML = html;
        unwrapPlaceholder(placeholder);
    } catch (err) {
        console.error('Failed to load footer.html. Make sure the site is served via a local/live server, not opened directly as a file.', err);
    }
}

// Replaces a wrapper element with its own children, so the injected
// header/footer markup (e.g. <header>) becomes a direct child of
// <body> instead of being nested inside a placeholder <div>. This matters
// because Chromium's handling of <body>'s propagated overflow can break
// position: sticky for elements nested an extra level deep - moving
// the site header up to sit alongside .menu-controls (which is a direct
// child of body) keeps both stuck to the top correctly while scrolling.
function unwrapPlaceholder(placeholder) {
    const parent = placeholder.parentNode;
    while (placeholder.firstChild) {
        parent.insertBefore(placeholder.firstChild, placeholder);
    }
    parent.removeChild(placeholder);
}

// --- Initialization & Rendering ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load the shared header/footer and the current menu data (from the
    // admin-editable /api/menu endpoint) in parallel, since nothing below
    // needs them individually - only once both are ready.
    await Promise.all([loadHeader(), loadFooter(), loadMenuData()]);

    // 2. Now that header.html is in the DOM, grab its elements.
    // Guarded with null-checks so that if header.html failed to load (e.g. a
    // stale cached response after a redeploy), the menu/cart buttons still
    // fail gracefully instead of throwing and silently blocking every other
    // click handler on the page.
    overlay = document.getElementById('page-overlay');
    cartSidebar = document.getElementById('cart-sidebar');

    if (!overlay || !cartSidebar) {
        console.error('Header did not load correctly - the cart button will not work. Try a hard refresh (Ctrl/Cmd+Shift+R).');
    } else {
        // Clicking the dark background closes the cart sidebar
        overlay.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    // 4. Render Menu Grid (only present on pages that have #menu-grid)
    if (document.getElementById('menu-grid')) {
        renderCategoryNav();
        renderMenuGrid();
        initCategoryScrollSpy();
        initSearchPlaceholderCycle();

        // Keep the nav's left/right scroll arrows in sync as the user
        // drags/swipes the category list or resizes the window.
        const navListEl = document.getElementById('horizontal-categories');
        if (navListEl) {
            navListEl.addEventListener('scroll', updateCategoryNavArrows);
            window.addEventListener('resize', updateCategoryNavArrows);
        }
    }

    // 5. Keep the category/search bar pinned directly beneath the header,
    // even if the header's real height differs from any fixed assumption.
    initStickyHeaderOffset();
    initMobileNav();

    // 6. Render current cart state (badges, floating button, sticky bar, action buttons)
    updateCartUI();
    if (new URLSearchParams(window.location.search).get('openCart') === '1') toggleCart();
});

function getBestDealItems() {
    const items = [];
    menuData.forEach(category => {
        category.items.forEach(item => {
            if (item.bestDeal) items.push(item);
        });
    });
    return items;
}

function renderCategoryNav() {
    const navList = document.getElementById('horizontal-categories');
    if (!navList) return;

    navList.innerHTML = '';

    const hasBestDeals = getBestDealItems().length > 0;
    let isFirst = true;

    if (hasBestDeals) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#best-deals" data-category="best-deals" class="active-category">Best Deals</a>`;
        navList.appendChild(li);
        isFirst = false;
    }

    menuData.forEach((category) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${category.categoryId}" data-category="${category.categoryId}" class="${isFirst ? 'active-category' : ''}">${category.title}</a>`;
        navList.appendChild(li);
        isFirst = false;
    });

    updateCategoryNavArrows();
}

// Scrolls the horizontal category pill list left/right when the arrow
// buttons are clicked (mirrors scrollUpsell below).
function scrollCategoryNav(direction) {
    const navList = document.getElementById('horizontal-categories');
    if (!navList) return;
    navList.scrollBy({ left: direction * 180, behavior: 'smooth' });
}

// Hides the left arrow when already scrolled to the start, and the right
// arrow when scrolled to the end, so users aren't shown a dead button.
function updateCategoryNavArrows() {
    const navList = document.getElementById('horizontal-categories');
    if (!navList) return;
    const nav = navList.closest('.category-nav');
    if (!nav) return;
    const leftArrow = nav.querySelector('.cat-nav-arrow-left');
    const rightArrow = nav.querySelector('.cat-nav-arrow-right');
    if (!leftArrow || !rightArrow) return;

    const maxScroll = navList.scrollWidth - navList.clientWidth;
    leftArrow.classList.toggle('hidden', navList.scrollLeft <= 4);
    rightArrow.classList.toggle('hidden', navList.scrollLeft >= maxScroll - 4);
}

// Highlights the nav link for whichever category section the user has
// actually scrolled to, and keeps that pill scrolled into sight.
//
// Uses a single "activation line" just below the sticky nav, and picks
// whichever section's top has scrolled above that line (the last one to
// do so). This is deliberately NOT an IntersectionObserver with a large
// trigger band: a big band would mark a very short section (e.g. a
// category with only one item, like "Chinese") active as soon as it
// merely entered the band, even while the user was still looking at the
// previous category above it. Tracking exact section-top position against
// one line stays correct no matter how tall or short a section is.
function initCategoryScrollSpy() {
    const sections = Array.from(document.querySelectorAll('.menu-category'));
    const navList = document.getElementById('horizontal-categories');
    if (!sections.length || !navList) return;

    let lastActiveId = null;
    // On page load, the sticky nav bar sits below the tall hero image in
    // normal document flow (it hasn't "stuck" yet), so it can be entirely
    // off-screen at first paint. Calling scrollIntoView() on its pill at
    // that moment makes the browser auto-scroll the whole page down to
    // reveal it - which pushes the hero image up under the sticky header
    // right on load. We skip scrollIntoView for this first, initial sync
    // and only use it for real changes triggered by the user scrolling.
    let hasSynced = false;

    const setActiveCategory = (id) => {
        if (id === lastActiveId) return;
        lastActiveId = id;

        navList.querySelectorAll('a').forEach(a => a.classList.remove('active-category'));
        const activeLink = navList.querySelector(`a[data-category="${id}"]`);
        if (activeLink) {
            activeLink.classList.add('active-category');
            if (hasSynced) {
                activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    };

    function getActivationLine() {
        const controls = document.querySelector('.menu-controls');
        return (controls ? controls.getBoundingClientRect().bottom : 140) + 4;
    }

    let ticking = false;
    function updateActive() {
        ticking = false;

        // Within a few px of the very bottom of the page, always activate
        // the last section - handles short trailing categories that might
        // never fully cross the activation line on their own.
        const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (scrolledToBottom) {
            setActiveCategory(sections[sections.length - 1].id);
            hasSynced = true;
            return;
        }

        const line = getActivationLine();
        let current = sections[0];
        for (const section of sections) {
            if (section.getBoundingClientRect().top <= line) {
                current = section;
            } else {
                break;
            }
        }
        setActiveCategory(current.id);
        hasSynced = true;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateActive);
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateActive();
}

// Keeps .menu-controls (category nav + search) pinned directly below the
// real, rendered height of the site header, instead of relying on a fixed
// top offset that could drift out of sync (which previously caused the
// header to appear to "disappear" behind the sticky nav while scrolling).
function initStickyHeaderOffset() {
    const header = document.querySelector('header');
    if (!header) return;

    const setOffset = () => {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    };
    setOffset();

    if (window.ResizeObserver) {
        new ResizeObserver(setOffset).observe(header);
    } else {
        window.addEventListener('resize', setOffset);
    }
}

function initMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('nav');
    if (!navToggle || !nav) return;

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        nav.classList.toggle('active');
    });

    document.querySelectorAll('nav a').forEach((link) => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            nav.classList.remove('active');
        });
    });
}

// True when a plain (non-variant) item has a valid discount configured -
// an old price higher than its current price.
function hasDiscount(item) {
    return !hasVariants(item) && item.oldPrice != null && item.oldPrice > item.price;
}

function renderProductCardHTML(item) {
    const descHtml = item.description ? `<p>${item.description}</p>` : '';
    const showFrom = item.priceFrom || hasVariants(item);
    let priceHtml;
    if (hasDiscount(item)) {
        priceHtml = `<div class="price price-discount"><span class="price-old">Rs. ${item.oldPrice}</span><span class="price-new">Rs. ${item.price}</span></div>`;
    } else if (showFrom) {
        priceHtml = `<div class="price">From Rs. ${displayPrice(item)}</div>`;
    } else {
        priceHtml = `<div class="price">Rs. ${item.price}</div>`;
    }
    const discountPercent = hasDiscount(item) ? Math.round((1 - item.price / item.oldPrice) * 100) : 0;
    const badgeHtml = item.bestDeal
        ? `<div class="badge-tag">Best Deal</div>`
        : (item.badge
            ? `<div class="badge-tag">${item.badge}</div>`
            : (hasDiscount(item) ? `<div class="badge-tag badge-discount">${discountPercent}% OFF</div>` : ''));

    return `
        <div class="product-card" data-name="${item.name.toLowerCase()}" onclick="openProductDetail(${item.id})">
            <div class="product-info">
                <div>
                    <h4>${item.name}</h4>
                    ${descHtml}
                </div>
                ${priceHtml}
            </div>
            <div class="product-image-container">
                ${badgeHtml}
                <img class="product-img" src="${imageSrc(item.image)}" alt="${item.name}">
                <div class="product-action" id="cart-action-${item.id}" onclick="event.stopPropagation()">${renderCartActionHTML(item.id)}</div>
            </div>
        </div>
    `;
}

function renderMenuGrid() {
    const gridContainer = document.getElementById('menu-grid');
    gridContainer.innerHTML = ''; // Clear container

    // Virtual "Best Deals" section: pulls in every item tagged as a best
    // deal (via the admin panel) without removing it from its own category
    // below, so the same item legitimately appears in both places.
    const bestDeals = getBestDealItems();
    if (bestDeals.length > 0) {
        const bestSection = document.createElement('section');
        bestSection.classList.add('menu-category');
        bestSection.id = 'best-deals';
        bestSection.innerHTML = `<h2>Best Deals</h2><div class="product-grid">${bestDeals.map(renderProductCardHTML).join('')}</div>`;
        gridContainer.appendChild(bestSection);
    }

    menuData.forEach(category => {
        // Create Section
        const section = document.createElement('section');
        section.classList.add('menu-category');
        section.id = category.categoryId;

        const itemsHtml = category.items.map(renderProductCardHTML).join('');
        const headerHtml = `<div class="category-header">
            <span class="category-header-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M7 3v7M4.5 3v4.5A2.5 2.5 0 0 0 7 10m0 0v11M15 3v18m0-18c3 1.2 4.5 3.6 4.5 6.5S18 14 15 15"/></svg>
            </span>
            <div><span class="category-header-label">Our Menu</span><h2>${category.title}</h2></div>
        </div>`;
        section.innerHTML = `${headerHtml}<div class="product-grid">${itemsHtml}</div>`;
        gridContainer.appendChild(section);
    });
}

// --- Live Search Functionality ---

// Cycles the search bar's placeholder through random dish names, e.g.
// "Search for Crispy Chicken..." -> "Search for FIFA Duo Deal..." - the
// "Search for " prefix stays fixed, only the dish name rotates.
function initSearchPlaceholderCycle() {
    const input = document.getElementById('menu-search');
    if (!input) return;

    const names = menuData.flatMap(category => category.items.map(item => item.name));
    if (names.length === 0) return;

    // Shuffle once so the rotation order isn't the same as menu order
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    let idx = 0;

    const setPlaceholder = () => {
        input.placeholder = `Search for ${shuffled[idx]}...`;
        idx = (idx + 1) % shuffled.length;
    };

    setPlaceholder();
    setInterval(setPlaceholder, 2500);
}


function filterMenu() {
    const query = document.getElementById('menu-search').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    const categories = document.querySelectorAll('.menu-category');

    // Filter Cards
    cards.forEach(card => {
        const name = card.getAttribute('data-name');
        if (name.includes(query)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });

    // Hide empty category headers
    categories.forEach(category => {
        const totallyHidden = category.querySelectorAll('.product-card[style="display: none;"]').length;
        const totalCards = category.querySelectorAll('.product-card').length;

        if (totallyHidden === totalCards) {
            category.style.display = "none";
        } else {
            category.style.display = "block";
        }
    });
}


// --- Sidebar & Overlay Logic ---
// These are assigned once header.html has been injected into the page (see loadHeader/init below)
let overlay, cartSidebar;

function toggleCart() {
    if (!cartSidebar) return;
    cartSidebar.classList.toggle('open');
    checkOverlay();
}

function checkOverlay() {
    if (!overlay || !cartSidebar) return;
    if (cartSidebar.classList.contains('open')) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}


// --- Toast Notification ---
let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = `<span class="toast-check"><svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24" stroke="white"><path d="M20 6 9 17l-5-5"/></svg></span> ${message}`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}


// --- Shopping Cart Logic ---
const SHARED_CART_KEY = 'dominoFazilpurCart';
let cart = [];
try {
    const savedCart = JSON.parse(localStorage.getItem(SHARED_CART_KEY) || '[]');
    if (Array.isArray(savedCart)) cart = savedCart;
} catch {
    cart = [];
}

function persistCart() {
    localStorage.setItem(SHARED_CART_KEY, JSON.stringify(cart));
}

// Returns the HTML for a product card's action area. Items with variants
// (Half/Full etc.) always show a "+" that opens the variant picker in the
// product detail modal, since a single card can have several cart lines
// (one per chosen variant) - a small badge shows the combined quantity
// already in the cart, if any. Items without variants keep the classic
// plain "+" button, or a remove/qty/add stepper once added.
function renderCartActionHTML(id) {
    const item = allItemsById[id];
    if (!item) return '';

    if (hasVariants(item)) {
        const totalQty = cart.filter(i => i.id === id).reduce((sum, i) => sum + i.qty, 0);
        const badge = totalQty > 0 ? `<span class="add-btn-badge">${totalQty}</span>` : '';
        return `<button class="add-btn" onclick="openProductDetail(${id})" aria-label="Choose size">+${badge}</button>`;
    }

    const key = cartKey(id);
    const cartItem = cart.find(i => i.cartKey === key);

    if (cartItem) {
        return `
            <div class="qty-stepper">
                <button class="qty-btn qty-remove" onclick="updateQty('${key}', -1)" aria-label="Decrease">&minus;</button>
                <span class="qty-count">${cartItem.qty}</span>
                <button class="qty-btn qty-add" onclick="updateQty('${key}', 1)" aria-label="Add">+</button>
            </div>`;
    }

    return `<button class="add-btn" onclick="addToCart(${id})">+</button>`;
}

// Re-renders every product card's action area (called after any cart change)
function refreshCartActionButtons() {
    document.querySelectorAll('[id^="cart-action-"]').forEach(el => {
        const id = parseInt(el.id.replace('cart-action-', ''), 10);
        el.innerHTML = renderCartActionHTML(id);
    });
}

// Adds an item to the cart. For items with variants, pass `variantLabel`
// (e.g. "Half") so it's tracked as its own cart line with that variant's
// price and shown as "Item Name (Half)" - Half and Full of the same item
// can then both sit in the cart at once, each with independent quantity.
function addToCart(id, qty = 1, instructions = '', variantLabel = null) {
    const item = allItemsById[id];
    if (!item) return;

    let price = item.price;
    let displayName = item.name;
    if (hasVariants(item)) {
        const variant = item.variants.find(v => v.label === variantLabel) || item.variants[0];
        price = variant.price;
        displayName = `${item.name} (${variant.label})`;
        variantLabel = variant.label;
    } else {
        variantLabel = null;
    }

    const key = cartKey(id, variantLabel);
    const existing = cart.find(i => i.cartKey === key);
    if (existing) {
        existing.qty += qty;
        if (instructions) existing.instructions = instructions;
    } else {
        cart.push({ cartKey: key, id, variant: variantLabel, name: displayName, price, qty, instructions: instructions || '' });
    }
    showToast('Item added to cart');
    persistCart();
    updateCartUI();
}

function updateQty(key, change) {
    const item = cart.find(i => i.cartKey === key);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.cartKey !== key);
        }
        persistCart();
        updateCartUI();
    }
}


// --- Product Detail Modal ---
let pdCurrentId = null;
let pdQty = 1;

function openProductDetail(id) {
    const item = allItemsById[id];
    if (!item) return;

    pdCurrentId = id;
    pdQty = 1;

    document.getElementById('pd-image').src = imageSrc(item.image);
    document.getElementById('pd-image').alt = item.name;
    document.getElementById('pd-name').innerText = item.name;
    document.getElementById('pd-description').innerText = item.description || '';
    document.getElementById('pd-description').style.display = item.description ? 'block' : 'none';
    document.getElementById('pd-qty').innerText = pdQty;

    renderPdVariantPicker(item);
    updatePdPricing(item);

    // Variant items (Half/Full, Small/Medium/Large, 250ml/1 Litre, etc.)
    // add straight from each row, so the qty-stepper here stays hidden for
    // them - but the footer itself stays visible as a summary "Add to
    // Cart" bar (showing running total + count) that just closes the
    // modal once at least one size has been added, so the sheet always
    // ends with a clear, tappable confirm action.
    setupPdFooter(item);

    document.getElementById('product-detail-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Configures the footer bar for the item currently open in the modal:
// plain items keep the qty-stepper + "Add to Cart" button (adds pdQty and
// closes); variant items hide the qty-stepper and turn the button into a
// running summary of everything picked so far.
function setupPdFooter(item) {
    const qtyWrap = document.getElementById('pd-qty-stepper-wrap');
    const addBtn = document.getElementById('pd-add-to-cart');

    if (hasVariants(item)) {
        qtyWrap.style.display = 'none';
        addBtn.onclick = handlePdVariantAddClick;
        updatePdVariantFooterSummary(item);
    } else {
        qtyWrap.style.display = 'flex';
        addBtn.onclick = addPdToCart;
        document.getElementById('pd-add-price').style.display = 'inline';
        document.getElementById('pd-add-divider').style.display = 'inline';
        document.getElementById('pd-add-label').innerText = 'Add to Cart';
    }
}

// Updates the footer "Add to Cart" button for a variant item to reflect
// everything currently in the cart for it - e.g. "Rs. 2350 | Add to Cart
// (3)" once something's been picked, or the first/top option's price
// beforehand (e.g. "Rs. 800 | Add to Cart") so the button is always a real,
// working add action rather than a dead-looking "Done".
function updatePdVariantFooterSummary(item) {
    const lines = cart.filter(i => i.id === item.id);
    const totalQty = lines.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = lines.reduce((sum, i) => sum + i.qty * i.price, 0);

    const priceEl = document.getElementById('pd-add-price');
    const dividerEl = document.getElementById('pd-add-divider');
    const labelEl = document.getElementById('pd-add-label');

    priceEl.style.display = 'inline';
    dividerEl.style.display = 'inline';

    if (totalQty > 0) {
        priceEl.innerText = `Rs. ${totalPrice}`;
        labelEl.innerText = `Add to Cart (${totalQty})`;
    } else {
        priceEl.innerText = `Rs. ${item.variants[0].price}`;
        labelEl.innerText = 'Add to Cart';
    }
}

// Click handler for the footer button on a variant item. If nothing has
// been picked yet, it adds one of the first/top option (e.g. Half) so the
// button always actually adds something to the cart; if one or more
// variants were already added via their own row, it just confirms and
// closes since those additions already happened.
function handlePdVariantAddClick() {
    const item = allItemsById[pdCurrentId];
    if (!item) return;

    const totalQty = cart.filter(i => i.id === item.id).reduce((sum, i) => sum + i.qty, 0);
    if (totalQty === 0) {
        addToCart(item.id, 1, '', item.variants[0].label);
    }
    closeProductDetail();
}

// Shows a stacked list of size/option rows (Half above Full, Small above
// Medium above Large, etc. - always in the order the admin entered them)
// when the item has variants. Each row starts with a plain "+" button;
// tapping it adds that variant straight to the cart and the button turns
// into a qty stepper right there next to that row, so quantity only shows
// up once a size has actually been chosen. Hidden entirely for plain
// single-price items.
function renderPdVariantPicker(item) {
    const wrap = document.getElementById('pd-variant-picker');
    if (!wrap) return;

    if (!hasVariants(item)) {
        wrap.innerHTML = '';
        wrap.style.display = 'none';
        return;
    }

    wrap.style.display = 'block';
    const rows = item.variants.map((v, idx) => `
        <div class="pd-variant-row">
            <div class="pd-variant-row-info">
                <span class="pd-variant-row-label">${v.label}</span>
                <span class="pd-variant-row-price">Rs. ${v.price}</span>
            </div>
            <div class="pd-variant-row-action" id="pd-variant-action-${item.id}-${idx}">
                ${pdVariantActionHTML(item.id, v.label)}
            </div>
        </div>
    `).join('');

    wrap.innerHTML = `
        <span class="pd-variant-label">Select Option</span>
        <div class="pd-variant-list">${rows}</div>
    `;
}

// The "+" button, or qty stepper once that specific variant is in the
// cart, shown inline in a pd-variant-row.
function pdVariantActionHTML(itemId, label) {
    const key = cartKey(itemId, label);
    const cartItem = cart.find(i => i.cartKey === key);

    if (cartItem) {
        return `
            <div class="qty-stepper">
                <button class="qty-btn qty-remove" onclick="updatePdVariantQty('${key}', -1)" aria-label="Decrease">&minus;</button>
                <span class="qty-count">${cartItem.qty}</span>
                <button class="qty-btn qty-add" onclick="updatePdVariantQty('${key}', 1)" aria-label="Add">+</button>
            </div>`;
    }

    const safeLabel = label.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<button class="add-btn" onclick="addPdVariantToCart(${itemId}, '${safeLabel}')" aria-label="Add ${label}">+</button>`;
}

// Adds one of a specific variant straight from its row, then re-renders
// just the variant list so that row's "+" turns into a qty stepper.
function addPdVariantToCart(itemId, label) {
    addToCart(itemId, 1, '', label);
    const item = allItemsById[itemId];
    if (item) {
        renderPdVariantPicker(item);
        updatePdVariantFooterSummary(item);
    }
}

function updatePdVariantQty(key, change) {
    updateQty(key, change);
    const item = allItemsById[pdCurrentId];
    if (item) {
        renderPdVariantPicker(item);
        updatePdVariantFooterSummary(item);
    }
}

function updatePdPricing(item) {
    const pdPriceEl = document.getElementById('pd-price');

    if (hasVariants(item)) {
        const minPrice = Math.min(...item.variants.map(v => v.price));
        pdPriceEl.innerText = `From Rs. ${minPrice}`;
        return;
    }

    const unitPrice = item.price;
    if (hasDiscount(item)) {
        pdPriceEl.innerHTML = `<span class="pd-price-old">Rs. ${item.oldPrice}</span> Rs. ${unitPrice}`;
    } else {
        pdPriceEl.innerText = `Rs. ${unitPrice}`;
    }
    document.getElementById('pd-add-price').innerText = `Rs. ${unitPrice * pdQty}`;
}

function closeProductDetail() {
    document.getElementById('product-detail-overlay').classList.remove('active');
    document.body.style.overflow = '';
    pdCurrentId = null;
}

function updatePdQty(change) {
    pdQty = Math.max(1, pdQty + change);
    document.getElementById('pd-qty').innerText = pdQty;
    const item = allItemsById[pdCurrentId];
    if (item) updatePdPricing(item);
}

function addPdToCart() {
    if (pdCurrentId === null) return;
    addToCart(pdCurrentId, pdQty, '', null);
    closeProductDetail();
}

// Picks a handful of add-on items from any category other than the ones
// already in the cart (e.g. if only FIFA/Mashup Deals exist, this simply
// has nothing to suggest and the upsell section stays hidden - it will
// pick back up automatically if more categories are added later).
function getUpsellItems() {
    const cartIds = new Set(cart.map(i => i.id));
    const cartCategoryIds = new Set(cart.map(i => allItemsById[i.id]?.categoryId));

    let pool = menuData
        .filter(category => !cartCategoryIds.has(category.categoryId))
        .flatMap(category => category.items);

    if (pool.length === 0) {
        pool = menuData.flatMap(category => category.items);
    }

    pool = pool.filter(i => !cartIds.has(i.id));

    // De-duplicate by id, cap at 6 suggestions
    const seen = new Set();
    return pool.filter(i => (seen.has(i.id) ? false : seen.add(i.id))).slice(0, 6);
}

function renderUpsellCarousel() {
    const items = getUpsellItems();
    if (items.length === 0) return '';

    const cardsHtml = items.map(item => {
        const addAction = hasVariants(item) ? `openProductDetail(${item.id})` : `addToCart(${item.id})`;
        const priceLabel = hasVariants(item)
            ? `From Rs. ${displayPrice(item)}`
            : (hasDiscount(item) ? `<span class="price-old">Rs. ${item.oldPrice}</span> Rs. ${item.price}` : `Rs. ${item.price}`);
        return `
        <div class="upsell-card">
            <div class="upsell-img-wrap">
                <img src="${imageSrc(item.image)}" alt="${item.name}">
                <button class="upsell-add-btn" onclick="${addAction}">+</button>
            </div>
            <div class="upsell-price">${priceLabel}</div>
            <div class="upsell-name">${item.name}</div>
        </div>
    `;
    }).join('');

    return `
        <div class="upsell-section">
            <div class="upsell-header">
                <span class="upsell-title">${ICON_FLAME} Popular with your order</span>
                <div class="upsell-nav">
                    <button class="upsell-nav-btn" onclick="scrollUpsell(-1)" aria-label="Previous">${ICON_CHEVRON_LEFT}</button>
                    <button class="upsell-nav-btn" onclick="scrollUpsell(1)" aria-label="Next">${ICON_CHEVRON_RIGHT}</button>
                </div>
            </div>
            <div class="upsell-track" id="upsell-track">${cardsHtml}</div>
        </div>
    `;
}

function scrollUpsell(direction) {
    const track = document.getElementById('upsell-track');
    if (!track) return;
    track.scrollBy({ left: direction * 140, behavior: 'smooth' });
}

// Builds a human-readable "ready in 45 minutes" message based on the
// order type the person picked in the location modal.
function getReadyTimeText(orderType) {
    const future = new Date(Date.now() + 45 * 60000);
    const dateStr = future.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = future.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    let action = 'ready';
    if (orderType === 'Delivery') action = 'delivered';
    else if (orderType === 'Pick-Up') action = 'ready for pick-up';
    else if (orderType === 'Car hop') action = 'ready for car-hop';
    else if (orderType === 'Dine-In') action = 'ready for dine-in';

    return { text: `Your order will be ${action} in 45 minutes on <strong>${dateStr}</strong> at <span class="ready-time-highlight">${timeStr}</span>.`, dateStr, timeStr };
}

function updateCartUI() {
    const cartBody = document.getElementById('cart-content');
    const cartFooter = document.getElementById('cart-footer-actions');
    const headerBadge = document.getElementById('cart-badge');
    const floatingBadge = document.getElementById('menu-floating-cart-badge');

    // Keep every product card's +/stepper button in sync
    refreshCartActionButtons();

    if (!cartBody || !cartFooter) return; // header not loaded yet on this render pass

    let subtotal = 0;
    let totalItems = 0;
    cart.forEach(item => {
        subtotal += item.price * item.qty;
        totalItems += item.qty;
    });

    if (cart.length === 0) {
        cartBody.classList.add('empty');
        cartBody.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${ICON_BAG}</div>
                <h4>Your cart is empty</h4>
                <p>Looks like you haven't added anything yet</p>
                <button class="browse-btn" onclick="toggleCart()">Browse Products</button>
            </div>`;
        cartFooter.style.display = 'none';
        cartFooter.innerHTML = '';

        if (headerBadge) headerBadge.style.display = 'none';
        if (floatingBadge) {
            floatingBadge.textContent = '0';
            floatingBadge.setAttribute('aria-label', '0 items');
        }
        return;
    }

    cartBody.classList.remove('empty');

    const itemsHtml = cart.map(item => {
        const menuItem = allItemsById[item.id];
        const img = menuItem ? imageSrc(menuItem.image) : '';
        const noteHtml = item.instructions ? `<span class="cart-item-note">Note: ${item.instructions}</span>` : '';
        return `
            <div class="cart-item">
                <img class="cart-item-img" src="${img}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <span class="cart-item-price">Rs. ${item.price}</span>
                    ${noteHtml}
                </div>
                <div class="qty-stepper">
                    <button class="qty-btn qty-remove" onclick="updateQty('${item.cartKey}', -1)" aria-label="Decrease">&minus;</button>
                    <span class="qty-count">${item.qty}</span>
                    <button class="qty-btn qty-add" onclick="updateQty('${item.cartKey}', 1)" aria-label="Add">+</button>
                </div>
            </div>
        `;
    }).join('');

    cartBody.innerHTML = `
        ${itemsHtml}
        <button class="add-more-items-btn" onclick="toggleCart()">+ Add more items</button>
        ${renderUpsellCarousel()}
    `;

    const orderType = localStorage.getItem('orderType') || 'Delivery';
    const ready = getReadyTimeText(orderType);

    cartFooter.style.display = 'block';
    cartFooter.innerHTML = `
        <div class="cart-summary">
            <div class="summary-row grand-total-row"><span>${ICON_LIST} Total Amount</span><span>Rs. ${subtotal}</span></div>
        </div>
        <button class="checkout-btn" onclick="checkoutViaWhatsApp()">Checkout ${ICON_ARROW_RIGHT}</button>
        <p class="ready-time-text">${ready.text}</p>
    `;

    if (headerBadge) {
        headerBadge.style.display = 'flex';
        headerBadge.innerText = totalItems;
    }
    if (floatingBadge) {
        floatingBadge.textContent = totalItems;
        floatingBadge.setAttribute('aria-label', `${totalItems} item${totalItems === 1 ? '' : 's'}`);
    }
}

// Opens the "Delivery Details" modal so the customer can confirm order
// type, name, phone, and (for delivery) their address before we build the
// WhatsApp message. Pre-fills fields from their last order, if any.
function checkoutViaWhatsApp() {
    if (cart.length === 0) return;

    const overlay = document.getElementById('checkout-details-overlay');
    if (!overlay) return;

    const savedType = localStorage.getItem('orderType') || 'Delivery';
    document.getElementById('cd-name').value = localStorage.getItem('customerName') || '';
    document.getElementById('cd-phone').value = localStorage.getItem('customerPhone') || '';
    document.getElementById('cd-address').value = localStorage.getItem('customerAddress') || '';
    document.getElementById('cd-vehicle').value = localStorage.getItem('customerVehicle') || '';
    document.getElementById('cd-plate').value = localStorage.getItem('customerPlate') || '';
    document.getElementById('cd-table').value = localStorage.getItem('customerTable') || '';
    document.getElementById('cd-error').style.display = 'none';
    document.getElementById('cd-location-status').textContent = '';
    document.getElementById('cd-location-status').className = 'cd-location-status';

    selectOrderType(savedType);
    overlay.classList.add('active');
}

function closeCheckoutDetails() {
    const overlay = document.getElementById('checkout-details-overlay');
    if (overlay) overlay.classList.remove('active');
}

// Highlights the chosen order type and shows/hides the fields that only
// apply to that type - a drop-off address for Delivery, vehicle + plate
// number for Car Hop (so the waiter can spot the car in the lot), and a
// table number for Dine-In.
function selectOrderType(type) {
    document.querySelectorAll('.order-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.orderType === type);
    });
    const addressGroup = document.getElementById('cd-address-group');
    if (addressGroup) addressGroup.style.display = (type === 'Delivery') ? 'block' : 'none';

    const carhopGroup = document.getElementById('cd-carhop-group');
    if (carhopGroup) carhopGroup.style.display = (type === 'Car hop') ? 'block' : 'none';

    const tableGroup = document.getElementById('cd-table-group');
    if (tableGroup) tableGroup.style.display = (type === 'Dine-In') ? 'block' : 'none';
}

function getSelectedOrderType() {
    const activeBtn = document.querySelector('.order-type-btn.active');
    return activeBtn ? activeBtn.dataset.orderType : 'Delivery';
}

// Uses the browser's geolocation API to grab the customer's exact
// coordinates and appends a Google Maps link to the address field, so the
// delivery rider can navigate straight to the pin instead of relying on a
// written description alone.
function useCurrentLocation() {
    const status = document.getElementById('cd-location-status');
    const addressField = document.getElementById('cd-address');

    if (!navigator.geolocation) {
        status.textContent = 'Location sharing is not supported on this browser.';
        status.className = 'cd-location-status err';
        return;
    }

    status.textContent = 'Getting your location…';
    status.className = 'cd-location-status';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
            // Strip any previously-attached map link before adding the new one.
            const existing = addressField.value.replace(/\s*Pin location: https:\/\/maps\.google\.com\/\?q=[^\s]+/, '').trim();
            addressField.value = existing ? `${existing}\nPin location: ${mapsLink}` : `Pin location: ${mapsLink}`;
            status.textContent = 'Location added ✓ — you can still add landmark details above.';
            status.className = 'cd-location-status ok';
        },
        (err) => {
            let msg = 'Could not get your location. Please type your address instead.';
            if (err.code === err.PERMISSION_DENIED) msg = 'Location access denied. Please type your address instead.';
            status.textContent = msg;
            status.className = 'cd-location-status err';
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// Validates the details form, saves it for next time, then hands off to
// the WhatsApp message builder.
function confirmCheckoutDetails() {
    const errorEl = document.getElementById('cd-error');
    const name = document.getElementById('cd-name').value.trim();
    const phone = document.getElementById('cd-phone').value.trim();
    const address = document.getElementById('cd-address').value.trim();
    const vehicle = document.getElementById('cd-vehicle').value.trim();
    const plate = document.getElementById('cd-plate').value.trim();
    const table = document.getElementById('cd-table').value.trim();
    const orderType = getSelectedOrderType();

    if (!name) return showCdError('Please enter your full name.');
    if (!phone || phone.replace(/\D/g, '').length < 10) {
        return showCdError('Please enter a valid phone number so the rider can reach you.');
    }
    if (orderType === 'Delivery' && !address) {
        return showCdError('Please enter your delivery address, or share your current location.');
    }
    if (orderType === 'Car hop') {
        if (!vehicle) return showCdError('Please enter your vehicle details (make, model, color).');
        if (!plate) return showCdError('Please enter your number plate so the waiter can find your car.');
    }
    if (orderType === 'Dine-In' && !table) {
        return showCdError('Please enter your table number.');
    }

    errorEl.style.display = 'none';

    localStorage.setItem('customerName', name);
    localStorage.setItem('customerPhone', phone);
    localStorage.setItem('customerAddress', address);
    localStorage.setItem('customerVehicle', vehicle);
    localStorage.setItem('customerPlate', plate);
    localStorage.setItem('customerTable', table);
    localStorage.setItem('orderType', orderType);

    closeCheckoutDetails();
    sendOrderToWhatsApp({ name, phone, address, vehicle, plate, table, orderType });
}

function showCdError(message) {
    const errorEl = document.getElementById('cd-error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

// Asks /api/order-number for the next sequential order number (00001,
// 00002, ...), shared across every customer via Vercel Blob. Falls back to
// a device-local counter (kept in localStorage) if the API is unreachable,
// so checkout never blocks on it - just loses the cross-device guarantee
// for that one order.
async function getNextOrderNumber() {
    try {
        const response = await fetch('/api/order-number', { method: 'POST', cache: 'no-store' });
        if (!response.ok) throw new Error(`status ${response.status}`);
        const data = await response.json();
        if (data && data.orderNumber) return data.orderNumber;
        throw new Error('no orderNumber in response');
    } catch (err) {
        console.error('Falling back to local order numbering.', err);
        const next = parseInt(localStorage.getItem('localOrderCounter') || '1', 10);
        localStorage.setItem('localOrderCounter', String(next + 1));
        return String(next).padStart(5, '0');
    }
}

// Builds an itemized order summary (including the customer's name, phone,
// order number, order type, and any type-specific details - delivery
// address, car-hop vehicle/plate, or dine-in table number) and opens a
// WhatsApp chat to the restaurant's number with the message pre-filled.
async function sendOrderToWhatsApp({ name, phone, address, vehicle, plate, table, orderType }) {
    if (cart.length === 0) return;

    // Open the tab synchronously, before the `await` below, so it's still
    // tied to the user's click and browsers don't treat it as a blocked
    // pop-up. Its URL is filled in once the order number is ready.
    const whatsappTab = window.open('', '_blank');

    const orderNumber = await getNextOrderNumber();

    let subtotal = 0;
    const lines = cart.map((item, index) => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        const variant = item.variantLabel ? ` (${item.variantLabel})` : '';
        const note = item.instructions ? `\n   Note: ${item.instructions}` : '';
        return `${index + 1}. *${item.name}${variant}*\n   ${item.qty} x Rs. ${item.price} = *Rs. ${lineTotal}*${note}`;
    }).join('\n\n');

    const ready = getReadyTimeText(orderType);
    const readyPlain = ready.text.replace(/<[^>]*>/g, '');

    let detailLines = '';
    if (orderType === 'Delivery' && address) {
        detailLines = `*Delivery Address:*\n${address}\n`;
    } else if (orderType === 'Car hop') {
        detailLines = `*Vehicle:* ${vehicle}\n*Number Plate:* ${plate}\n`;
    } else if (orderType === 'Dine-In') {
        detailLines = `*Table Number:* ${table}\n`;
    }

    const placedAt = new Date().toLocaleString('en-PK', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const message =
`*NEW ORDER - DOMINO FAZILPUR*
--------------------------------
*Order #:* ${orderNumber}
*Date & Time:* ${placedAt}

*CUSTOMER DETAILS*
*Name:* ${name}
*Phone:* ${phone}
*Order Type:* ${orderType}
${detailLines}
*ORDER ITEMS*
${lines}

--------------------------------
*TOTAL AMOUNT: Rs. ${subtotal}*

*Estimated Time:* ${readyPlain}

Please confirm this order. Thank you!`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    if (whatsappTab) {
        whatsappTab.location.href = url;
    } else {
        // Pop-up was blocked despite the synchronous open() call - fall
        // back to a normal navigation attempt.
        window.open(url, '_blank');
    }
}
