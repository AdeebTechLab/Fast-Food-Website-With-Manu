/**
 * Checkout Page - Order type selection and WhatsApp redirect
 */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const CART_KEY = "fastFoodCart";
  const WHATSAPP_NUMBER = "923333103031";

  const orderTypeBtns = document.querySelectorAll(".order-type-btn");
  const tableNumberGroup = document.getElementById("tableNumberGroup");
  const addressGroup = document.getElementById("addressGroup");
  const continueToWhatsApp = document.getElementById("continueToWhatsApp");

  let selectedOrderType = "Dine-In";

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

  // Redirect to cart if empty
  function checkCart() {
    const cart = loadCart();
    if (cart.length === 0) {
      window.location.href = "cart.html";
    }
  }

  // Order type selection
  orderTypeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      orderTypeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedOrderType = btn.getAttribute("data-type");

      // Show/hide table number or address
      if (tableNumberGroup) {
        tableNumberGroup.style.display =
          selectedOrderType === "Dine-In" || selectedOrderType === "Car Hop"
            ? "block"
            : "none";
      }
      if (addressGroup) {
        addressGroup.style.display =
          selectedOrderType === "Delivery" ? "block" : "none";
      }
    });
  });

  // Continue to WhatsApp
  if (continueToWhatsApp) {
    continueToWhatsApp.addEventListener("click", () => {
      const name = document.getElementById("checkoutName")?.value.trim();
      const phone = document.getElementById("checkoutPhone")?.value.trim();
      const table = document.getElementById("checkoutTable")?.value.trim();
      const address = document.getElementById("checkoutAddress")?.value.trim();

      if (!name || !phone) {
        alert("Please enter your Full Name and Phone Number.");
        return;
      }

      const cart = loadCart();
      if (cart.length === 0) {
        alert("Your cart is empty!");
        window.location.href = "cart.html";
        return;
      }

      let text = `Hello! I would like to place an order.\n\n`;
      text += `*Order Type:* ${selectedOrderType}\n`;
      text += `*Name:* ${name}\n`;
      text += `*Phone:* ${phone}\n`;

      if (
        (selectedOrderType === "Dine-In" || selectedOrderType === "Car Hop") &&
        table
      ) {
        text += `*Table No:* ${table}\n`;
      }
      if (selectedOrderType === "Delivery" && address) {
        text += `*Address:* ${address}\n`;
      }

      text += `\n*--- Order Items ---*\n`;

      let grandTotal = 0;
      cart.forEach((cItem, i) => {
        text += `${i + 1}. ${cItem.item.name} ${cItem.variantLabel ? `(${cItem.variantLabel})` : ""} x${cItem.quantity || 1} - Rs. ${cItem.totalPrice.toFixed(2)}\n`;
        cItem.addons.forEach((a) => {
          text += `   + ${a.label}\n`;
        });
        grandTotal += cItem.totalPrice;
      });

      const tax = grandTotal * 0.15;
      const finalTotal = grandTotal + tax;
      text += `\nSubtotal: Rs. ${grandTotal.toFixed(2)}\n`;
      text += `Tax (15%): Rs. ${tax.toFixed(2)}\n`;
      text += `*Grand Total: Rs. ${finalTotal.toFixed(2)}*`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, "_blank");

      // Clear cart after sending
      localStorage.removeItem(CART_KEY);

      // Redirect to home after a short delay
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    });
  }

  // Initialize
  checkCart();
});
