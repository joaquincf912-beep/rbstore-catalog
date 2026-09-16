/* ==========================================================================
   RBSTORE — CATALOG & INTERACTIVE LOGIC
   ========================================================================== */

const RBSTORE_CONFIG = {
  whatsappNumber: "584120500675",
  adminKey: "2828",
  storageKey: "rbstore_catalog_v41"
};

// INITIAL SHOWCASE CATALOG (In exact order specified by user)
const DEFAULT_PRODUCTS = [
  {
    id: "rb1",
    name: "Cargador de 20w",
    sector: "cargadores",
    price: 15.00,
    oldPrice: 20.00,
    badge: "popular",
    image: "images/cargador_20w.jpg",
    description: "Cargador rápido de 20W USB-C Power Adapter con carga super veloz y protección de voltaje para iPhone y dispositivos compatibles."
  },
  {
    id: "rb2",
    name: "Panel led RGB",
    sector: "iluminacion",
    price: 15.00,
    oldPrice: 22.00,
    badge: "nuevo",
    image: "images/panel_led_rgb.jpg",
    description: "Panel de luz LED RGB de bolsillo (AY-83). Efectos multicolor, rotación 150° y rosca 1/4 para trípode o cámara."
  },
  {
    id: "rb4",
    name: "AirPods Pro 3gen",
    sector: "audifonos",
    price: 25.00,
    oldPrice: 35.00,
    badge: "popular",
    image: "images/airpods_pro_3gen.jpg",
    description: "AirPods Pro de 3ra Generación con Cancelación Activa de Ruido, modo ambiente y estuche de carga magnética."
  },
  {
    id: "rb5",
    name: "AirPods Pro Max",
    sector: "audifonos",
    price: 45.00,
    oldPrice: 65.00,
    badge: "oferta",
    image: "images/airpods_pro_max.jpg",
    description: "Audífonos de diadema premium AirPods Pro Max con audio espacial de alta fidelidad y almohadillas de malla de memoria."
  },
  {
    id: "rb6",
    name: "Panel led sencillo",
    sector: "iluminacion",
    price: 12.00,
    oldPrice: 18.00,
    badge: "",
    image: "images/panel_led_sencillo.jpg",
    description: "Panel de luz LED continua blanca y cálida con difusor suave, batería recargable y soporte universal."
  },
  {
    id: "rb7",
    name: "Balón de futbol americano",
    sector: "varios",
    price: 25.00,
    oldPrice: 35.00,
    badge: "exclusivo",
    image: "images/balon_futbol.jpg",
    description: "Balón de fútbol americano en cuero sintético de alta resistencia, grip antideslizante y costuras reforzadas."
  },
  {
    id: "rb8",
    name: "Cable Lightning - type C",
    sector: "cargadores",
    price: 5.00,
    oldPrice: 8.00,
    badge: "",
    image: "images/cable_lightning_typec.jpg",
    description: "Cable USB-C a Lightning de 1 metro para carga rápida PD de iPhones e iPads con conectores reforzados."
  },
  {
    id: "rb9",
    name: "Cable type C - Type C",
    sector: "cargadores",
    price: 10.00,
    oldPrice: 15.00,
    badge: "",
    image: "images/cable_typec_typec.jpg",
    description: "Cable trenzado USB-C a USB-C de 60W y 1.2m para laptops, tablets y celulares con carga ultra rápida."
  },
  {
    id: "rb10",
    name: "Cargador dynamic 60w",
    sector: "cargadores",
    price: 20.00,
    oldPrice: 28.00,
    badge: "popular",
    image: "images/cargador_dynamic_60w.jpg",
    description: "Cargador rápido Dynamic de 60W con tecnología GaN, doble salida USB-C + USB-A y carga simultánea inteligente."
  },
  {
    id: "rb11",
    name: "MagSafe charger 20w",
    sector: "cargadores",
    price: 15.00,
    oldPrice: 22.00,
    badge: "nuevo",
    image: "images/magsafe_charger_20w.jpg",
    description: "Cargador inalámbrico magnético MagSafe de 20W. Alineación magnética rápida e instantánea para iPhone."
  }
];

// DEFAULT CATEGORIES
const DEFAULT_CATEGORIES = [
  { id: "cargadores", name: "Cargadores & Cables", icon: "⚡" },
  { id: "iluminacion", name: "Iluminación LED", icon: "💡" },
  { id: "audifonos", name: "Audífonos", icon: "🎧" },
  { id: "varios", name: "Artículos Varios", icon: "📦" }
];

