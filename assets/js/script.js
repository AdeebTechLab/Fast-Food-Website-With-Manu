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
  if (menuTabs.length > 0) {
    menuTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Remove active class from all tabs
        menuTabs.forEach((t) => t.classList.remove("active"));
        // Add active class to clicked tab
        tab.classList.add("active");

        // Hide all menu contents
        menuContents.forEach((content) => (content.style.display = "none"));

        // Show the corresponding content
        const target = tab.getAttribute("data-target");
        document.getElementById(target).style.display = "grid";
      });
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
});
