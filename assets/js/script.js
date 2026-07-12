/**
 * Fast Food Restaurant - Premium Modern Design
 * JavaScript for interactivity and animations
 */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // DOM Elements
  const header = document.querySelector("header");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("nav");
  const menuTabs = document.querySelectorAll(".menu-tab");
  const menuContents = document.querySelectorAll(".menu-content");
  const navLinks = document.querySelectorAll("nav ul li a");
  const sections = document.querySelectorAll("section[id]");

  renderMenuFromAdminData();
  renderPopularFromAdminData();

  // Initialize active link as soon as the page is interactive.
  highlightActiveSection();

  /**
   * Final check after assets finish loading.
   */
  window.addEventListener("load", function () {
    highlightActiveSection();
  });

  /**
   * Sticky Header on Scroll and Highlight Active Section
   */
  window.addEventListener("scroll", function () {
    // Sticky Header
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    // Highlight Active Section
    highlightActiveSection();
  });

  /**
   * Highlight the active section in the navigation menu
   */
  function highlightActiveSection() {
    // Get current scroll position
    let scrollPosition = window.scrollY;

    // Add small offset to account for header height
    scrollPosition += 100;

    // Loop through all sections to find the one currently visible
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      // Check if we're within the section boundaries
      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        // Remove active class from all nav links
        navLinks.forEach((link) => {
          link.classList.remove("active");
        });

        // Add active class to corresponding nav link
        document
          .querySelector(`nav ul li a[href="#${sectionId}"]`)
          ?.classList.add("active");
      }
    });
  }

  function renderMenuFromAdminData() {
    if (!window.MenuStore) return;

    const categories = window.MenuStore.readCategories
      ? window.MenuStore.readCategories()
      : window.MenuStore.defaultCategories || [];
    const items = window.MenuStore.readItems();
    const menuCategoriesContainer = document.querySelector(".menu-categories");
    const menuTabsContainer = document.querySelector(".menu-tabs");

    if (menuCategoriesContainer) {
      const hotDealItems = items.filter((item) => item.popular);
      const hotDealsSection = hotDealItems.length
        ? createMenuCategorySection(
            { id: "hot-deals-menu", label: "Hot Deals" },
            hotDealItems,
            true
          )
        : "";
      const categorySections = categories.length
        ? categories.map((category) => createMenuCategorySection(category, items)).join("")
        : '<p class="menu-empty">No menu categories yet.</p>';

      menuCategoriesContainer.innerHTML = hotDealsSection + categorySections;
      return;
    }

    if (!menuTabsContainer) return;

    menuTabsContainer.innerHTML = categories
      .map(
        (category, index) =>
          `<button class="menu-tab${index === 0 ? " active" : ""}" data-target="${escapeAttribute(
            category.id
          )}">${escapeHtml(category.label)}</button>`
      )
      .join("");

    document.querySelectorAll(".menu-content").forEach((content) => content.remove());

    const menuContainer = menuTabsContainer.parentElement;
    categories.forEach((category, index) => {
      const container = document.createElement("div");
      container.className = "menu-content";
      container.id = category.id;
      if (index > 0) container.style.display = "none";

      const categoryItems = items.filter((item) => item.category === category.id);
      container.innerHTML = categoryItems.length
        ? categoryItems.map(createMenuItemMarkup).join("")
        : '<p class="menu-empty">No items in this category yet.</p>';

      menuContainer.appendChild(container);
    });
  }

  function createMenuCategorySection(category, items, useProvidedItems) {
    const categoryItems = useProvidedItems
      ? items
      : items.filter((item) => item.category === category.id);
    const itemsMarkup = categoryItems.length
      ? categoryItems.map(createMenuItemMarkup).join("")
      : '<p class="menu-empty">No items in this category yet.</p>';

    return `
      <section class="menu-category-block" id="${escapeAttribute(category.id)}">
        <div class="menu-category-heading">
          <h3>${escapeHtml(category.label)}</h3>
          <span>${categoryItems.length} item${categoryItems.length === 1 ? "" : "s"}</span>
        </div>
        <div class="menu-content menu-category-items">${itemsMarkup}</div>
      </section>
    `;
  }
  function createMenuItemMarkup(item) {
    return `
      <div class="menu-item animate-on-scroll">
        <div class="menu-item-img">
          <img loading="lazy" decoding="async" src="${escapeAttribute(
            item.image
          )}" alt="${escapeAttribute(item.name)}" />
        </div>
        <div class="menu-item-content">
          <div class="menu-item-title">
            <h4>${escapeHtml(item.name)}</h4>
            <div class="menu-item-price">${escapeHtml(item.price)}</div>
          </div>
          <p class="menu-item-text">${escapeHtml(item.description)}</p>
          <div class="menu-item-order">
            <div class="menu-item-rating">${createRatingMarkup(item.rating)}</div>
            <button type="button" class="btn open-modal-btn" data-id="${item.id}">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  }


  function renderPopularFromAdminData() {
    if (!window.MenuStore) return;

    const popularContainer = document.querySelector(".dishes-container");
    if (!popularContainer) return;

    const popularItems = window.MenuStore
      .readItems()
      .filter((item) => item.popular)
      .slice(0, 6);

    popularContainer.innerHTML = popularItems.length
      ? popularItems.map(createPopularDishMarkup).join("")
      : '<p class="menu-empty">No popular items selected yet.</p>';
  }

  function createPopularDishMarkup(item) {
    return `
      <div class="dish-card animate-on-scroll hot-deal-link" onclick="window.location.href='menu.html'" onkeydown="if(event.key==='Enter'||event.key===' ') window.location.href='menu.html'" role="link" tabindex="0">
        <div class="dish-image">
          <img loading="lazy" decoding="async" src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.name)}" />
          <div class="dish-badge">Popular</div>
        </div>
        <div class="dish-content">
          <h3>${escapeHtml(item.name)}</h3>
          <div class="dish-rating">
            ${createRatingMarkup(item.rating)}
            <span>(${Number(item.rating) || 0})</span>
          </div>
          <p>${escapeHtml(item.description)}</p>
          <div class="dish-footer">
            <div class="dish-price">${escapeHtml(item.price)}</div>
            <button type="button" class="btn open-modal-btn" data-id="${item.id}">Order Now</button>
          </div>
        </div>
      </div>
    `;
  }
  function createRatingMarkup(rating) {
    const numericRating = Number(rating) || 0;
    let stars = "";

    for (let index = 1; index <= 5; index += 1) {
      if (numericRating >= index) {
        stars += '<i class="fas fa-star"></i>';
      } else if (numericRating >= index - 0.5) {
        stars += '<i class="fas fa-star-half-alt"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }

    return stars;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[character];
    });
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  /**
   * Mobile Navigation Toggle
   */
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      navToggle.classList.toggle("active");
      nav.classList.toggle("active");
    });
  }

  /**
   * Close mobile nav when clicking on a nav link
   */
  document.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.classList.remove("active");
      nav.classList.remove("active");
    });
  });

  /**
   * Menu Tabs
   */
  const menuTabsContainer = document.querySelector(".menu-tabs");
  if (menuTabsContainer) {
    menuTabsContainer.addEventListener("click", (event) => {
      const tab = event.target.closest(".menu-tab");
      if (!tab) return;

      document.querySelectorAll(".menu-tab").forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".menu-content").forEach((content) => {
        content.style.display = "none";
      });

      const target = tab.getAttribute("data-target");
      const targetElement = document.getElementById(target);
      if (targetElement) targetElement.style.display = "grid";
    });
  }
  /**
   * Scroll to section when clicking on nav links
   */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });

        // Update active class on the clicked link
        navLinks.forEach((link) => {
          link.classList.remove("active");
        });
        this.classList.add("active");
      }
    });
  });

  /**
   * Animate elements when they come into view
   */
  const animateOnScroll = function () {
    const animatedElements = document.querySelectorAll(".animate-on-scroll");

    animatedElements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (elementPosition < windowHeight - 100) {
        element.classList.add("animated");
      }
    });
  };

  // Run animation check on load and scroll
  window.addEventListener("load", animateOnScroll);
  window.addEventListener("scroll", animateOnScroll);

  /**
   * Form Validation
   */
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Basic form validation
      let valid = true;
      const requiredFields = contactForm.querySelectorAll("[required]");

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          valid = false;
          field.classList.add("error");
        } else {
          field.classList.remove("error");
        }

        // Email validation
        if (field.type === "email" && field.value.trim()) {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(field.value)) {
            valid = false;
            field.classList.add("error");
          }
        }
      });

      if (valid) {
        // Show success message (in real app you'd submit the form)
        const successMessage = document.createElement("div");
        successMessage.className = "form-success";
        successMessage.textContent =
          "Thank you for your message! We will get back to you soon.";

        contactForm.innerHTML = "";
        contactForm.appendChild(successMessage);
      }
    });
  }


  const whatsappFeedbackForm = document.getElementById("whatsappFeedbackForm");
  if (whatsappFeedbackForm) {
    whatsappFeedbackForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const name = document.getElementById("fullName")?.value.trim() || "";
      const phone = document.getElementById("phone")?.value.trim() || "";
      const address = document.getElementById("address")?.value.trim() || "";
      const message = document.getElementById("orderNotes")?.value.trim() || "";
      const whatsappNumber = "923333103031";
      const text = [
        "New feedback from website:",
        `Name: ${name}`,
        `Phone: ${phone}`,
        address ? `Address: ${address}` : "",
        `Message: ${message}`,
      ]
        .filter(Boolean)
        .join("\n");

      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank");
    });
  }
  /**
   * Add animation classes to elements
   */ function setupAnimations() {
    // Add animation classes to section titles
    document.querySelectorAll(".section-title").forEach((title) => {
      title.classList.add("animate-on-scroll");
    });

    // Add animation classes to menu items
    document.querySelectorAll(".menu-item").forEach((item, index) => {
      item.classList.add("animate-on-scroll");
      item.style.animationDelay = `${index * 0.1}s`;
    });

    // Add animation to about section
    const aboutImage = document.querySelector(".about-image");
    const aboutText = document.querySelector(".about-text");

    if (aboutImage) aboutImage.classList.add("animate-on-scroll");
    if (aboutText) aboutText.classList.add("animate-on-scroll");

    // Add animation to testimonials CTA
    const testimonialsCta = document.querySelector(".testimonials-cta");
    if (testimonialsCta) testimonialsCta.classList.add("animate-on-scroll");
  }

  setupAnimations();
  /**
   * Create back to top button
   */
  function createBackToTopButton() {
    const backToTopBtn = document.createElement("button");
    backToTopBtn.className = "back-to-top";
    backToTopBtn.setAttribute("aria-label", "Back to top");
    backToTopBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(backToTopBtn);

    // Show/hide button with a throttled scroll listener for better performance
    let scrollTimeout;
    window.addEventListener("scroll", () => {
      if (scrollTimeout) return;

      scrollTimeout = setTimeout(() => {
        if (window.scrollY > 500) {
          // Reduced threshold for earlier appearance
          backToTopBtn.classList.add("show");
        } else {
          backToTopBtn.classList.remove("show");
        }
        scrollTimeout = null;
      }, 100);
    });

    // Smooth scroll with easing
    backToTopBtn.addEventListener("click", () => {
      // Add a pulse effect on click
      backToTopBtn.classList.add("pulse");
      setTimeout(() => backToTopBtn.classList.remove("pulse"), 300);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  createBackToTopButton();
  // --- CART & MODAL LOGIC ---
  const CART_KEY = 'fastFoodCart';

  function loadCartFromStorage() {
    const saved = localStorage.getItem(CART_KEY);
    if (!saved) return [];
    try { return JSON.parse(saved); } catch (e) { return []; }
  }

  function saveCartToStorage(cartData) {
    localStorage.setItem(CART_KEY, JSON.stringify(cartData));
  }

  const cart = loadCartFromStorage();

  const floatingCart = document.getElementById("floatingCart");
  const cartSidebar = document.getElementById("cartSidebar");
  const closeCart = document.getElementById("closeCart");
  const cartItemsList = document.getElementById("cartItemsList");
  const cartTotalValue = document.getElementById("cartTotalValue");
  const cartBadge = document.getElementById("cartBadge");

  // Initialize badge with saved cart count
  if (cartBadge) cartBadge.textContent = cart.length;

  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartTax = document.getElementById("cartTax");
  const cartGrandTotal = document.getElementById("cartGrandTotal");
  const cartPopularList = document.getElementById("cartPopularList");
  const checkoutTime = document.getElementById("checkoutTime");
  
  const productModal = document.getElementById("productModal");
  const closeModal = document.getElementById("closeModal");
  const confirmAddToCartBtn = document.getElementById("confirmAddToCartBtn");
  
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalBasePrice = document.getElementById("modalBasePrice");
  const variantsContainer = document.getElementById("variantsContainer");
  const variantsOptions = document.getElementById("variantsOptions");
  const addonsContainer = document.getElementById("addonsContainer");
  const addonsOptions = document.getElementById("addonsOptions");
  const modalTotalPrice = document.getElementById("modalTotalPrice");
  const modalQty = document.getElementById("modalQty");
  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");

  let currentItem = null;
  let selectedVariantPrice = 0;
  let selectedVariantLabel = "";
  let currentQty = 1;

  function parsePrice(str) {
    if(!str) return 0;
    return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
  }

  function updateModalPrice() {
    let total = selectedVariantPrice;
    const checkboxes = addonsOptions.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
      total += parseFloat(cb.dataset.price);
    });
    total = total * currentQty;
    modalTotalPrice.textContent = "Rs. " + total.toFixed(2);
  }

  // Open Modal
  document.body.addEventListener('click', function(e) {
    if(e.target.classList.contains('open-modal-btn')) {
      const id = e.target.getAttribute('data-id');
      const items = window.MenuStore.readItems();
      currentItem = items.find(i => i.id === id);
      if(!currentItem) return;

      modalImg.src = currentItem.image;
      modalTitle.textContent = currentItem.name;
      modalBasePrice.textContent = currentItem.price;
      
      const basePriceNum = parsePrice(currentItem.price);
      currentQty = 1;
      if (modalQty) modalQty.textContent = "1";

      // Render variants
      if (currentItem.variants && currentItem.variants.length > 0) {
        variantsContainer.style.display = "block";
        selectedVariantPrice = parsePrice(currentItem.variants[0].price);
        selectedVariantLabel = currentItem.variants[0].label;
        variantsOptions.innerHTML = currentItem.variants.map((v, idx) => `
          <label class="variant-option">
            <span><input type="radio" name="variant" value="${idx}" ${idx===0?'checked':''}> ${escapeHtml(v.label)}</span>
            <span>Rs. ${parsePrice(v.price).toFixed(2)}</span>
          </label>
        `).join('');
      } else {
        variantsContainer.style.display = "none";
        selectedVariantPrice = basePriceNum;
        selectedVariantLabel = "";
      }

      // Render addons
      if (currentItem.addons && currentItem.addons.length > 0) {
        addonsContainer.style.display = "block";
        addonsOptions.innerHTML = currentItem.addons.map((a, idx) => `
          <label class="addon-option">
            <span><input type="checkbox" class="addon-checkbox" value="${idx}" data-price="${parsePrice(a.price)}"> ${escapeHtml(a.label)}</span>
            <span>+ Rs. ${parsePrice(a.price).toFixed(2)}</span>
          </label>
        `).join('');
      } else {
        addonsContainer.style.display = "none";
      }

      updateModalPrice();
      productModal.classList.add('active');
    }
  });

  // Handle option changes
  variantsOptions.addEventListener('change', function(e) {
    if(e.target.name === 'variant') {
      const v = currentItem.variants[e.target.value];
      selectedVariantPrice = parsePrice(v.price);
      selectedVariantLabel = v.label;
      updateModalPrice();
    }
  });
  addonsOptions.addEventListener('change', function(e) {
    if(e.target.classList.contains('addon-checkbox')) {
      updateModalPrice();
    }
  });


  if (qtyMinus) qtyMinus.addEventListener('click', () => {
    if(currentQty > 1) { currentQty--; modalQty.textContent = currentQty; updateModalPrice(); }
  });
  if (qtyPlus) qtyPlus.addEventListener('click', () => {
    currentQty++; modalQty.textContent = currentQty; updateModalPrice();
  });

  // Close Modal
  closeModal.addEventListener('click', () => productModal.classList.remove('active'));
  productModal.addEventListener('click', (e) => { if(e.target === productModal) productModal.classList.remove('active'); });

  // Add to Cart
  confirmAddToCartBtn.addEventListener('click', () => {
    const selectedAddons = [];
    addonsOptions.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      const a = currentItem.addons[cb.value];
      selectedAddons.push({ label: a.label, price: parsePrice(a.price) });
    });

    let total = selectedVariantPrice;
    selectedAddons.forEach(a => total += a.price);
    total = total * currentQty;

    cart.push({
      item: currentItem,
      variantLabel: selectedVariantLabel,
      variantPrice: selectedVariantPrice,
      addons: selectedAddons,
      quantity: currentQty,
      totalPrice: total
    });

    saveCartToStorage(cart);
    productModal.classList.remove('active');
    updateCartUI();
  });

  // Cart UI
  floatingCart.addEventListener('click', () => {
    updateCartUI();
    cartBadge.textContent = cart.length;
    cartSidebar.classList.add('active');
  });
  closeCart.addEventListener('click', () => cartSidebar.classList.remove('active'));

  function updateCartUI() {
    cartBadge.textContent = cart.length;
    let subtotal = 0;
    
    if (cart.length === 0) {
      cartItemsList.innerHTML = '<p style="text-align:center; padding: 20px; color:#777;">Your cart is empty.</p>';
    } else {
      cartItemsList.innerHTML = cart.map((cItem, index) => {
        subtotal += cItem.totalPrice;
        let addonsHtml = cItem.addons.map(a => `<div>+ ${a.label} (Rs. ${a.price.toFixed(2)})</div>`).join('');
        return `
          <div class="cart-item-card">
            <img class="cart-item-img" src="${cItem.item.image}" alt="${escapeHtml(cItem.item.name)}">
            <div class="cart-item-info">
              <div class="cart-item-title">${escapeHtml(cItem.item.name)} ${cItem.variantLabel ? `(${cItem.variantLabel})` : ''}</div>
              <div class="cart-item-extras" style="font-size: 0.9rem; color: #777;">${addonsHtml}</div>
              <div class="cart-qty-ctrl">
                <button type="button" onclick="window.updateCartQty(${index}, -1)">-</button>
                <span>${cItem.quantity || 1}</span>
                <button type="button" onclick="window.updateCartQty(${index}, 1)">+</button>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
              <div class="cart-item-price">Rs. ${cItem.totalPrice.toFixed(2)}</div>
            </div>
          </div>
        `;
      }).join('');
    }
    
    let tax = subtotal * 0.15;
    let grandTotal = subtotal + tax;

    if (cartTotalValue) cartTotalValue.textContent = "Rs. " + grandTotal.toFixed(2);
    if (cartSubtotal) cartSubtotal.textContent = "Rs. " + subtotal.toFixed(2);
    if (cartTax) cartTax.textContent = "Rs. " + tax.toFixed(2);
    if (cartGrandTotal) cartGrandTotal.textContent = "Rs. " + grandTotal.toFixed(2);
  }

  window.updateCartQty = function(index, delta) {
    const cItem = cart[index];
    let newQty = (cItem.quantity || 1) + delta;
    if (newQty <= 0) {
      window.removeFromCart(index);
      return;
    }
    // calculate unit price
    let unitPrice = cItem.totalPrice / cItem.quantity;
    cItem.quantity = newQty;
    cItem.totalPrice = unitPrice * newQty;
    saveCartToStorage(cart);
    updateCartUI();
  };

  // Render Popular Items in Cart
  function renderCartPopular() {
    if (!cartPopularList) return;
    const items = window.MenuStore.readItems();
    const populars = items.filter(i => i.popular).slice(0, 4);
    if (populars.length === 0) return;

    cartPopularList.innerHTML = populars.map(item => `
      <div class="popular-card">
        <img src="${item.image}" alt="${escapeHtml(item.name)}">
        <div class="popular-card-title">${escapeHtml(item.name)}</div>
        <div class="popular-card-price">From Rs. ${parseFloat(item.price).toFixed(2) || 0}</div>
        <button class="popular-add-btn" onclick="document.getElementById('cartSidebar').classList.remove('active'); document.querySelector('.open-modal-btn[data-id=\'${item.id}\']')?.click()"><i class="fa-solid fa-plus"></i></button>
      </div>
    `).join('');
  }
  
  // Format checkout time
  function updateCheckoutTime() {
    if (!checkoutTime) return;
    const date = new Date();
    date.setMinutes(date.getMinutes() + 45);
    const optionsDate = { month: 'long', day: 'numeric', year: 'numeric' };
    const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };
    checkoutTime.textContent = `${date.toLocaleDateString('en-US', optionsDate)} at ${date.toLocaleTimeString('en-US', optionsTime)}`;
  }
  
  // Call once when script loads
  setTimeout(() => {
    renderCartPopular();
    updateCheckoutTime();
  }, 500);

  // Update time when cart opens
  floatingCart.addEventListener('click', () => {
    updateCheckoutTime();
  });


  window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCartToStorage(cart);
    updateCartUI();
  };

  // ---- CHECKOUT MODAL LOGIC ----
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutModal = document.getElementById('closeCheckoutModal');
  const continueToWhatsApp = document.getElementById('continueToWhatsApp');
  const tableNumberGroup = document.getElementById('tableNumberGroup');
  const addressGroup = document.getElementById('addressGroup');
  let selectedOrderType = 'Delivery';

  // Open Checkout Modal
  checkoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    cartSidebar.classList.remove('active');
    if (checkoutModal) checkoutModal.classList.add('active');
  });

  // Close modal
  if (closeCheckoutModal) closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.remove('active'));
  if (checkoutModal) checkoutModal.addEventListener('click', (e) => { if (e.target === checkoutModal) checkoutModal.classList.remove('active'); });

  // Order type selection
  document.querySelectorAll('.order-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedOrderType = btn.getAttribute('data-type');
      if (tableNumberGroup) tableNumberGroup.style.display = selectedOrderType === 'Dine-In' || selectedOrderType === 'Car Hop' ? 'block' : 'none';
      if (addressGroup) addressGroup.style.display = selectedOrderType === 'Delivery' ? 'block' : 'none';
    });
  });

  // Continue to WhatsApp
  if (continueToWhatsApp) continueToWhatsApp.addEventListener('click', () => {
    const name = document.getElementById('checkoutName')?.value.trim();
    const phone = document.getElementById('checkoutPhone')?.value.trim();
    const table = document.getElementById('checkoutTable')?.value.trim();
    const address = document.getElementById('checkoutAddress')?.value.trim();

    if (!name || !phone) {
      alert('Please enter your Full Name and Phone Number.');
      return;
    }

    let text = `Hello! I would like to place an order.\n\n`;
    text += `*Order Type:* ${selectedOrderType}\n`;
    text += `*Name:* ${name}\n`;
    text += `*Phone:* ${phone}\n`;
    if ((selectedOrderType === 'Dine-In' || selectedOrderType === 'Car Hop') && table) text += `*Table No:* ${table}\n`;
    if (selectedOrderType === 'Delivery' && address) text += `*Address:* ${address}\n`;
    text += `\n*--- Order Items ---*\n`;

    let grandTotal = 0;
    cart.forEach((cItem, i) => {
      text += `${i+1}. ${cItem.item.name} ${cItem.variantLabel ? `(${cItem.variantLabel})` : ''} x${cItem.quantity || 1} - Rs. ${cItem.totalPrice.toFixed(2)}\n`;
      cItem.addons.forEach(a => { text += `   + ${a.label}\n`; });
      grandTotal += cItem.totalPrice;
    });

    let tax = grandTotal * 0.15;
    let finalTotal = grandTotal + tax;
    text += `\nSubtotal: Rs. ${grandTotal.toFixed(2)}\n`;
    text += `Tax (15%): Rs. ${tax.toFixed(2)}\n`;
    text += `*Grand Total: Rs. ${finalTotal.toFixed(2)}*`;

    const whatsappNumber = '923333103031';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    checkoutModal.classList.remove('active');

    // Clear cart
    cart.length = 0;
    saveCartToStorage(cart);
    updateCartUI();
  });

});