// STATE MANAGEMENT
let products = [];
let categories = [];
let currentFilterSector = "todos";
let currentSearchTerm = "";
let selectedProduct = null;
let selectedQuantity = 1;
let isAdminLoggedIn = false;

// DOM READY
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  const remoteOk = await loadRemoteCatalogData();
  if (!remoteOk) {
    loadCategoriesData();
    loadCatalogData();
  }
  renderCategoriesGrid();
  renderSectorOptions();
  renderProductsGrid();
  setupEventListeners();
  setupScrollEffects();
  updateStats();
  
  console.log(`[RBstore] Catálogo cargado: ${products.length} productos, ${categories.length} categorías`);
}

// FETCH REMOTE CATALOG.JSON (Single source of truth for all visitors)
async function loadRemoteCatalogData() {
  try {
    const res = await fetch(`catalog.json?v=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      
      let updated = false;
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        products = data.products;
        localStorage.setItem(RBSTORE_CONFIG.storageKey, JSON.stringify(products));
        DEFAULT_PRODUCTS.length = 0;
        DEFAULT_PRODUCTS.push(...data.products);
        updated = true;
      }
      if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        categories = data.categories;
        localStorage.setItem("rbstore_categories_v2", JSON.stringify(categories));
        DEFAULT_CATEGORIES.length = 0;
        DEFAULT_CATEGORIES.push(...data.categories);
        updated = true;
      }
      
      console.log(`[RBstore] Catálogo remoto sincronizado: ${products.length} productos, ${categories.length} categorías`);
      return updated;
    }
  } catch(e) {
    console.log("[RBstore] Usando catálogo local predeterminado");
  }
  return false;
}

// LOAD CATEGORIES DATA
function loadCategoriesData() {
  const saved = localStorage.getItem("rbstore_categories_v2");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        categories = parsed;
      } else {
        categories = [...DEFAULT_CATEGORIES];
      }
    } catch(e) {
      categories = [...DEFAULT_CATEGORIES];
    }
  } else {
    categories = [...DEFAULT_CATEGORIES];
  }
}

function saveCategoriesData() {
  try {
    localStorage.setItem("rbstore_categories_v2", JSON.stringify(categories));
    autoSyncToCloud();
  } catch(e) {
    console.error("Error saving categories to localStorage", e);
  }
}

// LOAD CATALOG DATA FROM STORAGE OR DEFAULTS
function loadCatalogData() {
  try {
    localStorage.removeItem("rbstore_custom_products");
    localStorage.removeItem("rbstore_custom_products_v2");
    localStorage.removeItem("rbstore_custom_products_v3");
  } catch(e) {}

  const savedData = localStorage.getItem(RBSTORE_CONFIG.storageKey);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        products = parsed;
      } else {
        products = [...DEFAULT_PRODUCTS];
      }
    } catch (e) {
      console.error("Error parsing saved catalog data", e);
      products = [...DEFAULT_PRODUCTS];
    }
  } else {
    products = [...DEFAULT_PRODUCTS];
  }

  if (!products || products.length === 0) {
    products = [...DEFAULT_PRODUCTS];
  }
}

function saveCatalogData() {
  try {
    localStorage.setItem(RBSTORE_CONFIG.storageKey, JSON.stringify(products));
    autoSyncToCloud();
  } catch(e) {
    console.error("Error saving catalog to localStorage", e);
    showToast("Advertencia: No se pudo guardar en almacenamiento local");
  }
}

// DYNAMIC CATEGORIES GRID RENDERER
function renderCategoriesGrid() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;

  grid.innerHTML = "";

  // 1. "Todos" Card
  const todosCard = document.createElement("button");
  todosCard.className = `cat-card ${currentFilterSector === 'todos' ? 'active' : ''}`;
  todosCard.setAttribute("data-category", "todos");
  todosCard.innerHTML = `
    <div class="cat-card__icon">🔥</div>
    <div class="cat-card__name">Todos</div>
    <div class="cat-card__count">${products.length} productos</div>
  `;
  todosCard.addEventListener("click", () => handleCategoryClick("todos", todosCard));
  grid.appendChild(todosCard);

  // 2. Render each Category
  categories.forEach(cat => {
    const count = products.filter(p => p.sector === cat.id).length;
    const card = document.createElement("button");
    card.className = `cat-card ${currentFilterSector === cat.id ? 'active' : ''}`;
    card.setAttribute("data-category", cat.id);
    card.innerHTML = `
      <div class="cat-card__icon">${cat.icon || '📦'}</div>
      <div class="cat-card__name">${cat.name}</div>
      <div class="cat-card__count">${count} productos</div>
    `;
    card.addEventListener("click", () => handleCategoryClick(cat.id, card));
    grid.appendChild(card);
  });
}

function handleCategoryClick(sectorId, cardElement) {
  const grid = document.getElementById("categoriesGrid");
  if (grid) {
    grid.querySelectorAll(".cat-card").forEach(c => c.classList.remove("active"));
  }
  cardElement.classList.add("active");
  currentFilterSector = sectorId;
  renderProductsGrid();

  const prodSection = document.getElementById("catalogo");
  if (prodSection) prodSection.scrollIntoView({ behavior: "smooth" });
}

// DYNAMIC SECTOR SELECTOR FOR ADD/EDIT FORM
function renderSectorOptions() {
  const select = document.getElementById("prodSector");
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = "";

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = `${cat.icon || '📦'} ${cat.name}`;
    select.appendChild(option);
  });

  if (currentVal && categories.some(c => c.id === currentVal)) {
    select.value = currentVal;
  }
}

// ═══════════════════════════════════════════════
// RENDER PRODUCTS GRID — uses correct BEM classes
// ═══════════════════════════════════════════════
function renderProductsGrid() {
  const grid = document.getElementById("productsGrid");
  const emptyState = document.getElementById("emptyState");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = products.filter(product => {
    const matchesSector = currentFilterSector === "todos" || product.sector === currentFilterSector;
    const matchesSearch = !currentSearchTerm || 
      product.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      product.sector.toLowerCase().includes(currentSearchTerm.toLowerCase());
    
    return matchesSector && matchesSearch;
  });

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = "block";
  } else {
    if (emptyState) emptyState.style.display = "none";
    
    filtered.forEach((product, idx) => {
      const card = createProductCard(product, idx);
      grid.appendChild(card);
    });
  }
}

// CREATE PRODUCT CARD — matches style.css BEM classes
function createProductCard(product, index) {
  const card = document.createElement("div");
  card.className = "product-card show";
  card.setAttribute("data-category", product.sector);
  card.style.animationDelay = `${index * 0.05}s`;

  // Badge
  let badgeLabel = "";
  let badgeClass = "";
  if (product.badge === "popular") { badgeLabel = "Más Vendido"; badgeClass = "product-card__badge--hot"; }
  else if (product.badge === "nuevo") { badgeLabel = "Nuevo"; badgeClass = "product-card__badge--new"; }
  else if (product.badge === "oferta") { badgeLabel = "Oferta"; badgeClass = "product-card__badge--sale"; }
  else if (product.badge === "exclusivo") { badgeLabel = "Exclusivo"; badgeClass = "product-card__badge--hot"; }
  else if (product.badge === "agotado") { badgeLabel = "Agotado"; badgeClass = "product-card__badge--soldout"; }

  const badgeHtml = badgeLabel ? `<span class="product-card__badge ${badgeClass}">${badgeLabel}</span>` : "";

  // Prices
  const formattedPrice = `$${Number(product.price).toFixed(0)}`;
  const oldPriceHtml = product.oldPrice ? `<span class="product-card__price-old">$${Number(product.oldPrice).toFixed(0)}</span>` : "";

  // WhatsApp link
  const waText = encodeURIComponent(`¡Hola RBstore! Estoy interesado en *${product.name}* (Precio: $${Number(product.price).toFixed(2)}). ¿Tienen disponibilidad?`);
  const waUrl = `https://wa.me/${RBSTORE_CONFIG.whatsappNumber}?text=${waText}`;

  card.innerHTML = `
    ${badgeHtml}
    <div class="product-card__img" onclick="openProductModal('${product.id}')">
      <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'">
      <div class="product-card__img-overlay"></div>
    </div>
    <div class="product-card__body">
      <div class="product-card__category">${getSectorLabel(product.sector)}</div>
      <h3 class="product-card__name" onclick="openProductModal('${product.id}')" style="cursor:pointer;">${product.name}</h3>
      <p class="product-card__desc">${product.description}</p>
      <div class="product-card__footer">
        <div class="product-card__price-box">
          <span class="product-card__price">${formattedPrice}</span>
          ${oldPriceHtml}
        </div>
        <a href="${waUrl}" target="_blank" rel="noopener" class="product-card__whatsapp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Pedir
        </a>
      </div>
    </div>
  `;

  return card;
}

// SECTOR UTILITY
function getSectorLabel(sectorKey) {
  const cat = categories.find(c => c.id === sectorKey);
  if (cat) return cat.name;

  const map = {
    cargadores: "Cargadores & Cables",
    iluminacion: "Iluminación LED",
    audifonos: "Audífonos",
    varios: "Artículos Varios"
  };
  return map[sectorKey] || "Tecnología";
}

// ═══════════════════════════════════════════════
// EVENT LISTENERS SETUP
// ═══════════════════════════════════════════════
function setupEventListeners() {
  // Mobile Menu Toggle
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const navCta = document.getElementById("navCta");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("active");
      navLinks.classList.toggle("open");
      if (navCta) navCta.classList.toggle("open");
    });

    const closeNav = () => {
      navToggle.classList.remove("active");
      navLinks.classList.remove("open");
      if (navCta) navCta.classList.remove("open");
    };

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeNav);
    });
    if (navCta) navCta.addEventListener("click", closeNav);
  }

  // Real-time synchronization across tabs
  window.addEventListener("storage", (e) => {
    if (e.key === RBSTORE_CONFIG.storageKey || e.key === "rbstore_categories_v2") {
      loadCategoriesData();
      loadCatalogData();
      renderCategoriesGrid();
      renderSectorOptions();
      renderProductsGrid();
      if (isAdminLoggedIn) renderAdminProductsTable();
      updateStats();
    }
  });

  // Search Input
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchTerm = e.target.value;
      if (clearSearchBtn) clearSearchBtn.style.display = currentSearchTerm ? "block" : "none";
      renderProductsGrid();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      currentSearchTerm = "";
      clearSearchBtn.style.display = "none";
      renderProductsGrid();
    });
  }

  // Reset Filter Button
  const btnResetFilter = document.getElementById("btnResetFilter");
  if (btnResetFilter) {
    btnResetFilter.addEventListener("click", () => {
      currentFilterSector = "todos";
      currentSearchTerm = "";
      if (searchInput) searchInput.value = "";
      if (clearSearchBtn) clearSearchBtn.style.display = "none";

      categoryCards.forEach(c => c.classList.remove("active"));
      document.querySelector('.cat-card[data-category="todos"]')?.classList.add("active");

      renderProductsGrid();
    });
  }

  // Product Modal
  document.getElementById("modalClose")?.addEventListener("click", closeProductModal);
  document.getElementById("productModalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "productModalOverlay") closeProductModal();
  });

  document.getElementById("qtyMinus")?.addEventListener("click", () => {
    if (selectedQuantity > 1) {
      selectedQuantity--;
      updateModalTotal();
    }
  });

  document.getElementById("qtyPlus")?.addEventListener("click", () => {
    selectedQuantity++;
    updateModalTotal();
  });

  // Admin Modal
  document.getElementById("adminClose")?.addEventListener("click", closeAdminModal);
  document.getElementById("adminOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "adminOverlay") closeAdminModal();
  });

  document.getElementById("btnShowAddProduct")?.addEventListener("click", showAddProductForm);
  document.getElementById("btnCancelForm")?.addEventListener("click", hideProductForm);
  document.getElementById("productForm")?.addEventListener("submit", handleProductFormSubmit);
  document.getElementById("btnResetDefaultCatalog")?.addEventListener("click", resetDefaultCatalog);
  document.getElementById("btnToggleCategoryForm")?.addEventListener("click", toggleAddCategoryForm);
  document.getElementById("categoryForm")?.addEventListener("submit", handleCategoryFormSubmit);
}

