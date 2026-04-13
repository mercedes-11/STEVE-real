
/* =========================================================
   1. CONSTANTES Y ESTADO GLOBAL
========================================================= */

// Clave para guardar el carrito en localStorage
const STORAGE_KEY = "islabonita-cart";

// IVA / impuestos conceptuales.
// En tu maqueta aparece “precio sin impuestos nacionales”, así que
// dejamos una constante por si luego querés hacer cálculos más reales.
const TAX_RATE = 0.21;

// Estado principal de la aplicación
const state = {
  products: [],
  cart: []
};

/* =========================================================
   2. SELECTORES DEL DOM
========================================================= */

const DOM = {
  body: document.body,
  cartLink: document.querySelector(".cart-link"),
  cartCount: document.querySelector(".cart-count"),
  selectionCards: document.querySelectorAll(".selection-card"),
  menuToggle: document.querySelector(".menu-toggle"),
  mainNav: document.querySelector(".main-nav"),
  newsletterForm: document.querySelector(".newsletter-form")
};

/* =========================================================
   3. MOCK DE PRODUCTOS
   ---------------------------------------------------------
   Estos productos respetan tus cards actuales de la sección
   “Nuestra selección”.
========================================================= */

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Navy Braided Sweater",
    price: 118000,
    imageClass: "placeholder-one",
    category: "sweaters"
  },
  {
    id: 2,
    name: "Chocolate Knit Set",
    price: 164000,
    imageClass: "placeholder-two",
    category: "sets"
  },
  {
    id: 3,
    name: "Soft Ribbed Top",
    price: 79000,
    imageClass: "placeholder-three",
    category: "tops"
  },
  {
    id: 4,
    name: "Tailored Knit Bottom",
    price: 96000,
    imageClass: "placeholder-four",
    category: "bottoms"
  }
];

/* =========================================================
   4. UTILIDADES
========================================================= */

/**
 * Formatea un número como moneda argentina.
 * Ejemplo: 118000 -> $118.000
 */
function formatPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "$0";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Calcula el precio base sin impuestos.
 * Se usa solo como referencia visual.
 */
function calculateNetPrice(price) {
  return price / (1 + TAX_RATE);
}

/**
 * Busca un producto por ID dentro del estado.
 */
function getProductById(productId) {
  return state.products.find(product => product.id === productId);
}

/**
 * Devuelve la cantidad total de productos en el carrito,
 * sumando todas las cantidades.
 */
function getCartItemsCount() {
  return state.cart.reduce((acc, item) => acc + item.quantity, 0);
}

/**
 * Devuelve el total monetario del carrito.
 */
function getCartTotal() {
  return state.cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

/* =========================================================
   5. PERSISTENCIA
========================================================= */

/**
 * Guarda el carrito actual en localStorage.
 */
function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  } catch (error) {
    console.error("No se pudo guardar el carrito en localStorage:", error);
  }
}

/**
 * Recupera el carrito desde localStorage.
 */
function loadCart() {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);

    if (!savedCart) {
      state.cart = [];
      return;
    }

    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      state.cart = [];
      return;
    }

    // Validación básica de estructura
    state.cart = parsedCart.filter(item =>
      item &&
      typeof item.id === "number" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      typeof item.quantity === "number"
    );
  } catch (error) {
    console.error("No se pudo recuperar el carrito:", error);
    state.cart = [];
  }
}

/* =========================================================
   6. CREACIÓN DEL PANEL DEL CARRITO
   ---------------------------------------------------------
   Como tu HTML no trae un modal o aside real para carrito,
   lo generamos desde JS para no tocar tu estructura base.
========================================================= */

