import { getStoredItem, getQueryParam } from "./utils.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const backBtn = $(".concessions-header__back-button");
const checkoutBtn = $(".checkout-button");
const categoryTabs = $$(".concessions-header__tab");
const itemLists = $$(".concessions-list__items");
const cartBtn = $(".cart-button");
const popup = $(".cart-summary");
const orderList = $(".cart-summary__items");
const totalEls = $$(".cart-summary__total");
const taxEl = $(".cart-summary__taxes");

const taxRate = 6.25;
let cart = JSON.parse(localStorage.getItem("cartItems")) || [];

const movieId = getQueryParam("id") || getStoredItem("id");
const format = getQueryParam("format") || getStoredItem("selectedFormat");
const date = getQueryParam("date") || getStoredItem("selectedDate");
const time = getQueryParam("time") || getStoredItem("selectedTime");

setupNavigation();
fetchAndRenderCategories();
setupCartToggle();
setupCartRemoveHandler();

function setupNavigation() {
  const from = new URLSearchParams(location.search).get("from");
  if (backBtn) {
    if (from === "seats") {
      backBtn.classList.add("visible");
      backBtn.href = `seats-and-tickets.html?id=${movieId}&format=${format}&date=${date}&time=${time}`;
    } else if (from === "checkout") {
      backBtn.classList.add("visible");
      backBtn.href = `checkout.html?id=${movieId}&format=${format}&date=${date}&time=${time}`;
    } else {
      backBtn.classList.remove("visible");
    }
  }
  if (checkoutBtn) checkoutBtn.href = `checkout.html?id=${movieId}&format=${format}&date=${date}&time=${time}`;
}

function fetchAndRenderCategories() {
  fetch("/script/categories.json")
    .then((res) => res.json())
    .then(({ categories }) => {
      categories.forEach((cat, i) => {
        cat.items.forEach(
          (item) => (item.price = parseFloat(item.price).toFixed(2))
        );
        renderCategory(cat.title, cat.items, i);
        initScrollCounter(cat.items, i);
      });
      initTabs();
    })
    .catch((err) => console.error("Error loading categories:", err));
}

// Initialize the category tabs
function initTabs() {
  categoryTabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      categoryTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    })
  );
}

// Render a single category
function renderCategory(title, items, index) {
  const list = itemLists[index];
  if (!list) return console.error(`No list for ${title}`);

  items.forEach(({ name, price, image }) => {
    const li = document.createElement("li");
    li.className = "flex-column list-item";
    li.innerHTML = `
      <div class="image-container"><img src="${image}" alt="${name}"></div>
      <div class="flex-row list-item__details">
        <div class="flex-column">
          <span class="list-item__name">${name}</span>
          <span class="list-item__price">$${price}</span>
        </div>
          <button class="list-item__add-btn" aria-label="Add item to Cart">
            <svg width="24" height="24" class="plus-circle" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
          </button>
      </div>`;
    list.appendChild(li);
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".list-item__add-btn");
    if (!btn) return;

    const itemEl = btn.closest(".list-item");
    const name = itemEl.querySelector(".list-item__name").textContent;
    const price = parseFloat(
      itemEl.querySelector(".list-item__price").textContent.slice(1)
    );
    const image = itemEl.querySelector("img").src;

    addItemToCart({ name, price, image });
  });
}

function addItemToCart(item) {
  const existing = cart.find((cartItem) => cartItem.name === item.name);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  updateCartUI();
}

function updateCartUI() {
  orderList.innerHTML = "";
  cart.forEach((item, idx) => {
    const totalItem = (item.price * item.quantity).toFixed(2);
    const li = document.createElement("li");
    li.className = "flex-row cart-summary__item";
    li.innerHTML = `
      <div class="cart-summary__image-container"><img src="${item.image}" alt="${item.name}"></div>
      <div class="flex-column cart-summary__text-block">
        <span class="flex-row cart-summary__item-name">${item.name}
          <button class="cart-summary__remove-item" data-index="${idx}" aria-label="Remove item">
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4V4.5H4C2.9 4.5 2 5.4 2 6.5V7H22V6.5C22 5.4 21.1 4.5 20 4.5H14V4C14 2.9 13.1 2 12 2ZM4 9H20V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V9ZM6 11V20H18V11H6Z"/></svg>
          </button>
        </span>
        <div class="flex-row">
          <span class="cart-summary__item-price">$${totalItem}</span>
          <div class="flex-row cart-summary__counter">
            <button class="cart-summary__decrement" data-index="${idx}" aria-label="Decrease quantity">
              <svg width="16" height="16" viewBox="-4 -4 24 24">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
              </svg>
            </button>
            <span class="cart-summary__counter-value" data-quantity="${item.quantity}" aria-live="polite">${item.quantity}</span>
            <button class="cart-summary__increment" data-index="${idx}" aria-label="Increase quantity">
              <svg width="16" height="16" viewBox="-4 -4 24 24">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>`;
    orderList.appendChild(li);

    li.querySelector(".cart-summary__decrement").addEventListener("click", () =>
      updateQuantity(idx, -1)
    );
    li.querySelector(".cart-summary__increment").addEventListener("click", () =>
      updateQuantity(idx, 1)
    );
  });

  updateTotals();
  localStorage.setItem("cartItems", JSON.stringify(cart));
}

function updateQuantity(index, delta) {
  const item = cart[index];
  item.quantity = Math.max(0, item.quantity + delta);
  if (item.quantity === 0) cart.splice(index, 1);
  updateCartUI();
}

function setupCartRemoveHandler() {
  orderList.addEventListener("click", (e) => {
    const btn = e.target.closest(".cart-summary__remove-item");
    if (!btn) return;
    const index = +btn.dataset.index;
    if (!isNaN(index)) {
      cart.splice(index, 1);
      updateCartUI();
    }
  });
}

function updateTotals() {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = ((subtotal * taxRate) / 100).toFixed(2);
  const total = (subtotal + parseFloat(tax)).toFixed(2);
  taxEl.textContent = ` $${tax}`;
  totalEls.forEach((el) => (el.textContent = ` $${total}`));
}

function initScrollCounter(items, index) {
  const counters = $$(".concessions-list__counter");
  const list = itemLists[index];
  const display = counters[index];
  if (display) display.textContent = `1/${items.length}`;

  list?.addEventListener("scroll", () => {
    const current = Math.min(
      Math.round(list.scrollLeft / 100),
      items.length - 1
    ); // Assuming each item is 100px wide
    if (display) display.textContent = `${current + 1}/${items.length}`;
  });
}

function setupCartToggle() {
  if (cartBtn && popup) {
    cartBtn.addEventListener("click", () => popup.classList.toggle("hidden"));
  }
}
