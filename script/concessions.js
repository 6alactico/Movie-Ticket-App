import { getStoredItem, getQueryParam } from "./utils.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const backBtn = $(".concessions-header__back-button");
const checkoutBtn = $(".checkout-button");
const categoryTabs = $$(".concessions-tabs__tab");
const itemLists = $$(".concessions-list__items");
const cartBtn = $(".cart-button");
const popup = $(".cart");
const orderList = $(".cart__list");
const totalEls = $$(".cart__total");
const taxEl = $(".cart__taxes");
const subtotalEl = $(".cart__subtotal");

const taxRate = 6.25;
let cart = JSON.parse(localStorage.getItem("cartItems")) || [];

function initConcessions() {
  const movieId = getQueryParam("id") || getStoredItem("id");
  const format = getQueryParam("format") || getStoredItem("selectedFormat");
  const date = getQueryParam("date") || getStoredItem("selectedDate");
  const time = getQueryParam("time") || getStoredItem("selectedTime");

  setupNavigation(movieId, format, date, time);
  fetchAndRenderCategories();
  setupCartToggle();
  setupCartRemoveHandler();
  repositionElements();
}

function setupNavigation(movieId, format, date, time) {
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
  fetch("/script/json/categories.json")
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
    li.classList.add("flex-row", "cart__item");
    li.innerHTML = `
      <div class="cart__image-container"><img src="${item.image}" alt="${item.name}"></div>

        <span class="flex-row cart__content">
        <h4 class="cart__item-name">${item.name}</h4>
          <button class="cart__remove-item" data-index="${idx}" aria-label="Remove item from cart">
            <svg width="24" height="24" viewBox="0 0 12 15"><path d="M6.595 18.82c.373 0 .618-.238.609-.584l-.305-10.57c-.01-.346-.255-.573-.608-.573-.373 0-.618.237-.609.583l.295 10.56c.01.356.255.583.618.583Zm2.905 0c.373 0 .638-.238.638-.584V7.676c0-.346-.265-.583-.638-.583s-.628.237-.628.583v10.56c0 .346.255.583.628.583Zm2.915 0c.353 0 .598-.228.608-.584l.295-10.56c.01-.346-.236-.583-.609-.583-.353 0-.598.227-.608.583l-.295 10.56c-.01.346.236.583.609.583ZM5.192 4.514h1.56V2.4c0-.564.393-.93.981-.93h3.514c.589 0 .981.366.981.93v2.114h1.56V2.302C13.789.869 12.867 0 11.356 0h-3.73c-1.51 0-2.433.87-2.433 2.302v2.213Zm-4.456.79h17.538c.402 0 .726-.346.726-.75a.735.735 0 00-.726-.742H.736A.75.75 0 000 4.554c0 .415.343.75.736.75ZM5.006 22h8.999c1.403 0 2.345-.919 2.414-2.331l.687-14.552h-1.58l-.658 14.384c-.02.592-.441 1.007-1.02 1.007H5.143c-.56 0-.982-.424-1.011-1.007L3.435 5.117h-1.54l.696 14.561C2.66 21.091 3.582 22 5.005 22Z"/></svg>
          </button>

          <span class="cart__item-price">$${totalItem}</span>

          <div class="flex-row cart__counter">
            <button class="cart__decrement" data-index="${idx}" aria-label="Decrease quantity">
              <svg width="24" height="24" viewBox="-4 -4 24 24">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
              </svg>
            </button>

            <span class="cart__counter-value" data-quantity="${item.quantity}" aria-live="polite">${item.quantity}</span>

            <button class="cart__increment" data-index="${idx}" aria-label="Increase quantity">
              <svg width="24" height="24" viewBox="-4 -4 24 24">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
              </svg>
            </button>
          </div>
        </span>`;
    orderList.appendChild(li);

    li.querySelector(".cart__decrement").addEventListener("click", () =>
      updateQuantity(idx, -1)
    );
    li.querySelector(".cart__increment").addEventListener("click", () =>
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
    const btn = e.target.closest(".cart__remove-item");
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
  subtotalEl.textContent = ` $${subtotal.toFixed(2)}`;
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

const main = $(".concessions");
const concessions = $(".concessions-list-container");
const tabs = $(".concessions-tabs");
const header = $(".concessions-header");
const nav = $(".concessions-nav");
const wrapper = document.createElement("div");
wrapper.classList.add("concessions-wrapper", "flex-column");

function repositionElements() {
  if (!tabs || !concessions) {
    console.warn("Missing element in repositionElements");
    return;
  }
  const updatePosition = () => {
    if (window.innerWidth >= 768) {
      popup.classList.remove("hidden");
      wrapper.append(tabs, concessions);
      main.appendChild(wrapper);
      wrapper.after(nav);
    } else {
      header.appendChild(tabs);
    }
  };
  updatePosition();
  window.addEventListener("resize", updatePosition);
  console.log("Repositioned segmented buttons based on screen size");
}

initConcessions();