function createCartPanel() {
  const existingOverlay = document.querySelector(".cart-overlay");
  const existingAside = document.querySelector(".cart-panel");

  if (existingOverlay || existingAside) return;

  const overlay = document.createElement("div");
  overlay.className = "cart-overlay";
  overlay.setAttribute("hidden", "");

  const panel = document.createElement("aside");
  panel.className = "cart-panel";
  panel.setAttribute("aria-hidden", "true");
  panel.setAttribute("aria-label", "Carrito de compras");

  panel.innerHTML = `
    <div class="cart-panel__header">
      <h2>Tu carrito</h2>
      <button type="button" class="cart-close" aria-label="Cerrar carrito">×</button>
    </div>

    <div class="cart-panel__body">
      <div class="cart-items"></div>
    </div>

    <div class="cart-panel__footer">
      <div class="cart-summary">
        <span>Total</span>
        <strong class="cart-total">$0</strong>
      </div>
      <button type="button" class="cart-checkout">Finalizar compra</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);
}

/* =========================================================
   7. SELECTORES DINÁMICOS DEL CARRITO
   ---------------------------------------------------------
   Estos nodos existen recién después de createCartPanel()
========================================================= */

function getDynamicDOM() {
  return {
    cartOverlay: document.querySelector(".cart-overlay"),
    cartPanel: document.querySelector(".cart-panel"),
    cartItems: document.querySelector(".cart-items"),
    cartTotal: document.querySelector(".cart-total"),
    cartClose: document.querySelector(".cart-close"),
    cartCheckout: document.querySelector(".cart-checkout")
  };
}

/* =========================================================
   8. RENDER DE PRODUCTOS
   ---------------------------------------------------------
   Aprovecha tus .selection-card existentes.
   No rompe la estructura: solo la completa.
========================================================= */

function renderProducts() {
  if (!DOM.selectionCards.length) {
    console.warn("No se encontraron cards de productos en el DOM.");
    return;
  }

  DOM.selectionCards.forEach((card, index) => {
    const product = state.products[index];
    if (!product) return;

    const title = card.querySelector("h3");
    const price = card.querySelector(".selection-price");
    const subtext = card.querySelector(".selection-subtext");
    const imageBox = card.querySelector(".selection-image");

    if (title) title.textContent = product.name;
    if (price) price.textContent = formatPrice(product.price);
    if (subtext) {
      subtext.textContent = `Precio sin impuestos nacionales: ${formatPrice(
        Math.round(calculateNetPrice(product.price))
      )}`;
    }

    // Guardamos data-id para que la delegación de eventos sea simple
    card.dataset.productId = String(product.id);

    // Ajustamos la clase visual de la imagen si corresponde
    if (imageBox) {
      imageBox.classList.remove(
        "placeholder-one",
        "placeholder-two",
        "placeholder-three",
        "placeholder-four"
      );
      imageBox.classList.add(product.imageClass);
    }

    // Si la card todavía no tiene botón, lo agregamos
    let addButton = card.querySelector(".selection-add-btn");

    if (!addButton) {
      addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "selection-add-btn";
      addButton.dataset.action = "add-to-cart";
      addButton.dataset.productId = String(product.id);
      addButton.textContent = "Agregar al carrito";

      // Se agrega al final del bloque info para no romper el layout principal
      const info = card.querySelector(".selection-info");
      if (info) {
        info.appendChild(addButton);
      }
    }
  });
}

/* =========================================================
   9. RENDER DEL CARRITO
========================================================= */

function renderCart() {
  const { cartItems, cartTotal } = getDynamicDOM();

  if (!cartItems || !cartTotal) return;

  if (!state.cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <p>Tu carrito está vacío.</p>
      </div>
    `;
    cartTotal.textContent = formatPrice(0);
    return;
  }

  cartItems.innerHTML = state.cart
    .map(item => {
      return `
        <article class="cart-item" data-product-id="${item.id}">
          <div class="cart-item__info">
            <h3>${item.name}</h3>
            <p>${formatPrice(item.price)}</p>
          </div>

          <div class="cart-item__controls">
            <button type="button" class="cart-qty-btn" data-action="decrease" data-product-id="${item.id}">-</button>
            <span class="cart-item__quantity">${item.quantity}</span>
            <button type="button" class="cart-qty-btn" data-action="increase" data-product-id="${item.id}">+</button>
          </div>

          <div class="cart-item__subtotal">
            ${formatPrice(item.price * item.quantity)}
          </div>

          <button type="button" class="cart-remove-btn" data-action="remove" data-product-id="${item.id}">
            Eliminar
          </button>
        </article>
      `;
    })
    .join("");

  cartTotal.textContent = formatPrice(getCartTotal());
}

/* =========================================================
   10. ACTUALIZACIÓN DE CONTADOR
========================================================= */

