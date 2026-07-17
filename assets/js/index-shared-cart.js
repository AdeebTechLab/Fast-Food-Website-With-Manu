(function () {
  'use strict';
  const oldButton = document.getElementById('floatingCart');
  if (!oldButton) return;

  // Remove the legacy home-cart listeners and use the menu's shared cart.
  const button = oldButton.cloneNode(true);
  oldButton.replaceWith(button);
  const badge = button.querySelector('#cartBadge');
  const key = 'dominoFazilpurCart';

  // The home page previously shipped its own product modal, cart drawer and
  // checkout modal. They are no longer used and could remain visible behind
  // the new shared button, so remove them after the legacy script initializes.
  ['productModal', 'cartSidebar', 'checkoutModal'].forEach((id) => {
    document.getElementById(id)?.remove();
  });

  function updateBadge() {
    let count = 0;
    try {
      const cart = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(cart)) {
        count = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      }
    } catch {
      count = 0;
    }
    if (badge) badge.textContent = count;
  }

  button.addEventListener('click', () => {
    window.location.href = 'menu.html?openCart=1';
  });
  window.addEventListener('storage', updateBadge);
  window.addEventListener('pageshow', updateBadge);
  updateBadge();
})();
