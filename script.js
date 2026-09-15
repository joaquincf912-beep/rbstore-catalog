/* ==========================================================================
   RBSTORE — CATALOG & INTERACTIVE LOGIC
   ========================================================================== */

const RBSTORE_CONFIG = {
  whatsappNumber: "584120500675",
  adminKey: "2828",
  storageKey: "rbstore_custom_products_v3"
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
    id: "rb3",
    name: "Panel led RGB",
    sector: "iluminacion",
    price: 15.00,
    oldPrice: 20.00,
    badge: "popular",
    image: "images/panel_led_rgb.jpg",
    description: "Panel LED RGB profesional con control de brillo y temperatura de color (2500K-9000K) para streaming y videos."
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

// STATE MANAGEMENT
let products = [];
let currentFilterSector = "todos";
let currentSearchTerm = "";
let selectedProduct = null;
let selectedQuantity = 1;
let isAdminLoggedIn = false;

// DOM ELEMENTS
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  loadCatalogData();
  renderProductsGrid();
  setupEventListeners();
  updateStats();
}

// LOAD CATALOG DATA FROM STORAGE OR DEFAULTS
function loadCatalogData() {
  const savedData = localStorage.getItem(RBSTORE_CONFIG.storageKey);
  if (savedData) {
    try {
      products = JSON.parse(savedData);
    } catch (e) {
      console.error("Error parsing saved catalog data", e);
      products = [...DEFAULT_PRODUCTS];
    }
  } else {
    products = [...DEFAULT_PRODUCTS];
  }
}

function saveCatalogData() {
  localStorage.setItem(RBSTORE_CONFIG.storageKey, JSON.stringify(products));
}

// RENDER PRODUCTS GRID
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
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
    
    filtered.forEach((product, idx) => {
      const card = createProductCard(product, idx);
      grid.appendChild(card);
    });
  }
}

// CREATE PRODUCT CARD HTML
function createProductCard(product, index) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.style.animationDelay = `${index * 0.05}s`;

  let badgeLabel = "";
  if (product.badge === "popular") badgeLabel = "Más Vendido";
  else if (product.badge === "nuevo") badgeLabel = "Nuevo";
  else if (product.badge === "oferta") badgeLabel = "Oferta";
  else if (product.badge === "exclusivo") badgeLabel = "Exclusivo";

  const formattedPrice = `$${Number(product.price).toFixed(2)}`;
  const oldPriceHtml = product.oldPrice ? `<span class="price-old">$${Number(product.oldPrice).toFixed(2)}</span>` : "";
  const badgeHtml = badgeLabel ? `<span class="product-badge badge-${product.badge}">${badgeLabel}</span>` : "";

  const waText = encodeURIComponent(`¡Hola RBstore! Estoy interesado en *${product.name}* (Precio: ${formattedPrice}). ¿Tienen disponibilidad?`);
  const waUrl = `https://wa.me/${RBSTORE_CONFIG.whatsappNumber}?text=${waText}`;

  card.innerHTML = `
    <div class="product-media" onclick="openProductModal('${product.id}')">
      ${badgeHtml}
      <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='images/hero_banner.jpg'">
      <div class="product-quick-overlay">
        <span>Ver Detalles</span>
      </div>
    </div>

    <div class="product-info">
      <span class="product-sector-tag">${getSectorLabel(product.sector)}</span>
      <h3 class="product-name" onclick="openProductModal('${product.id}')">${product.name}</h3>
      <p class="product-desc">${product.description}</p>
      
      <div class="product-footer">
        <div class="product-price-block">
          <span class="price-current">${formattedPrice}</span>
          ${oldPriceHtml}
        </div>
        
        <div class="product-card-actions">
          <button class="btn-card-detail" onclick="openProductModal('${product.id}')">
            Detalles
          </button>
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-card-wa" title="Pedir por WhatsApp">
            <svg viewBox="0 0 24 24" class="svg-icon"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
        </div>
      </div>
    </div>
  `;

  return card;
}

// SECTOR UTILITY
function getSectorLabel(sectorKey) {
  const map = {
    cargadores: "Cargadores",
    iluminacion: "Iluminación LED",
    audifonos: "Audífonos",
    accesorios: "Accesorios Varios"
  };
  return map[sectorKey] || "Tecnología";
}

// EVENT LISTENERS SETUP
function setupEventListeners() {
  // Mobile Menu Toggle
  const toggle = document.getElementById("mobileMenuToggle");
  const navMenu = document.getElementById("navMenu");
  if (toggle && navMenu) {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        toggle.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }

  // Sector Cards Filter
  const sectorCards = document.querySelectorAll(".sector-card");
  sectorCards.forEach(card => {
    card.addEventListener("click", () => {
      sectorCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      
      currentFilterSector = card.getAttribute("data-sector");
      updateFilterStatusBar();
      renderProductsGrid();

      const prodSection = document.getElementById("productos");
      if (prodSection) prodSection.scrollIntoView({ behavior: "smooth" });
    });
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

      sectorCards.forEach(c => c.classList.remove("active"));
      document.querySelector('.sector-card[data-sector="todos"]')?.classList.add("active");

      updateFilterStatusBar();
      renderProductsGrid();
    });
  }

  // Modal Close & Quantity Controls
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

  // Admin Modal Close & Listeners
  document.getElementById("adminClose")?.addEventListener("click", closeAdminModal);
  document.getElementById("adminOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "adminOverlay") closeAdminModal();
  });

  document.getElementById("btnShowAddProduct")?.addEventListener("click", showAddProductForm);
  document.getElementById("btnCancelForm")?.addEventListener("click", hideProductForm);
  document.getElementById("productForm")?.addEventListener("submit", handleProductFormSubmit);
  document.getElementById("btnResetDefaultCatalog")?.addEventListener("click", resetDefaultCatalog);
}

// FILTER STATUS BAR UPDATE
function updateFilterStatusBar() {
  const statusBar = document.getElementById("filterStatusBar");
  const statusText = document.getElementById("filterStatusText");
  if (!statusBar || !statusText) return;

  if (currentFilterSector !== "todos") {
    statusBar.style.display = "flex";
    statusText.innerText = `Mostrando categoría: ${getSectorLabel(currentFilterSector)}`;
  } else {
    statusBar.style.display = "none";
  }
}

// PRODUCT DETAIL MODAL
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
    const message = `¡Hola RBstore! Quisiera pedir el producto:\n- *${selectedProduct.name}*\n- Cantidad: ${selectedQuantity}\n- Precio Total: $${total}\n\n📍 Ubicación: Centro comercial central, planta baja Local 10`;
    orderBtn.href = `https://wa.me/${RBSTORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
}

// SECRET ADMIN MODAL LOGIC (Password: 2828)
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
  if (confirm("¿Deseas restablecer el catálogo a los 4 productos iniciales de RBstore?")) {
    products = [...DEFAULT_PRODUCTS];
    saveCatalogData();
    renderProductsGrid();
    renderAdminProductsTable();
    updateStats();
    showToast("Catálogo restablecido por defecto");
  }
}

// UPDATE STATS
function updateStats() {
  const countEl = document.getElementById("stat-productos");
  if (countEl) countEl.innerText = products.length;
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
