document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  if (!window.MenuStore) return;

  const ADMIN_EMAIL = "admin@fastfood.com";
  const ADMIN_PASSWORD = "admin123";
  const AUTH_KEY = "fastFoodAdminLoggedIn";

  const imageOptions = [
    "assets/images/burger.png",
    "assets/images/best-dish.png",
    "assets/images/hot-dog.png",
    "assets/images/crispy-chicken.png",
    "assets/images/chicken-food.png",
    "assets/images/Food Images/02-1.jpg",
    "assets/images/Food Images/03-2.jpg",
    "assets/images/Food Images/09.jpg",
    "assets/images/Food Images/menu_item_2-640x640.jpg",
  ];

  const searchInput = document.getElementById("searchInput");
  const categoriesList = document.getElementById("categoriesList");
  const itemCount = document.getElementById("itemCount");
  const addCategoryButton = document.getElementById("addCategoryButton");
  const toast = document.getElementById("toast");
  const loginScreen = document.getElementById("loginScreen");
  const loginForm = document.getElementById("loginForm");
  const adminEmail = document.getElementById("adminEmail");
  const adminPassword = document.getElementById("adminPassword");
  const loginError = document.getElementById("loginError");
  const togglePassword = document.getElementById("togglePassword");
  const logoutButton = document.getElementById("logoutButton");
  const adminHeader = document.querySelector(".admin-header");
  const adminShell = document.querySelector(".admin-shell");

  const categoryDialog = document.getElementById("categoryDialog");
  const categoryForm = document.getElementById("categoryForm");
  const categoryId = document.getElementById("categoryId");
  const categoryName = document.getElementById("categoryName");
  const categoryDialogEyebrow = document.getElementById("categoryDialogEyebrow");
  const categoryDialogTitle = document.getElementById("categoryDialogTitle");
  const categorySubmitText = document.getElementById("categorySubmitText");
  const closeCategoryDialog = document.getElementById("closeCategoryDialog");
  const cancelCategory = document.getElementById("cancelCategory");

  const itemDialog = document.getElementById("itemDialog");
  const itemForm = document.getElementById("itemForm");
  const itemId = document.getElementById("itemId");
  const itemName = document.getElementById("itemName");
  const itemPrice = document.getElementById("itemPrice");
  const itemCategory = document.getElementById("itemCategory");
  const variantsList = document.getElementById("variantsList");
  const addVariantBtn = document.getElementById("addVariantBtn");
  const addonsList = document.getElementById("addonsList");
  const addAddonBtn = document.getElementById("addAddonBtn");
  const itemImageFile = document.getElementById("itemImageFile");
  const itemImage = document.getElementById("itemImage");
  const itemDescription = document.getElementById("itemDescription");
  const itemRating = document.getElementById("itemRating");
  const itemPopular = document.getElementById("itemPopular");
  const itemImagePreview = document.getElementById("itemImagePreview");
  const itemPreviewName = document.getElementById("itemPreviewName");
  const itemPreviewPrice = document.getElementById("itemPreviewPrice");
  const itemDialogEyebrow = document.getElementById("itemDialogEyebrow");
  const itemDialogTitle = document.getElementById("itemDialogTitle");
  const itemSubmitText = document.getElementById("itemSubmitText");
  const closeItemDialog = document.getElementById("closeItemDialog");
  const cancelItem = document.getElementById("cancelItem");

  let categories = window.MenuStore.readCategories();
  let currentVariants = [];
  let currentAddons = [];
  let items = window.MenuStore.readItems();

  setupSelects();
  renderCategories();
  syncAuthView();

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = adminEmail.value.trim().toLowerCase();
    const password = adminPassword.value;

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      loginError.textContent = "Email ya password ghalat hai.";
      adminPassword.value = "";
      adminPassword.focus();
      return;
    }

    sessionStorage.setItem(AUTH_KEY, "true");
    loginError.textContent = "";
    syncAuthView();
    showToast("Admin panel open ho gaya.");
  });

  logoutButton.addEventListener("click", function () {
    sessionStorage.removeItem(AUTH_KEY);
    syncAuthView();
    loginForm.reset();
    adminEmail.focus();
  });

  togglePassword.addEventListener("click", function () {
    const isPassword = adminPassword.type === "password";
    adminPassword.type = isPassword ? "text" : "password";
    togglePassword.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    togglePassword.innerHTML = isPassword
      ? '<i class="fa-regular fa-eye-slash" aria-hidden="true"></i>'
      : '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
  });

  addCategoryButton.addEventListener("click", openAddCategoryDialog);
  searchInput.addEventListener("input", renderCategories);

  categoryForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = categoryName.value.trim();
    if (!name) return;

    const currentId = categoryId.value || window.MenuStore.createId(name);
    const existingIndex = categories.findIndex((category) => category.id === currentId);
    const duplicate = categories.some(
      (category) =>
        category.id !== currentId && category.label.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      showToast("Ye category pehle se mojood hai.");
      return;
    }

    if (existingIndex >= 0) {
      categories[existingIndex] = { id: currentId, label: name };
      showToast("Category updated successfully.");
    } else {
      categories.unshift({ id: currentId, label: name });
      showToast("New category added successfully.");
    }

    saveCategoriesAndRender();
    categoryDialog.close();
  });

  itemForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const currentId = itemId.value || window.MenuStore.createId(itemName.value);
    const nextItem = {
      id: currentId,
      category: itemCategory.value,
      name: itemName.value.trim(),
      price: itemPrice.value.trim(),
      description: itemDescription.value.trim(),
      image: itemImage.value.trim(),
      rating: Number(itemRating.value) || 0,
      popular: itemPopular.checked,
      variants: [...currentVariants],
      addons: [...currentAddons],
    };

    const selectedIndex = items.findIndex((item) => item.id === currentId);
    if (selectedIndex >= 0) {
      items[selectedIndex] = nextItem;
      showToast("Item updated successfully.");
    } else {
      items.push(nextItem);
      showToast("New item added successfully.");
    }

    saveItemsAndRender();
    itemDialog.close();
  });

  updateItemPreview();

  if (itemImageFile) {
    itemImageFile.addEventListener("change", async function () {
      const file = itemImageFile.files[0];
      if (!file) return;
      try {
        itemImagePreview.style.opacity = "0.5";
        const dataUrl = await compressImage(file, 1000, 0.82);
        itemImage.value = dataUrl;
        updateItemPreview();
      } catch (err) {
        showToast("Photo upload failed: " + err.message);
      } finally {
        itemImagePreview.style.opacity = "1";
      }
    });
  }

  [itemName, itemPrice, itemImage].forEach((field) => {
    field.addEventListener("input", updateItemPreview);
  });

  [closeCategoryDialog, cancelCategory].forEach((button) => {
    button.addEventListener("click", function () {
      categoryDialog.close();
    });
  });

  [closeItemDialog, cancelItem].forEach((button) => {
    button.addEventListener("click", function () {
      itemDialog.close();
    });
  });

  categoryDialog.addEventListener("click", function (event) {
    if (event.target === categoryDialog) categoryDialog.close();
  });

  itemDialog.addEventListener("click", function (event) {
    if (event.target === itemDialog) itemDialog.close();
  });

  categoriesList.addEventListener("click", function (event) {
    const addItemButton = event.target.closest("[data-add-item]");
    const editCategoryButton = event.target.closest("[data-edit-category]");
    const deleteCategoryButton = event.target.closest("[data-delete-category]");
    const moveCategoryButton = event.target.closest("[data-move-category]");
    const editItemButton = event.target.closest("[data-edit-item]");
    const deleteItemButton = event.target.closest("[data-delete-item]");

    if (addItemButton) openAddItemDialog(addItemButton.dataset.addItem);
    if (editCategoryButton) editCategory(editCategoryButton.dataset.editCategory);
    if (deleteCategoryButton) deleteCategory(deleteCategoryButton.dataset.deleteCategory);
    if (moveCategoryButton) moveCategory(moveCategoryButton.dataset.moveCategory, moveCategoryButton.dataset.direction);
    if (editItemButton) editItem(editItemButton.dataset.editItem);
    if (deleteItemButton) deleteItem(deleteItemButton.dataset.deleteItem);
  });

  
  function renderVariants() {
    if (!variantsList) return;
    variantsList.innerHTML = currentVariants.map((v, i) => `
      <div style="display:flex; gap:8px;">
        <input type="text" placeholder="Size (e.g. Large)" value="${escapeAttribute(v.label)}" onchange="window.updateVariant(${i}, 'label', this.value)" style="flex:1;">
        <input type="text" placeholder="Price (e.g. 10.00)" value="${escapeAttribute(v.price)}" onchange="window.updateVariant(${i}, 'price', this.value)" style="width:80px;">
        <button type="button" class="icon-btn delete" onclick="window.removeVariant(${i})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');
  }
  window.updateVariant = (i, field, val) => { currentVariants[i][field] = val; };
  window.removeVariant = (i) => { currentVariants.splice(i, 1); renderVariants(); };

  function renderAddons() {
    if (!addonsList) return;
    addonsList.innerHTML = currentAddons.map((a, i) => `
      <div style="display:flex; gap:8px;">
        <input type="text" placeholder="Name (e.g. Extra Cheese)" value="${escapeAttribute(a.label)}" onchange="window.updateAddon(${i}, 'label', this.value)" style="flex:1;">
        <input type="text" placeholder="Price (e.g. 2.00)" value="${escapeAttribute(a.price)}" onchange="window.updateAddon(${i}, 'price', this.value)" style="width:80px;">
        <button type="button" class="icon-btn delete" onclick="window.removeAddon(${i})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');
  }
  window.updateAddon = (i, field, val) => { currentAddons[i][field] = val; };
  window.removeAddon = (i) => { currentAddons.splice(i, 1); renderAddons(); };

  if(addVariantBtn) addVariantBtn.addEventListener("click", () => { currentVariants.push({label:'', price:''}); renderVariants(); });
  if(addAddonBtn) addAddonBtn.addEventListener("click", () => { currentAddons.push({label:'', price:''}); renderAddons(); });

  function setupSelects() {
    renderCategoryOptions();
  }

  function renderCategoryOptions(selectedId) {
    itemCategory.innerHTML = categories
      .map(
        (category) =>
          `<option value="${category.id}"${category.id === selectedId ? " selected" : ""}>${escapeHtml(category.label)}</option>`
      )
      .join("");
  }

  function syncAuthView() {
    const isLoggedIn = sessionStorage.getItem(AUTH_KEY) === "true";

    document.body.classList.toggle("admin-locked", !isLoggedIn);
    loginScreen.hidden = isLoggedIn;
    adminHeader.hidden = !isLoggedIn;
    adminShell.hidden = !isLoggedIn;

    if (!isLoggedIn) window.setTimeout(() => adminEmail.focus(), 0);
  }

  function renderCategories() {
    const searchValue = searchInput.value.trim().toLowerCase();
    const totalItems = items.length;

    itemCount.textContent = `${categories.length} categories / ${totalItems} item${totalItems === 1 ? "" : "s"}`;

    if (!categories.length) {
      categoriesList.innerHTML = '<div class="empty-state">No category found. Add Category se start karein.</div>';
      return;
    }

    const html = categories
      .map((category) => {
        const categoryItems = items.filter((item) => item.category === category.id);
        const matchesCategory = category.label.toLowerCase().includes(searchValue);
        const visibleItems = categoryItems.filter(
          (item) =>
            !searchValue ||
            matchesCategory ||
            item.name.toLowerCase().includes(searchValue) ||
            item.description.toLowerCase().includes(searchValue)
        );

        if (searchValue && !matchesCategory && !visibleItems.length) return "";

        return createCategoryMarkup(category, categoryItems.length, visibleItems);
      })
      .join("");

    categoriesList.innerHTML = html || '<div class="empty-state">No category or item found.</div>';
  }

  function createCategoryMarkup(category, totalCategoryItems, visibleItems) {
    const itemsMarkup = visibleItems.length
      ? visibleItems.map(createItemMarkup).join("")
      : '<div class="empty-state slim">Is category mein abhi koi item nahi hai.</div>';

    return `
      <section class="category-section">
        <div class="category-header">
          <div>
            <h3>${escapeHtml(category.label)}</h3>
            <p>${totalCategoryItems} item${totalCategoryItems === 1 ? "" : "s"}</p>
          </div>
          <div class="category-actions">
            <button type="button" class="primary-btn compact-btn" data-add-item="${category.id}">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Add Item
            </button>
            <button type="button" class="icon-btn" data-move-category="${category.id}" data-direction="up" aria-label="Move ${escapeAttribute(category.label)} up">
              <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
            </button>
            <button type="button" class="icon-btn" data-move-category="${category.id}" data-direction="down" aria-label="Move ${escapeAttribute(category.label)} down">
              <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
            </button>
            <button type="button" class="icon-btn" data-edit-category="${category.id}" aria-label="Edit ${escapeAttribute(category.label)}">
              <i class="fa-solid fa-pen" aria-hidden="true"></i>
            </button>
            <button type="button" class="icon-btn delete" data-delete-category="${category.id}" aria-label="Delete ${escapeAttribute(category.label)}">
              <i class="fa-solid fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="category-items">${itemsMarkup}</div>
      </section>
    `;
  }

  function createItemMarkup(item) {
    return `
      <article class="admin-item">
        <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.name)}" />
        <div>
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.description)}</p>
          <div class="item-meta">
            <span>${escapeHtml(item.price)}</span>
            <span>${Number(item.rating) || 0} Star</span>
            ${item.popular ? "<span>Popular</span>" : ""}
          </div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" type="button" data-edit-item="${item.id}" aria-label="Edit ${escapeAttribute(item.name)}">
            <i class="fa-solid fa-pen" aria-hidden="true"></i>
          </button>
          <button class="icon-btn delete" type="button" data-delete-item="${item.id}" aria-label="Delete ${escapeAttribute(item.name)}">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      </article>
    `;
  }

  function openAddCategoryDialog() {
    categoryForm.reset();
    categoryId.value = "";
    categoryDialogEyebrow.textContent = "Add Category";
    categoryDialogTitle.textContent = "Add Category";
    categorySubmitText.textContent = "Save Category";
    categoryDialog.showModal();
    categoryName.focus();
  }

  function editCategory(id) {
    const selectedCategory = categories.find((category) => category.id === id);
    if (!selectedCategory) return;

    categoryId.value = selectedCategory.id;
    categoryName.value = selectedCategory.label;
    categoryDialogEyebrow.textContent = "Edit Category";
    categoryDialogTitle.textContent = "Update Category";
    categorySubmitText.textContent = "Update Category";
    categoryDialog.showModal();
    categoryName.focus();
  }


  function moveCategory(id, direction) {
    const currentIndex = categories.findIndex((category) => category.id === id);
    if (currentIndex < 0) return;

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= categories.length) return;

    const [category] = categories.splice(currentIndex, 1);
    categories.splice(nextIndex, 0, category);
    saveCategoriesAndRender();
    showToast("Category order updated.");
  }
  function deleteCategory(id) {
    const selectedCategory = categories.find((category) => category.id === id);
    if (!selectedCategory) return;

    const count = items.filter((item) => item.category === id).length;
    const shouldDelete = window.confirm(
      `"${selectedCategory.label}" category delete karni hai? Iske ${count} item bhi delete ho jayenge.`
    );
    if (!shouldDelete) return;

    categories = categories.filter((category) => category.id !== id);
    items = items.filter((item) => item.category !== id);
    window.MenuStore.saveCategories(categories);
    window.MenuStore.saveItems(items);
    renderCategoryOptions();
    renderCategories();
    showToast("Category deleted successfully.");
  }

  function openAddItemDialog(categoryId) {
    if (!categories.length) {
      showToast("Pehle category add karein.");
      return;
    }

    itemForm.reset();
    itemId.value = "";
    itemRating.value = 5;
    itemPopular.checked = false;
    itemImage.value = "assets/images/burger.png";
    currentVariants = [];
    currentAddons = [];
    renderVariants();
    renderAddons();
    renderCategoryOptions(categoryId || categories[0].id);
    itemDialogEyebrow.textContent = "Add Product";
    itemDialogTitle.textContent = "Add Menu Item";
    itemSubmitText.textContent = "Save Item";
    updateItemPreview();
    itemDialog.showModal();
    itemName.focus();
  }

  function editItem(id) {
    const selectedItem = items.find((item) => item.id === id);
    if (!selectedItem) return;

    renderCategoryOptions(selectedItem.category);
    itemId.value = selectedItem.id;
    itemName.value = selectedItem.name;
    itemPrice.value = selectedItem.price;
    itemImage.value = selectedItem.image;
    itemDescription.value = selectedItem.description;
    itemRating.value = selectedItem.rating;
    itemPopular.checked = Boolean(selectedItem.popular);
    currentVariants = JSON.parse(JSON.stringify(selectedItem.variants || []));
    currentAddons = JSON.parse(JSON.stringify(selectedItem.addons || []));
    renderVariants();
    renderAddons();
    itemDialogEyebrow.textContent = "Edit Product";
    itemDialogTitle.textContent = "Update Menu Item";
    itemSubmitText.textContent = "Update Item";
    updateItemPreview();
    itemDialog.showModal();
    itemName.focus();
  }

  function deleteItem(id) {
    const selectedItem = items.find((item) => item.id === id);
    if (!selectedItem) return;

    const shouldDelete = window.confirm(`"${selectedItem.name}" delete karna hai?`);
    if (!shouldDelete) return;

    items = items.filter((item) => item.id !== id);
    saveItemsAndRender();
    showToast("Item deleted successfully.");

    if (itemId.value === id) itemDialog.close();
  }

  function saveCategoriesAndRender() {
    window.MenuStore.saveCategories(categories);
    renderCategoryOptions();
    renderCategories();
  }

  function saveItemsAndRender() {
    window.MenuStore.saveItems(items);
    renderCategories();
  }

  function updateItemPreview() {
    itemPreviewName.textContent = itemName.value.trim() || "Product preview";
    itemPreviewPrice.textContent = itemPrice.value.trim() || "Rs. 0.00";
    itemImagePreview.src = itemImage.value.trim() || "assets/images/burger.png";
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
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

  function compressImage(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the file"));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Could not read the image"));
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
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

});