function updateCartCount() {
  if (!DOM.cartCount) return;
  DOM.cartCount.textContent = `(${getCartItemsCount()})`;
}

/* =========================================================
   11. REFRESCO GENERAL DE UI
========================================================= */

function refreshCartUI() {
  updateCartCount();
  renderCart();
  saveCart();
}

/* =========================================================
   12. LÓGICA DEL CARRITO
========================================================= */

function addToCart(productId) {
  const product = getProductById(productId);

  if (!product) {
    console.warn(`No se encontró el producto con id ${productId}.`);
    return;
  }

  const existingItem = state.cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: 1
    });
  }

  refreshCartUI();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  refreshCartUI();
}

function increaseQuantity(productId) {
  const item = state.cart.find(product => product.id === productId);
  if (!item) return;

  item.quantity += 1;
  refreshCartUI();
}

function decreaseQuantity(productId) {
  const item = state.cart.find(product => product.id === productId);
  if (!item) return;

  item.quantity -= 1;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  refreshCartUI();
}

/* =========================================================
   13. APERTURA Y CIERRE DEL CARRITO
========================================================= */

function openCart() {
  const { cartOverlay, cartPanel } = getDynamicDOM();
  if (!cartOverlay || !cartPanel) return;

  cartOverlay.hidden = false;
  cartPanel.classList.add("is-open");
  cartPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCart() {
  const { cartOverlay, cartPanel } = getDynamicDOM();
  if (!cartOverlay || !cartPanel) return;

  cartOverlay.hidden = true;
  cartPanel.classList.remove("is-open");
  cartPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

/* =========================================================
   14. EVENTOS
========================================================= */

function handleDocumentClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLElement)) return;

  // Abrir carrito desde el header
  if (target.closest(".cart-link")) {
    event.preventDefault();
    openCart();
    return;
  }

  // Agregar producto al carrito
  const addButton = target.closest('[data-action="add-to-cart"]');
  if (addButton) {
    const productId = Number(addButton.dataset.productId);
    if (!Number.isNaN(productId)) {
      addToCart(productId);
      openCart();
    }
    return;
  }

  // Eliminar producto
  const removeButton = target.closest('[data-action="remove"]');
  if (removeButton) {
    const productId = Number(removeButton.dataset.productId);
    if (!Number.isNaN(productId)) {
      removeFromCart(productId);
    }
    return;
  }

  // Aumentar cantidad
  const increaseButton = target.closest('[data-action="increase"]');
  if (increaseButton) {
    const productId = Number(increaseButton.dataset.productId);
    if (!Number.isNaN(productId)) {
      increaseQuantity(productId);
    }
    return;
  }

  // Disminuir cantidad
  const decreaseButton = target.closest('[data-action="decrease"]');
  if (decreaseButton) {
    const productId = Number(decreaseButton.dataset.productId);
    if (!Number.isNaN(productId)) {
      decreaseQuantity(productId);
    }
    return;
  }

  // Cerrar carrito por botón
  if (target.closest(".cart-close")) {
    closeCart();
    return;
  }

  // Cerrar carrito al hacer click en overlay
  if (target.classList.contains("cart-overlay")) {
    closeCart();
  }
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    closeCart();
  }
}

function handleMenuToggle() {
  if (!DOM.menuToggle || !DOM.mainNav) return;

  const isExpanded = DOM.menuToggle.getAttribute("aria-expanded") === "true";

  DOM.menuToggle.setAttribute("aria-expanded", String(!isExpanded));

  // Como en tu CSS mobile la nav se oculta con display:none,
  // hacemos un toggle inline simple para permitir apertura.
  DOM.mainNav.style.display = isExpanded ? "" : "block";
}

function handleNewsletterSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;

  const emailInput = form.querySelector('input[type="email"]');

  if (!(emailInput instanceof HTMLInputElement)) return;

  const email = emailInput.value.trim();

  if (!email) {
    alert("Por favor, ingresá un email.");
    return;
  }

  // Validación HTML5 básica + refuerzo en JS
  if (!email.includes("@") || !email.includes(".")) {
    alert("Ingresá un email válido.");
    return;
  }

  alert("Gracias por suscribirte al newsletter.");
  form.reset();
}

