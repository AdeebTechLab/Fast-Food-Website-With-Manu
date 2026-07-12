/**
 * Cart Page - Standalone cart page with full cart functionality
 */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const CART_KEY = "fastFoodCart";
  const cartContainer = document.getElementById("cartItemsContainer");
  const popularContainer = document.getElementById("popularItemsContainer");
  const summaryTotal = document.getElementById("summaryTotal");
  const summaryTax = document.getElementById("summaryTax");
  const summaryGrandTotal = document.getElementById("summaryGrandTotal");
  const deliveryDate = document.getElementById("deliveryDate");

  // Load cart from localStorage
  function loadCart() {
    const saved = localStorage.getItem(CART_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }

  // Save cart to localStorage
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // Parse price from string
  function parsePrice(str) {
    if (!str) return 0;
    return parseFloat(String(str).replace(/[^0-9.]/g, "")) || 0;
  }

  // Escape HTML
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

  // Set delivery date
  function setDeliveryDate() {
    if (!deliveryDate) return;
    const date = new Date();
    date.setMinutes(date.getMinutes() + 15);
    const options = { month: "long", day: "numeric", year: "numeric" };
    deliveryDate.textContent = date.toLocaleDateString("en-US", options);
  }

  // Render cart items
  function renderCart() {
    const cart = loadCart();

    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-cart">
          <i class="fa-solid fa-cart-shopping"></i>
          <p>Your cart is empty</p>
          <a href="menu.html" class="btn">Browse Menu</a>
        </div>
      `;
      updateSummary([]);
      return;
    }

    cartContainer.innerHTML = cart
      .map((cItem, index) => {
        const addonsHtml = cItem.addons
          .map((a) => `<div class="cart-item-addons">+ ${escapeHtml(a.label)} (Rs. ${a.price.toFixed(2)})</div>`)
          .join("");

        return `
        <div class="cart-item-card">
          <img class="cart-item-img" src="${escapeHtml(cItem.item.image)}" alt="${escapeHtml(cItem.item.name)}">
          <div class="cart-item-info">
            <div class="cart-item-title">${escapeHtml(cItem.item.name)} ${cItem.variantLabel ? `(${escapeHtml(cItem.variantLabel)})` : ""}</div>
            ${addonsHtml}
            <div class="cart-qty-ctrl">
              <button type="button" onclick="updateQty(${index}, -1)">-</button>
              <span>${cItem.quantity || 1}</span>
              <button type="button" onclick="updateQty(${index}, 1)">+</button>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:1rem;">
            <div class="cart-item-price">Rs. ${cItem.totalPrice.toFixed(2)}</div>
            <button class="cart-item-remove" onclick="removeItem(${index})" title="Remove item">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
      })
      .join("");

    updateSummary(cart);
  }

  // Update summary
  function updateSummary(cart) {
    let subtotal = 0;
    cart.forEach((cItem) => {
      subtotal += cItem.totalPrice;
    });

    const tax = subtotal * 0.15;
    const grandTotal = subtotal + tax;

    summaryTotal.textContent = "Rs. " + subtotal.toFixed(2);
    summaryTax.textContent = "Rs. " + tax.toFixed(2);
    summaryGrandTotal.textContent = "Rs. " + grandTotal.toFixed(2);
  }

  // Render popular items
  function renderPopular() {
    if (!window.MenuStore || !popularContainer) return;

    const items = window.MenuStore.readItems();
    const populars = items.filter((i) => i.popular).slice(0, 5);

    if (populars.length === 0) {
      popularContainer.innerHTML = '<p style="color: #888; padding: 1rem;">No popular items available.</p>';
      return;
    }

    popularContainer.innerHTML = populars
      .map(
        (item) => `
      <div class="popular-card">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
        <div class="popular-card-title">${escapeHtml(item.name)}</div>
        <div class="popular-card-price">From Rs. ${parsePrice(item.price).toFixed(0)}</div>
        <button class="popular-add-btn" onclick="addPopularToCart('${escapeHtml(item.id)}')"><i class="fa-solid fa-plus"></i></button>
      </div>
    `
      )
      .join("");
  }

  // Update quantity
  window.updateQty = function (index, delta) {
    const cart = loadCart();
    if (!cart[index]) return;

    let newQty = (cart[index].quantity || 1) + delta;
    if (newQty <= 0) {
      window.removeItem(index);
      return;
    }

    // Calculate unit price
    let unitPrice = cart[index].totalPrice / (cart[index].quantity || 1);
    cart[index].quantity = newQty;
    cart[index].totalPrice = unitPrice * newQty;

    saveCart(cart);
    renderCart();
  };

  // Remove item
  window.removeItem = function (index) {
    const cart = loadCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
  };

  // Add popular item to cart
  window.addPopularToCart = function (itemId) {
    if (!window.MenuStore) return;

    const items = window.MenuStore.readItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const cart = loadCart();
    const basePrice = parsePrice(item.price);

    cart.push({
      item: item,
      variantLabel: "",
      variantPrice: basePrice,
      addons: [],
      quantity: 1,
      totalPrice: basePrice,
    });

    saveCart(cart);
    renderCart();
  };

  // Initialize
  setDeliveryDate();
  renderCart();
  renderPopular();
});