// ═══════════════════════════════════════════════
// SCROLL EFFECTS (header, reveal, scroll-to-top)
// ═══════════════════════════════════════════════
function setupScrollEffects() {
  const header = document.getElementById("header");
  const scrollTopBtn = document.getElementById("scrollTop");

  // Scroll listener for header shrink + scroll-to-top
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    
    if (header) {
      header.classList.toggle("scrolled", scrollY > 60);
    }
    
    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle("visible", scrollY > 400);
    }
  });

  // Scroll-to-top button
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Secret admin trigger: triple-click logo
  const logo = document.querySelector(".header__logo");
  let clickCount = 0;
  let clickTimer = null;
  if (logo) {
    logo.addEventListener("click", (e) => {
      e.preventDefault();
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 600);
      
      if (clickCount >= 3) {
        clickCount = 0;
        triggerAdminModal();
      }
    });
  }
}

// ═══════════════════════════════════════════════
// PRODUCT DETAIL MODAL
// ═══════════════════════════════════════════════
function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  selectedProduct = product;
  selectedQuantity = 1;

  document.getElementById("modalProductImage").src = product.image;
  document.getElementById("modalProductCategory").innerText = getSectorLabel(product.sector);
  document.getElementById("modalProductTitle").innerText = product.name;
  document.getElementById("modalProductDesc").innerText = product.description;
  document.getElementById("modalProductPrice").innerText = `$${Number(product.price).toFixed(2)}`;

  const oldPriceEl = document.getElementById("modalProductOldPrice");
  if (product.oldPrice) {
    oldPriceEl.innerText = `$${Number(product.oldPrice).toFixed(2)}`;
    oldPriceEl.style.display = "inline";
  } else {
    oldPriceEl.style.display = "none";
  }

  const badgeEl = document.getElementById("modalProductBadge");
  if (product.badge) {
    badgeEl.style.display = "inline-block";
    let badgeLabel = "Destacado";
    if (product.badge === "popular") badgeLabel = "Más Vendido";
    if (product.badge === "nuevo") badgeLabel = "Nuevo";
    if (product.badge === "oferta") badgeLabel = "Oferta";
    if (product.badge === "exclusivo") badgeLabel = "Exclusivo";
    if (product.badge === "agotado") badgeLabel = "Agotado";
    badgeEl.innerText = badgeLabel;
  } else {
    badgeEl.style.display = "none";
  }

  updateModalTotal();

  const overlay = document.getElementById("productModalOverlay");
  if (overlay) {
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeProductModal() {
  const overlay = document.getElementById("productModalOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function updateModalTotal() {
  if (!selectedProduct) return;
  document.getElementById("qtyValue").innerText = selectedQuantity;
  const total = (Number(selectedProduct.price) * selectedQuantity).toFixed(2);
  document.getElementById("modalTotalPrice").innerText = `$${total}`;

  const orderBtn = document.getElementById("btnModalOrder");
  if (orderBtn) {
    const message = `¡Hola RBstore! Quisiera pedir el producto:\n- *${selectedProduct.name}*\n- Cantidad: ${selectedQuantity}\n- Precio Total: $${total}\n\nUbicación: Centro comercial central, planta baja Local 10`;
    orderBtn.href = `https://wa.me/${RBSTORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
}

// ═══════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════
function openAdminModal() {
  triggerAdminModal();
}
window.openAdminModal = openAdminModal;

function triggerAdminModal() {
  const overlay = document.getElementById("adminOverlay");
  if (!overlay) return;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  if (isAdminLoggedIn) {
    document.getElementById("adminLoginView").style.display = "none";
    document.getElementById("adminDashboardView").style.display = "block";
    renderAdminProductsTable();
  } else {
    document.getElementById("adminLoginView").style.display = "block";
    document.getElementById("adminDashboardView").style.display = "none";
    document.getElementById("adminPassInput").value = "";
    document.getElementById("adminLoginError").style.display = "none";
  }
}

function closeAdminModal() {
  const overlay = document.getElementById("adminOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function submitAdminLogin() {
  const passInput = document.getElementById("adminPassInput").value.trim();
  const errorEl = document.getElementById("adminLoginError");

  if (passInput === RBSTORE_CONFIG.adminKey) {
    isAdminLoggedIn = true;
    errorEl.style.display = "none";
    document.getElementById("adminLoginView").style.display = "none";
    document.getElementById("adminDashboardView").style.display = "block";
    renderAdminProductsTable();
    showToast("¡Bienvenido al Panel Admin de RBstore!");
  } else {
    errorEl.style.display = "block";
  }
}

function renderAdminProductsTable() {
  const tbody = document.getElementById("adminProductsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  products.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${p.image}" alt="${p.name}" class="admin-table-img"></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="sector-pill">${getSectorLabel(p.sector)}</span></td>
      <td>$${Number(p.price).toFixed(2)}</td>
      <td>
        <div class="admin-actions-cell">
          <button class="btn-action-edit" onclick="editProduct('${p.id}')">Editar</button>
          <button class="btn-action-delete" onclick="deleteProduct('${p.id}')">Eliminar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function showAddProductForm() {
  renderSectorOptions();
  const container = document.getElementById("adminFormContainer");
  const form = document.getElementById("productForm");
  document.getElementById("formTitle").innerText = "Agregar Nuevo Producto";
  document.getElementById("editProductId").value = "";
  form.reset();
  container.style.display = "block";
}

function hideProductForm() {
  document.getElementById("adminFormContainer").style.display = "none";
}

function editProduct(productId) {
  const p = products.find(item => item.id === productId);
  if (!p) return;

  renderSectorOptions();
  showAddProductForm();
  document.getElementById("formTitle").innerText = `Editar Producto #${p.id}`;
  document.getElementById("editProductId").value = p.id;
  document.getElementById("prodName").value = p.name;
  document.getElementById("prodSector").value = p.sector;
  document.getElementById("prodPrice").value = p.price;
  document.getElementById("prodOldPrice").value = p.oldPrice || "";
  document.getElementById("prodBadge").value = p.badge || "";
  document.getElementById("prodImage").value = p.image;
  document.getElementById("prodDesc").value = p.description;

  document.getElementById("adminFormContainer").scrollIntoView({ behavior: "smooth" });
}

function handleImageFileUpload(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    showToast("Procesando y optimizando imagen...");
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        try {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to lightweight JPEG Base64
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.80);
          document.getElementById("prodImage").value = compressedDataUrl;
          showToast("Foto optimizada y cargada instantáneamente");
        } catch(err) {
          document.getElementById("prodImage").value = e.target.result;
          showToast("Foto cargada con éxito");
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById("editProductId").value;

  const newProd = {
    id: editId || `rb_${Date.now()}`,
    name: document.getElementById("prodName").value.trim(),
    sector: document.getElementById("prodSector").value,
    price: parseFloat(document.getElementById("prodPrice").value),
    oldPrice: document.getElementById("prodOldPrice").value ? parseFloat(document.getElementById("prodOldPrice").value) : null,
    badge: document.getElementById("prodBadge").value || null,
    image: document.getElementById("prodImage").value.trim(),
    description: document.getElementById("prodDesc").value.trim()
  };

  if (editId) {
    const idx = products.findIndex(p => p.id === editId);
    if (idx !== -1) products[idx] = newProd;
    showToast("Producto actualizado con éxito");
  } else {
    products.unshift(newProd);
    showToast("Nuevo producto agregado al catálogo");
  }

  saveCatalogData();
  renderProductsGrid();
  renderAdminProductsTable();
  hideProductForm();
  updateStats();
}

function deleteProduct(productId) {
  if (confirm("¿Estás seguro de eliminar este producto del catálogo?")) {
    products = products.filter(p => p.id !== productId);
    saveCatalogData();
    renderProductsGrid();
    renderAdminProductsTable();
    updateStats();
    showToast("Producto eliminado del catálogo");
  }
}

function resetDefaultCatalog() {
  if (confirm("¿Deseas restablecer el catálogo a los productos y categorías iniciales de RBstore?")) {
    products = [...DEFAULT_PRODUCTS];
    categories = [...DEFAULT_CATEGORIES];
    saveCatalogData();
    saveCategoriesData();
    currentFilterSector = "todos";
    renderCategoriesGrid();
    renderSectorOptions();
    renderProductsGrid();
    renderAdminProductsTable();
    updateStats();
    showToast("Catálogo restablecido por defecto");
  }
}

// ═══════════════════════════════════════════════
// CATEGORY MANAGEMENT FOR OWNER ADMIN PANEL
// ═══════════════════════════════════════════════
function toggleAddCategoryForm() {
  const container = document.getElementById("adminCategoryFormContainer");
  if (!container) return;
  const isHidden = container.style.display === "none";
  container.style.display = isHidden ? "block" : "none";
  if (isHidden) {
    renderAdminCategoriesList();
  }
}

function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById("newCatName");
  const iconInput = document.getElementById("newCatIcon");
  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) return;

  const icon = iconInput ? (iconInput.value.trim() || "📦") : "📦";
  const id = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_");

  if (categories.some(c => c.id === id)) {
    showToast("Esta categoría ya existe");
    return;
  }

  categories.push({ id, name, icon });
  saveCategoriesData();

  renderCategoriesGrid();
  renderSectorOptions();
  renderAdminCategoriesList();
  renderProductsGrid();
  renderAdminProductsTable();
  updateStats();

  nameInput.value = "";
  if (iconInput) iconInput.value = "";
  showToast(`Categoría "${name}" creada con éxito!`);
}

function renderAdminCategoriesList() {
  const container = document.getElementById("adminCategoriesList");
  if (!container) return;

  let html = "";
  categories.forEach(cat => {
    html += `
      <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 50px; font-size: 0.8rem; color: var(--text-primary);">
        <span>${cat.icon || '📦'} ${cat.name}</span>
        <button onclick="deleteCategory('${cat.id}')" title="Eliminar categoría" style="background:none; border:none; color: #ef4444; font-weight: bold; cursor: pointer; padding: 0 4px; font-size: 0.95rem; line-height:1;">&times;</button>
      </span>
    `;
  });
  container.innerHTML = html;
}

function deleteCategory(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;

  if (categories.length <= 1) {
    showToast("No puedes eliminar la última categoría");
    return;
  }

  if (confirm(`¿Seguro que deseas eliminar la categoría "${cat.name}"? Los productos asignados serán reasignados.`)) {
    categories = categories.filter(c => c.id !== catId);
    
    // Re-assign products to the first remaining category
    const fallbackId = categories[0].id;
    products.forEach(p => {
      if (p.sector === catId) p.sector = fallbackId;
    });

    saveCategoriesData();
    saveCatalogData();

    renderCategoriesGrid();
    renderSectorOptions();
    renderAdminCategoriesList();
    renderProductsGrid();
    renderAdminProductsTable();
    updateStats();

    showToast(`Categoría "${cat.name}" eliminada`);
  }
}

// UPDATE STATS & COUNTER ANIMATION
function updateStats() {
  const countEl = document.getElementById("stat-productos");
  if (countEl) countEl.innerText = products.length;

  updateCategoryCounts();

  const counters = document.querySelectorAll("[data-count]");
  counters.forEach(el => {
    const target = parseInt(el.getAttribute("data-count"));
    if (!target) return;
    const isBig = target > 50;
    const duration = 1200;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * target);
      el.innerText = isBig ? `${current}+` : `${current}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.innerText = isBig ? `${target}+` : `${target}`;
      }
    }
    requestAnimationFrame(step);
  });
}

function updateCategoryCounts() {
  // Build counts dynamically for ALL categories
  const counts = { todos: products.length };
  categories.forEach(cat => {
    counts[cat.id] = products.filter(p => p.sector === cat.id).length;
  });

  document.querySelectorAll(".cat-card").forEach(card => {
    const cat = card.getAttribute("data-category");
    const countEl = card.querySelector(".cat-card__count");
    if (countEl) {
      const num = counts[cat] !== undefined ? counts[cat] : 0;
      countEl.innerText = `${num} ${num === 1 ? 'producto' : 'productos'}`;
    }
  });
}

// TOAST NOTIFICATIONS
function showToast(message) {
  const toast = document.getElementById("toastNotification");
  const msgEl = document.getElementById("toastMessage");
  if (!toast || !msgEl) return;

  msgEl.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// GLOBAL WINDOW EXPORTS FOR INLINE ONCLICK HANDLERS
window.toggleAddCategoryForm = toggleAddCategoryForm;
window.handleCategoryFormSubmit = handleCategoryFormSubmit;
window.deleteCategory = deleteCategory;
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.submitAdminLogin = submitAdminLogin;
window.showAddProductForm = showAddProductForm;
window.hideProductForm = hideProductForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.handleImageFileUpload = handleImageFileUpload;

// ═══════════════════════════════════════════════
// CATALOG EXPORT / IMPORT / COPY FUNCTIONS
// ═══════════════════════════════════════════════

// Export: downloads current catalog as a JSON file
function exportCatalogData() {
  const data = {
    categories: categories,
    products: products,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rbstore_catalog_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Catálogo exportado como archivo JSON");
}

// Import: triggers file picker
function triggerImportCatalog() {
  document.getElementById("importFileInput").click();
}

// Import: reads uploaded JSON file and applies it
function handleImportCatalogFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);

      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        products = data.products;
        saveCatalogData();
      }
      if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        categories = data.categories;
        saveCategoriesData();
      }

      renderCategoriesGrid();
      renderSectorOptions();
      renderProductsGrid();
      renderAdminProductsTable();
      updateStats();
      showToast(`Catálogo importado: ${products.length} productos, ${categories.length} categorías`);
    } catch(err) {
      showToast("Error: El archivo no es un JSON válido de catálogo");
      console.error("Import error:", err);
    }
  };
  reader.readAsText(file);
  input.value = ""; // reset so same file can be re-imported
}

// Copy: copies current catalog JSON to clipboard (for updating catalog.json in GitHub)
function copyCatalogJSONToClipboard() {
  const data = {
    categories: categories,
    products: products.map(p => {
      // Strip base64 images from clipboard copy to keep it manageable
      const clean = { ...p };
      if (clean.image && clean.image.startsWith("data:")) {
        clean.image = "images/" + clean.name.toLowerCase().replace(/[^a-z0-9]/g, "_") + ".jpg";
      }
      return clean;
    }),
    exportedAt: new Date().toISOString()
  };
  const jsonStr = JSON.stringify(data, null, 2);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      showToast("Datos del catálogo copiados al portapapeles ✓");
    }).catch(() => {
      fallbackCopyToClipboard(jsonStr);
    });
  } else {
    fallbackCopyToClipboard(jsonStr);
  }
}

function fallbackCopyToClipboard(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    showToast("Datos del catálogo copiados al portapapeles ✓");
  } catch(err) {
    showToast("No se pudo copiar. Usa Exportar en su lugar.");
  }
  document.body.removeChild(ta);
}

window.exportCatalogData = exportCatalogData;
window.triggerImportCatalog = triggerImportCatalog;
window.handleImportCatalogFile = handleImportCatalogFile;
window.copyCatalogJSONToClipboard = copyCatalogJSONToClipboard;

// ═══════════════════════════════════════════════
// AUTO-SYNC TO GITHUB PAGES CLOUD
// ═══════════════════════════════════════════════
function toggleAutoSyncConfig() {
  const container = document.getElementById("adminAutoSyncContainer");
  if (!container) return;
  const isHidden = container.style.display === "none";
  container.style.display = isHidden ? "block" : "none";
  
  if (isHidden) {
    updateAutoSyncStatusUI();
  }
}

function saveGitHubToken() {
  const input = document.getElementById("ghTokenInput");
  if (!input || !input.value.trim()) {
    showToast("Ingresa un Token válido de GitHub");
    return;
  }
  const token = input.value.trim();
  localStorage.setItem("rbstore_gh_token", token);
  showToast("Token de GitHub guardado ✓");
  updateAutoSyncStatusUI();
  autoSyncToCloud(true);
}

function removeGitHubToken() {
  localStorage.removeItem("rbstore_gh_token");
  const input = document.getElementById("ghTokenInput");
  if (input) input.value = "";
  showToast("Token de GitHub eliminado");
  updateAutoSyncStatusUI();
}

function updateAutoSyncStatusUI() {
  const statusDiv = document.getElementById("autoSyncStatusMsg");
  const token = localStorage.getItem("rbstore_gh_token");
  if (!statusDiv) return;
  
  if (token) {
    const hidden = "ghp_••••" + token.slice(-4);
    statusDiv.innerHTML = `<span style="color: #4ade80; font-weight: bold;">● Sincronización Automática ACTIVA (${hidden})</span> — Cada cambio que hagas se publicará inmediatamente para todos los usuarios.`;
  } else {
    statusDiv.innerHTML = `<span style="color: #f87171; font-weight: bold;">○ Sin conectar</span> — Pega tu GitHub Personal Access Token (con permisos de <code>repo</code>) para activar la sincronización automática en vivo.`;
  }
}

async function autoSyncToCloud(forceNotify = false) {
  const token = localStorage.getItem("rbstore_gh_token");
  if (!token) return;

  try {
    const repoOwner = "joaquincf912-beep";
    const repoName = "rbstore-catalog";
    const filePath = "catalog.json";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (!getRes.ok) {
      console.error("Error obteniendo SHA de catalog.json en GitHub", await getRes.text());
      if (forceNotify) showToast("❌ Token inválido o sin permisos para el repositorio");
      return;
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;

    const catalogObj = {
      categories: categories,
      products: products,
      exportedAt: new Date().toISOString()
    };

    const jsonString = JSON.stringify(catalogObj, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "auto-update catalog from owner admin panel",
        content: base64Content,
        sha: sha
      })
    });

    if (putRes.ok) {
      showToast("⚡ ¡Cambios sincronizados en vivo para todos!");
    } else {
      console.error("Error guardando en GitHub", await putRes.text());
      if (forceNotify) showToast("⚠️ Error actualizando catálogo en GitHub");
    }
  } catch(err) {
    console.error("Error en autoSyncToCloud", err);
  }
}

window.toggleAutoSyncConfig = toggleAutoSyncConfig;
window.saveGitHubToken = saveGitHubToken;
window.removeGitHubToken = removeGitHubToken;