function bindEvents() {
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleKeydown);

  if (DOM.menuToggle) {
    DOM.menuToggle.addEventListener("click", handleMenuToggle);
  }

  if (DOM.newsletterForm) {
    DOM.newsletterForm.addEventListener("submit", handleNewsletterSubmit);
  }
}

/* =========================================================
   15. ESTILOS MÍNIMOS INYECTADOS PARA EL CARRITO
   ---------------------------------------------------------
   Esto evita tocar tu CSS base si no querés.
   Si preferís, luego lo movés a styles.css.
========================================================= */

function injectCartStyles() {
  if (document.getElementById("cart-panel-styles")) return;

  const style = document.createElement("style");
  style.id = "cart-panel-styles";

  style.textContent = `
    .selection-add-btn {
      margin-top: 1rem;
      width: 100%;
      border: 1px solid #110d0c;
      background-color: #110d0c;
      color: #faf7f1;
      padding: 0.9rem 1rem;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      transition: all 0.3s ease;
    }

    .selection-add-btn:hover {
      background-color: transparent;
      color: #110d0c;
    }

    .cart-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(17, 13, 12, 0.35);
      z-index: 1200;
    }

    .cart-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: min(420px, 100%);
      height: 100vh;
      background-color: #faf7f1;
      z-index: 1300;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
      border-left: 1px solid rgba(17, 13, 12, 0.1);
    }

    .cart-panel.is-open {
      transform: translateX(0);
    }

    .cart-panel__header,
    .cart-panel__footer {
      padding: 1.25rem;
      border-bottom: 1px solid rgba(17, 13, 12, 0.08);
    }

    .cart-panel__footer {
      border-top: 1px solid rgba(17, 13, 12, 0.08);
      border-bottom: none;
      margin-top: auto;
    }

    .cart-panel__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .cart-close {
      border: none;
      background: transparent;
      font-size: 1.8rem;
      cursor: pointer;
      color: #110d0c;
      line-height: 1;
    }

    .cart-panel__body {
      padding: 1.25rem;
      overflow-y: auto;
      flex: 1;
    }

    .cart-item {
      display: grid;
      gap: 0.8rem;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(17, 13, 12, 0.08);
    }

    .cart-item__info h3 {
      font-size: 1rem;
      margin-bottom: 0.25rem;
      color: #110d0c;
    }

    .cart-item__controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cart-qty-btn,
    .cart-remove-btn,
    .cart-checkout {
      cursor: pointer;
    }

    .cart-qty-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #110d0c;
      background: transparent;
      color: #110d0c;
    }

    .cart-remove-btn {
      justify-self: start;
      border: none;
      background: transparent;
      color: #8b5e3c;
      text-decoration: underline;
    }

    .cart-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      color: #110d0c;
    }

    .cart-checkout {
      width: 100%;
      border: 1px solid #110d0c;
      background-color: #110d0c;
      color: #faf7f1;
      padding: 0.95rem 1rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .cart-empty p {
      color: #6c645d;
    }

    body.cart-open {
      overflow: hidden;
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   16. PREPARADO PARA FETCH / ASINCRONÍA
   ---------------------------------------------------------
   Hoy funciona con mock local.
   Mañana podrías reemplazar esto por una llamada HTTP.
========================================================= */

/**
 * Carga de productos local.
 * Hoy devuelve el mock.
 */
async function loadProducts() {
  // Simula una estructura asíncrona real.
  // Esto te permite explicar async/await aunque todavía uses datos locales.
  return Promise.resolve(MOCK_PRODUCTS);
}

/**
 * Ejemplo de cómo quedaría luego con fetch real.
 * NO se ejecuta ahora; queda como referencia didáctica.
 */
/*
async function loadProductsFromAPI() {
  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error("Error al obtener productos");
    }

    const products = await response.json();
    return products;
  } catch (error) {
    console.error(error);
    return [];
  }
}
*/

/* =========================================================
   17. INICIALIZACIÓN
========================================================= */

async function init() {
  try {
    injectCartStyles();
    createCartPanel();

    state.products = await loadProducts();
    loadCart();

    renderProducts();
    refreshCartUI();
    bindEvents();
  } catch (error) {
    console.error("Error al inicializar la app:", error);
  }
}

document.addEventListener("DOMContentLoaded", init);