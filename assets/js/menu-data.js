(function () {
  "use strict";

  const ITEMS_KEY = "fastFoodMenuItems";
  const CATEGORIES_KEY = "fastFoodMenuCategories";

  const defaultCategories = [
    { id: "burgers", label: "Burgers" },
    { id: "hot-dogs", label: "Hot Dogs" },
    { id: "chicken", label: "Chicken" },
    { id: "sides", label: "Sides" },
  ];

  const defaultItems = [
    {
      id: "classic-burger",
      category: "burgers",
      name: "Classic Burger",
      price: "Rs. 8.99",
      description:
        "Juicy beef patty with fresh lettuce, tomatoes, cheese, and our special sauce.",
      image: "assets/images/burger.png",
      rating: 4.5,
      popular: true,
    },
    {
      id: "cheese-burger",
      category: "burgers",
      name: "Cheese Burger",
      price: "Rs. 10.99",
      description:
        "Double beef patty with extra cheese, caramelized onions, and premium sauce.",
      image: "assets/images/best-dish.png",
      rating: 5,
      popular: true,
    },
    {
      id: "veggie-burger",
      category: "burgers",
      name: "Veggie Burger",
      price: "Rs. 9.99",
      description:
        "Plant-based patty with lettuce, tomatoes, pickles, and vegan mayo.",
      image: "assets/images/burger.png",
      rating: 4,
    },
    {
      id: "classic-hot-dog",
      category: "hot-dogs",
      name: "Classic Hot Dog",
      price: "Rs. 6.99",
      description:
        "Premium sausage in a soft bun with ketchup, mustard, and relish.",
      image: "assets/images/hot-dog.png",
      rating: 4,
    },
    {
      id: "cheese-dog",
      category: "hot-dogs",
      name: "Cheese Dog",
      price: "Rs. 7.99",
      description:
        "Classic hot dog topped with melted cheese and crispy fried onions.",
      image: "assets/images/hot-dog.png",
      rating: 4.5,
    },
    {
      id: "chili-dog",
      category: "hot-dogs",
      name: "Chili Dog",
      price: "Rs. 8.99",
      description:
        "Hot dog topped with homemade chili, cheese, and chopped onions.",
      image: "assets/images/hot-dog.png",
      rating: 5,
    },
    {
      id: "crispy-chicken-sandwich",
      category: "chicken",
      name: "Crispy Chicken Sandwich",
      price: "Rs. 9.99",
      description:
        "Crispy fried chicken breast with lettuce, tomato, and special mayo.",
      image: "assets/images/crispy-chicken.png",
      rating: 4.5,
      popular: true,
    },
    {
      id: "chicken-nuggets",
      category: "chicken",
      name: "Chicken Nuggets",
      price: "Rs. 7.99",
      description:
        "8 pieces of premium chicken nuggets with choice of dipping sauce.",
      image: "assets/images/chicken-food.png",
      rating: 4,
    },
    {
      id: "spicy-chicken-wrap",
      category: "chicken",
      name: "Spicy Chicken Wrap",
      price: "Rs. 8.99",
      description:
        "Spicy grilled chicken with fresh veggies and chipotle sauce in a wrap.",
      image: "assets/images/crispy-chicken.png",
      rating: 5,
    },
    {
      id: "french-fries",
      category: "sides",
      name: "French Fries",
      price: "Rs. 3.99",
      description: "Crispy golden fries seasoned with our secret spice blend.",
      image: "assets/images/burger.png",
      rating: 5,
    },
    {
      id: "onion-rings",
      category: "sides",
      name: "Onion Rings",
      price: "Rs. 4.99",
      description: "Crispy battered onion rings served with special dipping sauce.",
      image: "assets/images/burger.png",
      rating: 4,
    },
    {
      id: "coleslaw",
      category: "sides",
      name: "Coleslaw",
      price: "Rs. 2.99",
      description: "Fresh and creamy coleslaw made with our signature dressing.",
      image: "assets/images/burger.png",
      rating: 4.5,
    },
  ];

  function createId(name) {
    return `${Date.now()}-${name || "item"}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function readJson(key, fallback) {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback.slice();

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : fallback.slice();
    } catch (error) {
      return fallback.slice();
    }
  }

  function readCategories() {
    return readJson(CATEGORIES_KEY, defaultCategories);
  }

  function saveCategories(categories) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }

  function readItems() {
    return readJson(ITEMS_KEY, defaultItems);
  }

  function saveItems(items) {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }

  function resetAll() {
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(ITEMS_KEY);
    return {
      categories: readCategories(),
      items: readItems(),
    };
  }

  window.MenuStore = {
    defaultCategories,
    defaultItems,
    createId,
    readCategories,
    saveCategories,
    readItems,
    saveItems,
    resetAll,
  };
})();