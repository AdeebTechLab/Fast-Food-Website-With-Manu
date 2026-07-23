(function () {
  'use strict';
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function updateButton() {
    const dark = currentTheme() === 'dark';
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
    button.setAttribute('aria-pressed', String(dark));
  }

  button.addEventListener('click', function () {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('dominoFazilpurTheme', next);
    updateButton();
  });

  updateButton();
})();
