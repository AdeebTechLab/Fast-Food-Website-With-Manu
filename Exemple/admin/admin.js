(function () {
  'use strict';

  let menuData = [];
  let nextId = 1;

  const authGate = document.getElementById('auth-gate');
  const app = document.getElementById('app');
  const usernameLabel = document.getElementById('username-label');
  const container = document.getElementById('categories-container');
  const addCategoryPositionSelect = document.getElementById('add-category-position');
  const saveBtn = document.getElementById('save-btn');
  const saveStatus = document.getElementById('save-status');
  const banner = document.getElementById('banner');
  const categoryTemplate = document.getElementById('category-template');
  const itemTemplate = document.getElementById('item-template');
  const variantRowTemplate = document.getElementById('variant-row-template');

  function showBanner(message, type) {
    banner.textContent = message;
    banner.className = 'banner ' + type;
    banner.classList.remove('hidden');
  }

  function hideBanner() {
    banner.classList.add('hidden');
  }

  function imageSrc(image) {
    if (!image) return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;
    return '/assets/' + image;
  }

  // --- Auth gate ---
  async function checkSession() {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = '/admin/login.html';
        return;
      }
      usernameLabel.textContent = data.username || '';
      authGate.classList.add('hidden');
      app.classList.remove('hidden');
      await loadMenu();
    } catch (err) {
      authGate.textContent = 'Could not check your session. Please refresh.';
    }
  }

  // --- Load menu data ---
  async function loadMenu() {
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load menu (status ' + res.status + ')');
      menuData = await res.json();
      computeNextId();
      renderAll();
    } catch (err) {
      showBanner('Could not load the menu: ' + err.message, 'error');
    }
  }

  function computeNextId() {
    let max = 0;
    menuData.forEach((cat) => {
      (cat.items || []).forEach((item) => {
        if (typeof item.id === 'number' && item.id > max) max = item.id;
      });
    });
    nextId = max + 1;
  }

  // --- Rendering ---
  function renderAll() {
    container.innerHTML = '';
    menuData.forEach((category, catIndex) => {
      container.appendChild(renderCategory(category, catIndex));
    });
    syncAddCategoryPositionOptions();
  }

  // Keeps the "insert new category..." dropdown in sync with the current
  // category list, so the admin can pick exactly where a new category
  // should land instead of it always landing at the bottom.
  function syncAddCategoryPositionOptions() {
    if (!addCategoryPositionSelect) return;
    const previousValue = addCategoryPositionSelect.value;
    addCategoryPositionSelect.innerHTML = '';

    const beginningOpt = document.createElement('option');
    beginningOpt.value = '0';
    beginningOpt.textContent = 'At the beginning';
    addCategoryPositionSelect.appendChild(beginningOpt);

    menuData.forEach((category, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx + 1);
      opt.textContent = `After "${category.title || category.categoryId || 'Untitled'}"`;
      addCategoryPositionSelect.appendChild(opt);
    });

    // Keep the previous selection if it's still a valid index, otherwise
    // default to inserting at the very end (most common case).
    const maxValue = menuData.length;
    if (previousValue !== '' && Number(previousValue) <= maxValue) {
      addCategoryPositionSelect.value = previousValue;
    } else {
      addCategoryPositionSelect.value = String(maxValue);
    }
  }

  function renderCategory(category, catIndex) {
    const node = categoryTemplate.content.firstElementChild.cloneNode(true);
    const titleInput = node.querySelector('.cat-title-input');
    const idInput = node.querySelector('.cat-id-input');
    const itemsGrid = node.querySelector('.items-grid');
    const addItemBtn = node.querySelector('.add-item-btn');
    const deleteCategoryBtn = node.querySelector('.delete-category-btn');

    titleInput.value = category.title || '';
    idInput.value = category.categoryId || '';

    titleInput.addEventListener('input', () => { category.title = titleInput.value; });
    idInput.addEventListener('input', () => { category.categoryId = idInput.value.trim(); });

    (category.items || []).forEach((item) => {
      itemsGrid.appendChild(renderItem(item, category));
    });

    addItemBtn.addEventListener('click', () => {
      const newItem = {
        id: nextId++,
        name: '',
        description: '',
        price: 0,
        badge: null,
        image: '',
        variants: [],
      };
      category.items.push(newItem);
      itemsGrid.appendChild(renderItem(newItem, category));
    });

    deleteCategoryBtn.addEventListener('click', () => {
      if (!confirm(`Delete category "${category.title || category.categoryId}" and all its items?`)) return;
      const idx = menuData.indexOf(category);
      if (idx !== -1) menuData.splice(idx, 1);
      node.remove();
    });

    return node;
  }

  function renderItem(item, category) {
    const node = itemTemplate.content.firstElementChild.cloneNode(true);
    const img = node.querySelector('.item-photo-img');
    const photoInput = node.querySelector('.photo-input');
    const nameInput = node.querySelector('.item-name-input');
    const descInput = node.querySelector('.item-desc-input');
    const hasVariantsInput = node.querySelector('.item-hasvariants-input');
    const priceRow = node.querySelector('.item-price-row');
    const priceInput = node.querySelector('.item-price-input');
    const badgeInput = node.querySelector('.item-badge-input');
    const variantsSection = node.querySelector('.item-variants-section');
    const variantsList = node.querySelector('.item-variants-list');
    const addVariantBtn = node.querySelector('.add-variant-btn');
    const presetBtns = node.querySelectorAll('.preset-btn');
    const variantsBadgeInput = node.querySelector('.item-badge-input-variants');
    const priceFromLabel = node.querySelector('.pricefrom-label');
    const priceFromInput = node.querySelector('.item-pricefrom-input');
    const discountToggleLabel = node.querySelector('.discount-toggle-label');
    const discountInput = node.querySelector('.item-discount-input');
    const discountRow = node.querySelector('.item-discount-row');
    const oldPriceInput = node.querySelector('.item-oldprice-input');
    const bestDealInput = node.querySelector('.item-bestdeal-input');
    const deleteBtn = node.querySelector('.delete-item-btn');

    img.src = imageSrc(item.image);
    img.alt = item.name || '';
    nameInput.value = item.name || '';
    descInput.value = item.description || '';
    priceInput.value = item.price != null ? item.price : '';
    badgeInput.value = item.badge || '';
    variantsBadgeInput.value = item.badge || '';
    priceFromInput.checked = !!item.priceFrom;
    bestDealInput.checked = !!item.bestDeal;
    discountInput.checked = item.oldPrice != null;
    oldPriceInput.value = item.oldPrice != null ? item.oldPrice : '';
    discountRow.classList.toggle('hidden', !discountInput.checked);

    const itemHasVariants = Array.isArray(item.variants) && item.variants.length > 0;
    hasVariantsInput.checked = itemHasVariants;
    if (!itemHasVariants && !Array.isArray(item.variants)) item.variants = [];

    // --- Toggle between a single price field and the variants list ---
    function syncVariantsVisibility() {
      const on = hasVariantsInput.checked;
      priceRow.classList.toggle('hidden', on);
      priceFromLabel.classList.toggle('hidden', on);
      discountToggleLabel.classList.toggle('hidden', on);
      discountRow.classList.toggle('hidden', on || !discountInput.checked);
      variantsSection.classList.toggle('hidden', !on);
    }
    syncVariantsVisibility();

    function renderVariantRows() {
      variantsList.innerHTML = '';
      item.variants.forEach((variant) => variantsList.appendChild(renderVariantRow(variant)));
    }

    function renderVariantRow(variant) {
      const row = variantRowTemplate.content.firstElementChild.cloneNode(true);
      const labelInput = row.querySelector('.variant-label-input');
      const priceInputEl = row.querySelector('.variant-price-input');
      const deleteVariantBtn = row.querySelector('.delete-variant-btn');

      labelInput.value = variant.label || '';
      priceInputEl.value = variant.price != null ? variant.price : '';

      labelInput.addEventListener('input', () => { variant.label = labelInput.value; });
      priceInputEl.addEventListener('input', () => {
        const v = parseFloat(priceInputEl.value);
        variant.price = Number.isNaN(v) ? 0 : v;
      });
      deleteVariantBtn.addEventListener('click', () => {
        const idx = item.variants.indexOf(variant);
        if (idx !== -1) item.variants.splice(idx, 1);
        row.remove();
      });

      return row;
    }

    renderVariantRows();

    addVariantBtn.addEventListener('click', () => {
      const newVariant = { label: '', price: 0 };
      item.variants.push(newVariant);
      variantsList.appendChild(renderVariantRow(newVariant));
    });

    // Quick-set buttons (e.g. "Half / Full", "Small / Medium / Large") fill
    // in the standard labels at once - existing prices are kept where a
    // label already matches, so re-clicking a preset doesn't wipe prices
    // already entered.
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const labels = btn.dataset.preset.split(',');
        const existingByLabel = {};
        item.variants.forEach((v) => { existingByLabel[(v.label || '').trim().toLowerCase()] = v; });

        item.variants = labels.map((label) => {
          const existing = existingByLabel[label.toLowerCase()];
          return existing ? existing : { label, price: 0 };
        });
        renderVariantRows();
      });
    });

    hasVariantsInput.addEventListener('change', () => {
      if (hasVariantsInput.checked) {
        if (item.variants.length === 0) {
          item.variants.push({ label: 'Half', price: item.price || 0 });
          item.variants.push({ label: 'Full', price: item.price || 0 });
          renderVariantRows();
        }
        delete item.price;
        delete item.oldPrice;
        discountInput.checked = false;
      } else {
        item.price = item.variants[0] ? item.variants[0].price : 0;
        item.variants = [];
        priceInput.value = item.price;
      }
      syncVariantsVisibility();
    });

    nameInput.addEventListener('input', () => { item.name = nameInput.value; img.alt = nameInput.value; });
    descInput.addEventListener('input', () => { item.description = descInput.value || null; });
    priceInput.addEventListener('input', () => {
      const v = parseFloat(priceInput.value);
      item.price = Number.isNaN(v) ? 0 : v;
    });
    badgeInput.addEventListener('input', () => {
      item.badge = badgeInput.value.trim() || null;
      variantsBadgeInput.value = badgeInput.value;
    });
    variantsBadgeInput.addEventListener('input', () => {
      item.badge = variantsBadgeInput.value.trim() || null;
      badgeInput.value = variantsBadgeInput.value;
    });
    priceFromInput.addEventListener('change', () => {
      if (priceFromInput.checked) item.priceFrom = true;
      else delete item.priceFrom;
    });
    discountInput.addEventListener('change', () => {
      discountRow.classList.toggle('hidden', !discountInput.checked);
      if (discountInput.checked) {
        if (item.oldPrice == null) item.oldPrice = item.price || 0;
        oldPriceInput.value = item.oldPrice;
      } else {
        delete item.oldPrice;
        oldPriceInput.value = '';
      }
    });
    oldPriceInput.addEventListener('input', () => {
      const v = parseFloat(oldPriceInput.value);
      item.oldPrice = Number.isNaN(v) ? 0 : v;
    });
    bestDealInput.addEventListener('change', () => {
      item.bestDeal = bestDealInput.checked;
    });

    photoInput.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file) return;
      try {
        img.style.opacity = '0.5';
        const dataUrl = await compressImage(file, 1000, 0.82);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, dataUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        item.image = data.url;
        img.src = data.url;
      } catch (err) {
        showBanner('Photo upload failed: ' + err.message, 'error');
      } finally {
        img.style.opacity = '1';
      }
    });

    deleteBtn.addEventListener('click', () => {
      if (!confirm(`Delete "${item.name || 'this item'}"?`)) return;
      const idx = category.items.indexOf(item);
      if (idx !== -1) category.items.splice(idx, 1);
      node.remove();
    });

    return node;
  }

  // Resizes/re-encodes an image client-side so uploads stay well under
  // Vercel's request body limit, before sending it to /api/upload.
  function compressImage(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the file'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Could not read the image'));
        image.onload = () => {
          let { width, height } = image;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height / width) * maxDimension);
              width = maxDimension;
            } else {
              width = Math.round((width / height) * maxDimension);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // --- Add category (inserted at the position chosen in the dropdown) ---
  document.getElementById('add-category-btn').addEventListener('click', () => {
    const newCategory = { categoryId: '', title: '', items: [] };
    let insertAt = menuData.length;
    if (addCategoryPositionSelect) {
      const parsed = parseInt(addCategoryPositionSelect.value, 10);
      if (!Number.isNaN(parsed)) insertAt = Math.min(Math.max(parsed, 0), menuData.length);
    }
    menuData.splice(insertAt, 0, newCategory);
    renderAll();

    const newNode = container.children[insertAt];
    if (newNode) {
      newNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const titleField = newNode.querySelector('.cat-title-input');
      if (titleField) titleField.focus();
    }
  });

  // --- Save ---
  saveBtn.addEventListener('click', async () => {
    hideBanner();
    const validationError = validate();
    if (validationError) {
      showBanner(validationError, 'error');
      return;
    }
    saveBtn.disabled = true;
    saveStatus.textContent = 'Saving…';
    saveStatus.className = 'save-status';
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      saveStatus.textContent = 'Saved ✓';
      saveStatus.className = 'save-status ok';
      showBanner('Menu saved. Changes are live on the site now.', 'success');
    } catch (err) {
      saveStatus.textContent = 'Save failed';
      saveStatus.className = 'save-status err';
      showBanner('Could not save: ' + err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      setTimeout(() => { saveStatus.textContent = ''; }, 4000);
    }
  });

  function validate() {
    const seenIds = new Set();
    for (const category of menuData) {
      if (!category.categoryId || !category.categoryId.trim()) {
        return 'Every category needs a short id (e.g. "beverages").';
      }
      if (!category.title || !category.title.trim()) {
        return 'Every category needs a title.';
      }
      for (const item of category.items) {
        if (!item.name || !item.name.trim()) {
          return `An item in "${category.title}" is missing a name.`;
        }
        const itemHasVariants = Array.isArray(item.variants) && item.variants.length > 0;
        if (itemHasVariants) {
          const seenLabels = new Set();
          for (const variant of item.variants) {
            if (!variant.label || !variant.label.trim()) {
              return `"${item.name}" has a size option with no label (e.g. "Half").`;
            }
            if (variant.price == null || Number.isNaN(variant.price) || variant.price < 0) {
              return `"${item.name}" - "${variant.label}" needs a valid price.`;
            }
            if (seenLabels.has(variant.label.trim().toLowerCase())) {
              return `"${item.name}" has two options both named "${variant.label}". Please use unique names.`;
            }
            seenLabels.add(variant.label.trim().toLowerCase());
          }
        } else if (item.price == null || Number.isNaN(item.price) || item.price < 0) {
          return `"${item.name}" needs a valid price.`;
        }
        if (!itemHasVariants && item.oldPrice != null) {
          if (Number.isNaN(item.oldPrice) || item.oldPrice < 0) {
            return `"${item.name}" needs a valid old price for its discount.`;
          }
          if (item.oldPrice <= item.price) {
            return `"${item.name}"'s old price must be higher than its current price for the discount to show.`;
          }
        }
        if (seenIds.has(item.id)) {
          return `Duplicate item id detected for "${item.name}". Please refresh and try again.`;
        }
        seenIds.add(item.id);
      }
    }
    return null;
  }

  // --- Logout ---
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  checkSession();
})();
