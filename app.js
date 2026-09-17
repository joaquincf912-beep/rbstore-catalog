/* ==========================================================================
   RBSTORE — CATALOG & INTERACTIVE LOGIC (FIREBASE V10 INTEGRATED)
   ========================================================================== */

import { initFirebaseSDK } from "./firebase-config.js";

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
let cloudUser = null; // usuario de Firebase Auth (necesario para publicar en la nube)
let firestoreProductsLoaded = false;
let firestoreCategoriesLoaded = false;

// BULLETPROOF STRING HELPERS (GUARDS AGAINST NULL / UNDEFINED / NON-STRING ERRORS)
function safeStr(val) {
  if (val === null || val === undefined) return "";
  return String(val).toLowerCase().trim();
}

// DELETED ITEMS TRACKER (PREVENTS DELETED BASE PRODUCTS/CATEGORIES FROM REAPPEARING)
function getDeletedProductIds() {
  try {
    const saved = localStorage.getItem("rbstore_deleted_product_ids");
    return saved ? JSON.parse(saved) : [];
  } catch(e) { return []; }
}

function addDeletedProductId(id, name) {
  try {
    const list = getDeletedProductIds();
    if (id && !list.includes(String(id))) list.push(String(id));
    if (name && !list.includes(safeStr(name))) list.push(safeStr(name));
    localStorage.setItem("rbstore_deleted_product_ids", JSON.stringify(list));
  } catch(e) {}
}

function getDeletedCategoryIds() {
  try {
    const saved = localStorage.getItem("rbstore_deleted_category_ids");
    return saved ? JSON.parse(saved) : [];
  } catch(e) { return []; }
}

function addDeletedCategoryId(id, name) {
  try {
    const list = getDeletedCategoryIds();
    if (id && !list.includes(String(id))) list.push(String(id));
    if (name && !list.includes(safeStr(name))) list.push(safeStr(name));
    localStorage.setItem("rbstore_deleted_category_ids", JSON.stringify(list));
  } catch(e) {}
}

// ═══════════════════════════════════════════════
// COLA DE PENDIENTES — ningún cambio se pierde si la nube falla
// ═══════════════════════════════════════════════
const PENDING_PRODUCTS_KEY = "rbstore_pending_products";
const PENDING_DELETES_KEY = "rbstore_pending_deletes";

function readJSONArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) { return []; }
}

function writeJSONArray(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e) {}
}

function getPendingProductIds() {
  return readJSONArray(PENDING_PRODUCTS_KEY).map(String);
}

function markProductPendingSync(id) {
  if (!id) return;
  const list = getPendingProductIds();
  if (!list.includes(String(id))) {
    list.push(String(id));
    writeJSONArray(PENDING_PRODUCTS_KEY, list);
  }
  updatePendingSyncUI();
}

function clearProductPendingSync(id) {
  writeJSONArray(PENDING_PRODUCTS_KEY, getPendingProductIds().filter(x => x !== String(id)));
  updatePendingSyncUI();
}

function getPendingDeletes() {
  return readJSONArray(PENDING_DELETES_KEY).filter(x => x && x.id);
}

function markProductPendingDelete(id, name) {
  if (!id) return;
  const list = getPendingDeletes();
  if (!list.some(x => String(x.id) === String(id))) {
    list.push({ id: String(id), name: name || "" });
    writeJSONArray(PENDING_DELETES_KEY, list);
  }
  updatePendingSyncUI();
}

function clearProductPendingDelete(id) {
  writeJSONArray(PENDING_DELETES_KEY, getPendingDeletes().filter(x => String(x.id) !== String(id)));
  updatePendingSyncUI();
}

function pendingChangesCount() {
  return getPendingProductIds().length + getPendingDeletes().length;
}

function updatePendingSyncUI() {
  const btn = document.getElementById("btnSyncPending");
  const count = pendingChangesCount();
  if (btn) {
    btn.style.display = count > 0 ? "inline-flex" : "none";
    btn.textContent = `⏳ Sincronizar pendientes (${count})`;
  }
  try { renderAdminProductsTable(); } catch(e) {}
}

// Convierte un producto local al formato del documento de Firestore
function productToFirestoreDoc(prod) {
  const old = (prod.oldPrice === null || prod.oldPrice === undefined || prod.oldPrice === "")
    ? null
    : Number(prod.oldPrice);

  return {
    nombre: prod.name,
    categoria: prod.sector,
    precio: Number(prod.price) || 0,
    precioAnterior: old,
    badge: prod.badge || "",
    imagenUrl: prod.image,
    descripcion: prod.description || "",
    disponible: true
  };
}

async function syncProductToCloud(prod) {
  const fb = await initFirebaseSDK();
  if (!fb) throw new Error("Firebase no disponible");

  const { db, firestore } = fb;
  const { setDoc, doc, serverTimestamp } = firestore;
  const payload = productToFirestoreDoc(prod);
  payload.actualizadoEn = serverTimestamp();

  await setDoc(doc(db, "productos", String(prod.id)), payload, { merge: true });
}

async function deleteProductFromCloud(id) {
  const fb = await initFirebaseSDK();
  if (!fb) throw new Error("Firebase no disponible");

  const { db, firestore } = fb;
  await firestore.deleteDoc(firestore.doc(db, "productos", String(id)));
}

// Reintenta todo lo que quedó pendiente (botón del panel, al recuperar internet o al abrir la web)
async function syncPendingProducts(notify = true) {
  const pendingIds = getPendingProductIds();
  const pendingDeletes = getPendingDeletes();

  if (!pendingIds.length && !pendingDeletes.length) {
    if (notify) showToast("✅ Todo está sincronizado con la nube");
    updatePendingSyncUI();
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const rec of pendingDeletes) {
    try {
      await deleteProductFromCloud(rec.id);
      clearProductPendingDelete(rec.id);
      ok++;
    } catch(e) {
      console.warn("[RBstore Sync] No se pudo borrar", rec.id, e.message);
      fail++;
    }
  }

  for (const id of pendingIds) {
    const prod = products.find(p => String(p.id) === String(id));
    if (!prod) {
      clearProductPendingSync(id);
      continue;
    }
    try {
      await syncProductToCloud(prod);
      clearProductPendingSync(id);
      ok++;
    } catch(e) {
      console.warn("[RBstore Sync] No se pudo publicar", id, e.message);
      fail++;
    }
  }

  updatePendingSyncUI();

  if (notify) {
    showToast(fail
      ? `⚠️ ${ok} cambio(s) publicados y ${fail} siguen fallando. Revisa la conexión.`
      : `🔥 ${ok} cambio(s) publicados para todos los clientes`);
  }
}

window.syncPendingProducts = syncPendingProducts;

// SAFE DOM READY / IMMEDIATE EXECUTION
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

function initApp() {
  // 1. Load defaults as IMMEDIATE placeholder while Firestore connects
  const deletedProds = getDeletedProductIds();
  const deletedCats = getDeletedCategoryIds();

  categories = DEFAULT_CATEGORIES.filter(c => !deletedCats.includes(String(c.id)) && !deletedCats.includes(safeStr(c.name)));
  products = DEFAULT_PRODUCTS.filter(p => !deletedProds.includes(String(p.id)) && !deletedProds.includes(safeStr(p.name)));

  // 2. Render the UI with defaults right away so user sees something
  renderCategoriesGrid();
  renderSectorOptions();
  renderProductsGrid();
  setupEventListeners();
  setupScrollEffects();
  updateStats();
  updatePendingSyncUI();

  // 3. Start Firebase Firestore Realtime Sync — THIS is the real data source
  initFirebaseSync();

  console.log(`[RBstore] App inicializada, esperando datos de Firestore...`);
}

// FIREBASE REALTIME FIRESTORE LISTENER (Productos + Categorías)
async function initFirebaseSync() {
  const fb = await initFirebaseSDK();
  if (!fb) {
    console.log("[RBstore Firebase] Modo local activo (Firebase SDK no disponible).");
    return;
  }

  const { db, auth, firestore, authMod } = fb;
  const { collection, onSnapshot, query } = firestore;

  try {
    // 1. Productos Listener
    const q = query(collection(db, "productos"));
    onSnapshot(q, (snapshot) => {
      try {
        const firestoreProducts = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const rawName = data.nombre || data.name || "Producto";
          const rawSector = data.categoria || data.sector || "varios";
          const rawPrice = data.precio || data.price || 0;
          const rawOldPrice = data.precioAnterior || data.oldPrice;
          const rawImage = data.imagenUrl || data.image || "images/cargador_20w.jpg";
          const rawDesc = data.descripcion || data.description || "";

          firestoreProducts.push({
            id: String(docSnap.id),
            name: String(rawName),
            sector: safeStr(rawSector) || "varios",
            price: isNaN(Number(rawPrice)) ? 0 : Number(rawPrice),
            oldPrice: (rawOldPrice !== null && rawOldPrice !== undefined && !isNaN(Number(rawOldPrice))) ? Number(rawOldPrice) : null,
            badge: String(data.badge || ""),
            image: String(rawImage),
            description: String(rawDesc)
          });
        });

        // Merge: base local del dueño + DEFAULT_PRODUCTS + Firestore, excluyendo borrados
        // (ANTES: se reconstruía solo desde DEFAULTS y los productos agregados que no
        //  alcanzaron a sincronizarse con la nube DESAPARECIAN con cada snapshot)
        const deletedProds = getDeletedProductIds();
        const productMap = new Map();

        // 1) Base: lo que ya está en memoria (conserva agregados/ediciones locales del dueño)
        products.forEach(p => {
          const pId = String(p.id);
          const pNameLower = safeStr(p.name);
          if (deletedProds.includes(pId) || deletedProds.includes(pNameLower)) return;
          productMap.set(pId, p);
        });

        // 2) Defaults de respaldo para visitantes nuevos (si no existe ya por id o nombre)
        DEFAULT_PRODUCTS.forEach(p => {
          const pId = String(p.id);
          const pNameLower = safeStr(p.name);
          if (deletedProds.includes(pId) || deletedProds.includes(pNameLower)) return;
          const exists = productMap.has(pId) || Array.from(productMap.values()).some(x => safeStr(x.name) === pNameLower);
          if (!exists) productMap.set(pId, p);
        });

        // 3) Firestore manda: sobreescribe por id o nombre coincidente
        firestoreProducts.forEach(p => {
          const pId = String(p.id);
          const pNameLower = safeStr(p.name);
          if (deletedProds.includes(pId) || deletedProds.includes(pNameLower)) {
            return; // Exclude deleted item
          }

          const existingKey = Array.from(productMap.keys()).find(k => {
            const item = productMap.get(k);
            return k === p.id || (item && safeStr(item.name) === pNameLower);
          });
          if (existingKey) {
            productMap.set(existingKey, p);
          } else {
            productMap.set(p.id, p);
          }
        });

        products = Array.from(productMap.values());
        firestoreProductsLoaded = true;

        renderCategoriesGrid();
        renderSectorOptions();
        renderProductsGrid();
        renderAdminProductsTable();
        updateStats();
        console.log(`[RBstore Firebase] 🔥 ${products.length} productos listos (${firestoreProducts.length} en Firestore)`);
      } catch (err) {
        console.error("[RBstore Firebase] Error procesando productos de Firestore:", err);
      }
    }, (err) => {
      console.warn("[RBstore Firebase] Error en listener de productos:", err.message);
    });

    // 2. Categorías Listener
    const catQuery = query(collection(db, "categorias"));
    onSnapshot(catQuery, (catSnapshot) => {
      try {
        const firestoreCategories = [];
        catSnapshot.forEach((cSnap) => {
          const cData = cSnap.data() || {};
          firestoreCategories.push({
            id: String(cSnap.id),
            name: String(cData.name || cData.nombre || "Categoría"),
            icon: String(cData.icon || cData.icono || "📦")
          });
        });

        // Merge DEFAULT_CATEGORIES with firestoreCategories, excluding deleted items
        const deletedCats = getDeletedCategoryIds();
        const categoryMap = new Map();

        DEFAULT_CATEGORIES.forEach(c => {
          const cId = String(c.id);
          const cNameLower = safeStr(c.name);
          if (!deletedCats.includes(cId) && !deletedCats.includes(cNameLower)) {
            categoryMap.set(cId, c);
          }
        });

        firestoreCategories.forEach(c => {
          const cId = String(c.id);
          const cNameLower = safeStr(c.name);
          if (deletedCats.includes(cId) || deletedCats.includes(cNameLower)) {
            return; // Exclude deleted item
          }

          const existingKey = Array.from(categoryMap.keys()).find(k => {
            const item = categoryMap.get(k);
            return k === c.id || (item && safeStr(item.name) === cNameLower);
          });
          if (existingKey) {
            categoryMap.set(existingKey, {
              ...c,
              id: existingKey // PRESERVE default category ID so product sector matching never breaks
            });
          } else {
            categoryMap.set(c.id, c);
          }
        });

        categories = Array.from(categoryMap.values());
        firestoreCategoriesLoaded = true;

        renderCategoriesGrid();
        renderSectorOptions();
        renderAdminCategoriesList();
        renderProductsGrid();
        console.log(`[RBstore Firebase] 🏠 ${categories.length} categorías listas (${firestoreCategories.length} en Firestore)`);
      } catch (err) {
        console.error("[RBstore Firebase] Error procesando categorías de Firestore:", err);
      }
    }, (cErr) => {
      console.warn("[RBstore Firebase] Error en listener de categorías:", cErr.message);
    });

    authMod.onAuthStateChanged(auth, (user) => {
      cloudUser = user || null;
      if (user) {
        console.log("[RBstore Auth] Sesión de la nube activa:", user.email);
        isAdminLoggedIn = true;
        const overlay = document.getElementById("adminOverlay");
        if (overlay && overlay.classList.contains("active")) {
          openAdminPanel(true);
        }
      }
    });

    // Reintenta automáticamente lo que no alcanzó a publicarse en la nube
    window.addEventListener("online", () => {
      if (pendingChangesCount() > 0) syncPendingProducts(false);
    });

    setTimeout(() => {
      if (pendingChangesCount() > 0) syncPendingProducts(false);
    }, 2000);

  } catch(e) {
    console.error("[RBstore Firebase] Error en inicialización de sync:", e);
  }
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
    localStorage.setItem("rbstore_owner_has_local_edits", "true");
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
    localStorage.setItem("rbstore_owner_has_local_edits", "true");
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
    const cid = safeStr(cat.id);
    const cname = safeStr(cat.name);
    const count = products.filter(p => {
      const s = safeStr(p.sector);
      return s === cid || s === cname || (s && cid && (s.includes(cid) || cid.includes(s)));
    }).length;

    const card = document.createElement("button");
    card.className = `cat-card ${currentFilterSector === cat.id ? 'active' : ''}`;
    card.setAttribute("data-category", cat.id);
    card.innerHTML = `
      <div class="cat-card__icon">${cat.icon || '📦'}</div>
      <div class="cat-card__name">${cat.name || 'Categoría'}</div>
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
  if (cardElement) cardElement.classList.add("active");
  currentFilterSector = sectorId;
  renderProductsGrid();

  const prodSection = document.getElementById("catalogo");
  if (prodSection) prodSection.scrollIntoView({ behavior: "smooth" });
}

// DYNAMIC SECTOR SELECTOR FOR ADD/EDIT FORM
function renderSectorOptions(selectedValue) {
  const select = document.getElementById("prodSector");
  if (!select) return;

  const currentVal = select.value;
  const wanted = (selectedValue !== undefined && selectedValue !== null && selectedValue !== "")
    ? String(selectedValue)
    : (currentVal ? String(currentVal) : "");

  select.innerHTML = "";

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = `${cat.icon || '📦'} ${cat.name || 'Categoría'}`;
    select.appendChild(option);
  });

  // Si la categoría del producto no está en la lista (p. ej. quedó desincronizada),
  // se agrega la opción para NO cambiarla en silencio al guardar.
  if (wanted && !categories.some(c => String(c.id) === wanted)) {
    const opt = document.createElement("option");
    opt.value = wanted;
    opt.textContent = `⚠️ ${wanted} (categoría desconocida)`;
    select.appendChild(opt);
  }

  if (wanted) select.value = wanted;
}

// ═══════════════════════════════════════════════
// RENDER PRODUCTS GRID — uses correct BEM classes
// ═══════════════════════════════════════════════
function renderProductsGrid() {
  const grid = document.getElementById("productsGrid");
  const emptyState = document.getElementById("emptyState");
  if (!grid) return;

  grid.innerHTML = "";

  const activeCategory = categories.find(c => safeStr(c.id) === safeStr(currentFilterSector));
  const searchLower = safeStr(currentSearchTerm);
  const targetId = safeStr(currentFilterSector);
  const targetName = activeCategory ? safeStr(activeCategory.name) : "";

  const filtered = products.filter(product => {
    let matchesSector = targetId === "todos" || targetId === "";
    if (!matchesSector) {
      const pSector = safeStr(product.sector);
      matchesSector = pSector === targetId || (targetName && pSector === targetName) || (pSector && targetId && (pSector.includes(targetId) || targetId.includes(pSector)));
    }

    const pName = safeStr(product.name);
    const pDesc = safeStr(product.description);
    const pSector = safeStr(product.sector);

    const matchesSearch = !searchLower || 
      pName.includes(searchLower) ||
      pDesc.includes(searchLower) ||
      pSector.includes(searchLower);
    
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
  card.setAttribute("data-category", product.sector || "varios");
  card.setAttribute("data-product-id", product.id || `p_${index}`);
  card.style.animationDelay = `${index * 0.05}s`;

  // Badge
  let badgeLabel = "";
  let badgeClass = "";
  const b = safeStr(product.badge);
  if (b === "popular") { badgeLabel = "Más Vendido"; badgeClass = "product-card__badge--hot"; }
  else if (b === "nuevo") { badgeLabel = "Nuevo"; badgeClass = "product-card__badge--new"; }
  else if (b === "oferta") { badgeLabel = "Oferta"; badgeClass = "product-card__badge--sale"; }
  else if (b === "exclusivo") { badgeLabel = "Exclusivo"; badgeClass = "product-card__badge--hot"; }
  else if (b === "agotado") { badgeLabel = "Agotado"; badgeClass = "product-card__badge--soldout"; }

  const badgeHtml = badgeLabel ? `<span class="product-card__badge ${badgeClass}">${badgeLabel}</span>` : "";

  // Prices
  const numPrice = isNaN(Number(product.price)) ? 0 : Number(product.price);
  const numOldPrice = (product.oldPrice && !isNaN(Number(product.oldPrice))) ? Number(product.oldPrice) : null;

  const formattedPrice = `$${numPrice.toFixed(0)}`;
  const oldPriceHtml = numOldPrice ? `<span class="product-card__price-old">$${numOldPrice.toFixed(0)}</span>` : "";

  // WhatsApp link
  const pName = product.name || "Producto";
  const waText = encodeURIComponent(`¡Hola RBstore! Estoy interesado en *${pName}* (Precio: $${numPrice.toFixed(2)}). ¿Tienen disponibilidad?`);
  const waUrl = `https://wa.me/${RBSTORE_CONFIG.whatsappNumber}?text=${waText}`;

  card.innerHTML = `
    ${badgeHtml}
    <div class="product-card__img">
      <img src="${product.image || 'images/cargador_20w.jpg'}" alt="${pName}" loading="lazy" onerror="this.src='images/cargador_20w.jpg'">
      <div class="product-card__img-overlay"></div>
    </div>
    <div class="product-card__body">
      <div class="product-card__category">${getSectorLabel(product.sector)}</div>
      <h3 class="product-card__name" style="cursor:pointer;">${pName}</h3>
      <p class="product-card__desc">${product.description || ""}</p>
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

  // Safe click handlers using addEventListener (not inline onclick)
  const imgDiv = card.querySelector(".product-card__img");
  const nameEl = card.querySelector(".product-card__name");
  const openModal = () => openProductModal(product.id);
  if (imgDiv) imgDiv.addEventListener("click", openModal);
  if (nameEl) nameEl.addEventListener("click", openModal);

  return card;
}

// SECTOR UTILITY
function getSectorLabel(sectorKey) {
  const sk = safeStr(sectorKey);
  const cat = categories.find(c => safeStr(c.id) === sk || safeStr(c.name) === sk);
  if (cat) return cat.name;

  const map = {
    cargadores: "Cargadores & Cables",
    iluminacion: "Iluminación LED",
    audifonos: "Audífonos",
    varios: "Artículos Varios"
  };
  return map[sk] || (sectorKey ? String(sectorKey) : "Tecnología");
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

      document.querySelectorAll('.cat-card').forEach(c => c.classList.remove("active"));
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
  document.getElementById("btnSyncPending")?.addEventListener("click", () => syncPendingProducts(true));
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
    openAdminPanel(!!cloudUser);
  } else {
    document.getElementById("adminLoginView").style.display = "block";
    document.getElementById("adminDashboardView").style.display = "none";
    document.getElementById("adminPassInput").value = "";
    const emailEl = document.getElementById("adminEmailInput");
    if (emailEl && cloudUser) emailEl.value = cloudUser.email || "";
    document.getElementById("adminLoginError").style.display = "none";
  }
}

// Muestra el panel y avisa claramente si los cambios se publican o no
function openAdminPanel(onCloud) {
  isAdminLoggedIn = true;

  const loginView = document.getElementById("adminLoginView");
  const dashView = document.getElementById("adminDashboardView");
  if (loginView) loginView.style.display = "none";
  if (dashView) dashView.style.display = "block";

  renderAdminProductsTable();
  renderAdminCategoriesList();
  updatePendingSyncUI();
  updateCloudModeBanner(onCloud);
}

function updateCloudModeBanner(onCloud) {
  const banner = document.getElementById("adminCloudStatus");
  if (!banner) return;

  banner.style.display = "block";
  banner.style.padding = "12px 14px";
  banner.style.borderRadius = "10px";
  banner.style.fontSize = "0.85rem";
  banner.style.lineHeight = "1.45";
  banner.style.marginBottom = "16px";

  if (onCloud) {
    const who = cloudUser && cloudUser.email ? ` (${cloudUser.email})` : "";
    banner.style.background = "rgba(74, 222, 128, 0.12)";
    banner.style.border = "1px solid rgba(74, 222, 128, 0.35)";
    banner.style.color = "#4ade80";
    banner.innerHTML = `✅ <strong>Conectado a la nube${who}</strong> — cada cambio se publica para todos tus clientes.<br><button onclick="cloudLogout()" style="margin-top:8px; background:none; border:1px solid rgba(74,222,128,0.4); color:#4ade80; border-radius:8px; padding:5px 10px; cursor:pointer; font-size:0.78rem;">Cerrar sesión de la nube</button>`;
  } else {
    banner.style.background = "rgba(250, 204, 21, 0.12)";
    banner.style.border = "1px solid rgba(250, 204, 21, 0.35)";
    banner.style.color = "#facc15";
    banner.innerHTML = `⚠️ <strong>Modo local (sin publicar)</strong> — los cambios quedan marcados como <em>⏳ sin publicar</em> en este dispositivo.<br>Para publicarlos, pulsa <strong>Cerrar sesión</strong>, vuelve a entrar con tu <strong>correo y contraseña</strong> y pulsa <strong>Sincronizar pendientes</strong>.`;
  }
}

async function cloudLogout() {
  try {
    const fb = await initFirebaseSDK();
    if (fb && fb.authMod && fb.auth) await fb.authMod.signOut(fb.auth);
  } catch(e) {
    console.warn("No se pudo cerrar la sesión de la nube:", e.message);
  }
  cloudUser = null;
  isAdminLoggedIn = false;
  closeAdminModal();
  showToast("Sesión de la nube cerrada");
}

window.cloudLogout = cloudLogout;

function authErrorMessage(err) {
  const code = String((err && err.code) || "") + " " + String((err && err.message) || "");
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Correo o contraseña incorrectos";
  }
  if (code.includes("invalid-email")) return "El correo no tiene un formato válido";
  if (code.includes("too-many-requests")) return "Demasiados intentos fallidos. Espera unos minutos.";
  if (code.includes("network")) return "Sin conexión con Firebase";
  if (code.includes("operation-not-allowed")) return "Falta activar Email/contraseña en Authentication de Firebase";
  return (err && err.message) ? err.message : "No se pudo iniciar sesión";
}

function closeAdminModal() {
  const overlay = document.getElementById("adminOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

async function submitAdminLogin() {
  const emailEl = document.getElementById("adminEmailInput");
  const passEl = document.getElementById("adminPassInput");
  const errorEl = document.getElementById("adminLoginError");
  const btn = document.querySelector('#adminLoginView button');

  const email = emailEl ? emailEl.value.trim() : "";
  const pass = passEl ? passEl.value.trim() : "";

  if (errorEl) errorEl.style.display = "none";
  if (btn) { btn.disabled = true; btn.textContent = "Entrando..."; }

  try {
    // 1. Sesión real en Firebase: es la única forma de PUBLICAR (guardar en la nube).
    if (email) {
      const fb = await initFirebaseSDK();
      if (!fb) throw new Error("Sin conexión con Firebase");

      const { auth, authMod } = fb;
      const cred = await authMod.signInWithEmailAndPassword(auth, email, pass);
      cloudUser = cred.user;
      openAdminPanel(true);
      showToast("🔥 Sesión iniciada: tus cambios se publican para todos");
      return;
    }

    // 2. Clave local del dueño: sirve para preparar productos sin internet,
    //    pero NO los publica (quedan como pendientes).
    if (pass === RBSTORE_CONFIG.adminKey) {
      openAdminPanel(false);
      showToast("⚠️ Modo local: entra con tu correo para publicar en la nube", 6000);
      return;
    }

    if (errorEl) {
      errorEl.style.display = "block";
      errorEl.textContent = "Contraseña incorrecta";
    }
  } catch(err) {
    console.warn("[RBstore Auth] No se pudo iniciar sesión:", err);
    if (errorEl) {
      errorEl.style.display = "block";
      errorEl.textContent = authErrorMessage(err);
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Ingresar"; }
  }
}

function renderAdminProductsTable() {
  const tbody = document.getElementById("adminProductsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const pendingIds = getPendingProductIds();

  products.forEach(p => {
    const isPending = pendingIds.includes(String(p.id));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${p.image}" alt="${p.name}" class="admin-table-img"></td>
      <td><strong>${p.name}</strong>${isPending ? ' <span title="Aún no visible para tus clientes" style="color:#facc15; font-size:0.7rem; white-space:nowrap;">⏳ sin publicar</span>' : ''}</td>
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
  document.getElementById("formTitle").innerText = `Editar Producto: ${p.name}`;
  document.getElementById("editProductId").value = p.id;
  document.getElementById("prodName").value = p.name;
  renderSectorOptions(p.sector);
  document.getElementById("prodSector").value = p.sector;
  document.getElementById("prodPrice").value = p.price;
  document.getElementById("prodOldPrice").value = p.oldPrice || "";
  document.getElementById("prodBadge").value = p.badge || "";
  document.getElementById("prodImage").value = p.image;
  document.getElementById("prodDesc").value = p.description;

  const fileInput = document.getElementById("prodFileInput");
  if (fileInput) fileInput.value = "";

  document.getElementById("adminFormContainer").scrollIntoView({ behavior: "smooth" });
}

window.editProduct = editProduct;

// CLAVE DE IMGBB: la que viene por defecto YA NO ES VÁLIDA (ImgBB responde "Invalid API v1 key").
// Si quieres fotos alojadas fuera de Firestore, crea una clave gratis en https://api.imgbb.com
// y guárdala desde la consola del navegador con:
//   localStorage.setItem("rbstore_imgbb_key", "TU_CLAVE")
const IMGBB_API_KEY_DEFAULT = "40941cfd13eaee31c9fa00c3b9dd2d52";

function getImgBBKey() {
  try {
    const custom = localStorage.getItem("rbstore_imgbb_key");
    if (custom && custom.trim()) return custom.trim();
  } catch(e) {}
  return IMGBB_API_KEY_DEFAULT;
}

// Si la clave falla, no se vuelve a intentar en toda la sesión (evita esperas inútiles)
let imgBBKeyFailed = false;

// ═══════════════════════════════════════════════
// PRESUPUESTO DE IMAGEN — Firestore rechaza documentos de más de 1 MB
// ═══════════════════════════════════════════════
const FIRESTORE_IMG_TARGET_CHARS = 260000; // ~190 KB: rápido de cargar y siempre cabe
const FIRESTORE_IMG_HARD_CHARS = 800000;   // techo de seguridad antes del límite de 1 MB

// Re-codifica una imagen (data URL) al tamaño y calidad indicados, siempre en JPEG (pesa mucho menos que PNG)
function reencodeDataUrl(dataUrl, maxSide, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxSide || height > maxSide) {
        if (width > height) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#0c0d14";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("No se pudo reprocesar la imagen"));
    img.src = dataUrl;
  });
}

// Reduce la imagen por pasos hasta que quepa en el presupuesto (esto es lo que faltaba:
// antes una foto de celular quedaba en base64 gigante y Firestore rechazaba el guardado)
async function fitImageToBudget(dataUrl, targetChars = FIRESTORE_IMG_TARGET_CHARS) {
  if (!dataUrl || !String(dataUrl).startsWith("data:image/")) return dataUrl;
  if (dataUrl.length <= targetChars) return dataUrl;

  const pasos = [[900, 0.72], [760, 0.65], [620, 0.58], [500, 0.5], [400, 0.45], [320, 0.4]];
  let best = dataUrl;

  for (const [lado, calidad] of pasos) {
    try {
      const next = await reencodeDataUrl(dataUrl, lado, calidad);
      if (next.length < best.length) best = next;
      if (best.length <= targetChars) return best;
    } catch(e) {
      break;
    }
  }
  return best;
}

// Red de seguridad final: si la imagen que se va a guardar es base64 y es enorme, se reduce antes del guardado
async function ensureImageFitsFirestore(imageUrl) {
  if (!imageUrl || !String(imageUrl).startsWith("data:image/")) return imageUrl;
  if (imageUrl.length <= FIRESTORE_IMG_TARGET_CHARS) return imageUrl;
  return await fitImageToBudget(imageUrl);
}

// CADENA DE FOTOS: ImgBB (si la clave sirve) → Firebase Storage → base64 comprimido a la medida de Firestore
async function prepareProductImage(file) {
  const { blob, dataUrl } = await compressImageFile(file, 1000, 1000, 0.8);

  if (!imgBBKeyFailed) {
    try {
      const url = await uploadImageToImgBB(blob);
      showToast("✅ Foto alojada en la nube (ImgBB)");
      return url;
    } catch(err) {
      console.warn("[RBstore Foto] ImgBB no disponible:", err.message);
    }
  }

  if (!storageUploadFailed) {
    try {
      const url = await uploadImageToFirebaseStorage(blob);
      showToast("✅ Foto alojada en Firebase Storage");
      return url;
    } catch(err) {
      storageUploadFailed = true;
      console.warn("[RBstore Foto] Firebase Storage no disponible:", err.message);
    }
  }

  // Respaldo garantizado: la foto viaja dentro del producto, ya optimizada para caber
  const fitted = await fitImageToBudget(dataUrl);
  showToast("✅ Foto optimizada y lista");
  return fitted;
}

// CLIENT-SIDE IMAGE COMPRESSOR (Reduces 10MB camera photos to crisp ~50KB images, preserving PNG transparency)
function compressImageFile(file, maxWidth = 1000, maxHeight = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("El archivo no es una imagen válida"));
      return;
    }

    const isPngOrWebp = file.type === "image/png" || file.type === "image/webp";

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!isPngOrWebp) {
          ctx.fillStyle = "#0c0d14";
          ctx.fillRect(0, 0, width, height);
        } else {
          ctx.clearRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = isPngOrWebp ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, isPngOrWebp ? undefined : quality);
        canvas.toBlob((blob) => {
          resolve({ blob: blob || file, dataUrl });
        }, mimeType, isPngOrWebp ? undefined : quality);
      };
      img.onerror = () => reject(new Error("No se pudo procesar el formato de la imagen"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo local"));
    reader.readAsDataURL(file);
  });
}

async function uploadImageToImgBB(fileOrBlob) {
  const formData = new FormData();
  formData.append("image", fileOrBlob, "product_photo.jpg");

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${getImgBBKey()}`, {
    method: "POST",
    body: formData
  });

  let data = null;
  try { data = await res.json(); } catch(e) {}

  if (data && data.success && data.data && data.data.url) {
    return data.data.url;
  }

  const msg = (data && data.error && data.error.message) ? data.error.message : `ImgBB respondió ${res.status}`;
  if (res.status === 400 || res.status === 401 || /invalid api|api v1 key/i.test(msg)) {
    imgBBKeyFailed = true;
    console.warn("[RBstore Foto] La clave de ImgBB no es válida. Se usará otra vía para las fotos.");
  }
  throw new Error(msg);
}

// Firebase Storage reintenta indefinidamente cuando el bucket no existe (deja la foto "cargando" para siempre),
// por eso la subida tiene límite de tiempo y se desactiva tras el primer fallo de la sesión.
const STORAGE_UPLOAD_TIMEOUT_MS = 5000;
let storageUploadFailed = false;

async function uploadImageToFirebaseStorage(fileOrBlob) {
  const fb = await initFirebaseSDK();
  if (!fb || !fb.storage || !fb.storageMod) throw new Error("Firebase Storage no inicializado");
  const { storage, storageMod } = fb;
  const { ref, uploadBytesResumable, getDownloadURL } = storageMod;

  const fileName = `productos/prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
  const storageRef = ref(storage, fileName);
  const task = uploadBytesResumable(storageRef, fileOrBlob);

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { task.cancel(); } catch(e) {}
      reject(new Error("Firebase Storage no respondió a tiempo"));
    }, STORAGE_UPLOAD_TIMEOUT_MS);

    task.on(
      "state_changed",
      () => {},
      (err) => { clearTimeout(timer); reject(err); },
      () => { clearTimeout(timer); resolve(); }
    );
  });

  return await getDownloadURL(storageRef);
}

// Evita procesar/ subir dos veces la misma foto (una al elegirla y otra al guardar)
let lastProcessedImage = null;

function fileKey(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

async function handleImageFileUpload(input) {
  if (!input || !input.files || !input.files[0]) return;
  const rawFile = input.files[0];
  const imgField = document.getElementById("prodImage");

  try {
    showToast("⚡ Optimizando foto...");
    const finalUrl = await prepareProductImage(rawFile);
    if (imgField) imgField.value = finalUrl;
    lastProcessedImage = { key: fileKey(rawFile), url: finalUrl };

    if (finalUrl.startsWith("data:")) {
      const kb = Math.max(1, Math.round(finalUrl.length / 1400));
      showToast(`✅ Foto lista (${kb} KB). Ahora pulsa Guardar`);
    } else {
      showToast("✅ Foto subida. Ahora pulsa Guardar");
    }
  } catch (err) {
    console.error("Error procesando imagen:", err);
    showToast("⚠️ Error procesando la imagen: " + err.message);
  }
}

window.handleImageFileUpload = handleImageFileUpload;

async function handleProductFormSubmit(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = "Guardando...";
  }

  try {
    await saveProductFromForm(e);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || "Guardar";
    }
  }
}

async function saveProductFromForm(e) {
  const editId = document.getElementById("editProductId").value;
  const fileInput = document.getElementById("prodFileInput");
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  let imageUrl = document.getElementById("prodImage").value.trim();

  // Si el usuario seleccionó un nuevo archivo, SIEMPRE se reemplaza la imagen anterior.
  // Si esa misma foto ya se procesó al elegirla, se reutiliza (evita subirla dos veces).
  if (file) {
    const yaProcesada = lastProcessedImage
      && lastProcessedImage.key === fileKey(file)
      && lastProcessedImage.url;

    if (yaProcesada) {
      imageUrl = lastProcessedImage.url;
      document.getElementById("prodImage").value = imageUrl;
    } else {
      try {
        showToast("⚡ Procesando nueva imagen...");
        imageUrl = await prepareProductImage(file);
        lastProcessedImage = { key: fileKey(file), url: imageUrl };
        document.getElementById("prodImage").value = imageUrl;
      } catch(err) {
        console.error("Error procesando imagen en submit:", err);
        showToast("⚠️ No se pudo procesar la foto (" + err.message + "). Se guardará el producto sin cambiarla.");
      }
    }
  }

  // Red de seguridad: ninguna imagen puede superar el límite de 1 MB de Firestore
  imageUrl = await ensureImageFitsFirestore(imageUrl);

  if (imageUrl && imageUrl.length > FIRESTORE_IMG_HARD_CHARS) {
    showToast("⚠️ La foto sigue siendo muy pesada; intenta con otra imagen");
  }

  const prodData = {
    nombre: document.getElementById("prodName").value.trim(),
    categoria: document.getElementById("prodSector").value,
    precio: parseFloat(document.getElementById("prodPrice").value),
    precioAnterior: document.getElementById("prodOldPrice").value ? parseFloat(document.getElementById("prodOldPrice").value) : null,
    badge: document.getElementById("prodBadge").value || "",
    imagenUrl: imageUrl || "images/cargador_20w.jpg",
    descripcion: document.getElementById("prodDesc").value.trim(),
    disponible: true
  };

  const targetId = editId || `rb_${Date.now()}`;

  const newProdLocal = {
    id: targetId,
    name: prodData.nombre,
    sector: prodData.categoria,
    price: prodData.precio,
    oldPrice: prodData.precioAnterior,
    badge: prodData.badge,
    image: prodData.imagenUrl,
    description: prodData.descripcion
  };

  // 1. Actualización local inmediata (cero espera para el dueño)
  const idxById = editId ? products.findIndex(p => String(p.id) === String(editId)) : -1;
  if (idxById !== -1) {
    products[idxById] = newProdLocal;
  } else if (editId) {
    // El id pudo cambiar (producto venido de Firestore): intenta por nombre antes de duplicar
    const idxByName = products.findIndex(p => safeStr(p.name) === safeStr(prodData.nombre));
    if (idxByName !== -1) products[idxByName] = newProdLocal;
    else products.unshift(newProdLocal);
  } else {
    products.unshift(newProdLocal);
  }

  saveCatalogData();
  renderProductsGrid();
  renderAdminProductsTable();
  hideProductForm();
  updateStats();

  // 2. Publicación en Firestore + cola de pendientes si falla (nunca más un error silencioso)
  try {
    await syncProductToCloud(newProdLocal);
    clearProductPendingSync(targetId);
    showToast(editId ? "🔥 Producto actualizado para todos" : "🔥 Producto publicado para todos");
  } catch(err) {
    console.error("Error guardando en Firestore:", err);
    markProductPendingSync(targetId);
    showToast("⚠️ Guardado en este dispositivo, pero NO publicado: " + firebaseErrorMessage(err) + ". Pulsa 'Sincronizar pendientes'.", 6500);
  }
}

async function deleteProduct(productId) {
  const p = products.find(item => item.id === productId);
  const pName = p ? p.name : "";

  if (confirm(`¿Estás seguro de eliminar "${pName || 'este producto'}" del catálogo?`)) {
    // 1. Record as deleted so it NEVER gets re-merged by Firestore listener or page refresh
    addDeletedProductId(productId, pName);
    clearProductPendingSync(productId);

    // 2. Immediate local state removal for ZERO LAG responsiveness
    products = products.filter(item => item.id !== productId);
    saveCatalogData();

    renderProductsGrid();
    renderAdminProductsTable();
    updateStats();

    // 3. Delete from Cloud Firestore Database
    try {
      await deleteProductFromCloud(productId);
      showToast("🔥 Producto eliminado para todos");
    } catch(err) {
      console.error("Error eliminando de Firestore:", err);
      markProductPendingDelete(productId, pName);
      showToast("⚠️ Oculto aquí, pero falta borrarlo de la nube (" + firebaseErrorMessage(err) + "). Pulsa 'Sincronizar pendientes'.", 6500);
    }
  }
}

window.deleteProduct = deleteProduct;

async function seedInitialDataToFirestore() {
  if (!confirm("¿Deseas subir los productos actuales a tu Firestore en Firebase?")) return;
  try {
    showToast("🌱 Subiendo productos a Firestore...");
    const fb = await initFirebaseSDK();
    if (fb) {
      const { db, firestore } = fb;
      const { addDoc, collection, serverTimestamp } = firestore;
      for (const p of products) {
        await addDoc(collection(db, "productos"), {
          nombre: p.name,
          categoria: p.sector,
          precio: p.price,
          precioAnterior: p.oldPrice || null,
          badge: p.badge || "",
          imagenUrl: p.image,
          descripcion: p.description || "",
          disponible: true,
          creadoEn: serverTimestamp()
        });
      }
      showToast("🔥 ¡Productos subidos a Firestore con éxito!");
    }
  } catch(err) {
    console.error("Error sembrando Firestore:", err);
    showToast("Error subiendo a Firestore: " + err.message);
  }
}
window.seedInitialDataToFirestore = seedInitialDataToFirestore;

function resetDefaultCatalog() {
  if (confirm("¿Deseas restablecer el catálogo a los productos y categorías iniciales de RBstore?")) {
    localStorage.removeItem("rbstore_deleted_product_ids");
    localStorage.removeItem("rbstore_deleted_category_ids");
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

async function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById("newCatName");
  const iconInput = document.getElementById("newCatIcon");
  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) return;

  const icon = iconInput ? (iconInput.value.trim() || "📦") : "📦";
  const catId = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_");

  if (categories.some(c => c.id === catId)) {
    showToast("Esta categoría ya existe");
    return;
  }

  const newCat = { id: catId, name, icon };
  categories.push(newCat);
  saveCategoriesData();

  // Save to Cloud Firestore "categorias" collection in real-time!
  try {
    const fb = await initFirebaseSDK();
    if (fb) {
      const { db, firestore } = fb;
      const { setDoc, doc, serverTimestamp } = firestore;
      await setDoc(doc(db, "categorias", catId), {
        name: name,
        icon: icon,
        creadoEn: serverTimestamp()
      });
      showToast(`🔥 Categoría "${name}" guardada en Firestore en tiempo real`);
    }
  } catch(err) {
    console.error("Error guardando categoría en Firestore:", err);
    showToast("⚠️ Categoría guardada solo en este dispositivo: " + firebaseErrorMessage(err));
  }

  renderCategoriesGrid();
  renderSectorOptions();
  renderAdminCategoriesList();
  renderProductsGrid();
  renderAdminProductsTable();
  updateStats();

  nameInput.value = "";
  if (iconInput) iconInput.value = "";
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

async function deleteCategory(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;

  if (categories.length <= 1) {
    showToast("No puedes eliminar la última categoría");
    return;
  }

  if (confirm(`¿Seguro que deseas eliminar la categoría "${cat.name}"? Los productos asignados serán reasignados.`)) {
    addDeletedCategoryId(catId, cat.name);
    categories = categories.filter(c => c.id !== catId);

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

    try {
      const fb = await initFirebaseSDK();
      if (fb && catId) {
        const { db, firestore } = fb;
        await firestore.deleteDoc(firestore.doc(db, "categorias", catId));
        showToast(`🔥 Categoría "${cat.name}" eliminada permanentemente`);
      }
    } catch(err) {
      console.error("Error eliminando categoría de Firestore:", err);
      showToast("⚠️ Categoría ocultada localmente, pero NO eliminada de la nube: " + firebaseErrorMessage(err));
    }
  }
}

window.deleteCategory = deleteCategory;

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

// ═══════════════════════════════════════════════
// AYUDAS: MENSAJES CLAROS DE ERRORES FIREBASE + LÍMITE DE TAMAÑO DE IMAGEN
// ═══════════════════════════════════════════════
function firebaseErrorMessage(err) {
  const code = String((err && err.code) || "") + " " + String((err && err.message) || "");
  if (code.includes("permission-denied") || code.includes("PERMISSION_DENIED")) {
    return "permisos denegados: entra con tu correo y contraseña para publicar (modo local activo)";
  }
  if (code.includes("resource-exhausted") || code.includes("entity too large") || code.includes("exceeds maximum")) {
    return "el documento es demasiado grande (la imagen pesa demasiado)";
  }
  if (code.includes("unavailable") || code.includes("network") || code.includes("Failed to fetch")) {
    return "sin conexión con el servidor";
  }
  if (code.includes("unauthenticated")) {
    return "sesión no autenticada";
  }
  return (err && err.message) ? err.message : "error desconocido";
}

// Firestore acepta documentos de máx 1MB: si la foto viaja como base64 y es enorme,
// se re-comprime en pasos sucesivos hasta caber (o se deja la menor posible)
const FIRESTORE_IMAGE_LIMIT_CHARS = 900000;

async function shrinkOversizedImageDataUrl(imageUrl, sourceBlob) {
  if (!imageUrl || !imageUrl.startsWith("data:image/") || imageUrl.length <= FIRESTORE_IMAGE_LIMIT_CHARS) {
    return imageUrl;
  }
  let current = imageUrl;
  const pasos = [[800, 0.7], [600, 0.6], [450, 0.5]];
  for (const [maxSide, q] of pasos) {
    try {
      const { dataUrl } = await compressImageFile(sourceBlob, maxSide, maxSide, q);
      current = dataUrl;
      if (dataUrl.length <= FIRESTORE_IMAGE_LIMIT_CHARS) return current;
    } catch (e) {
      break;
    }
  }
  return current;
}

// TOAST NOTIFICATIONS
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toastNotification");
  const msgEl = document.getElementById("toastMessage");
  if (!toast || !msgEl) return;

  msgEl.innerText = message;
  toast.classList.add("show");

  if (showToast._timer) clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
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
window.openProductModal = openProductModal;

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

// RECOVER LOST DRAFTS FROM BROWSER LOCALSTORAGE
function recoverLostProducts() {
  const foundLists = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      try {
        const val = localStorage.getItem(key);
        if (!val) continue;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && parsed[0].price) {
          foundLists.push({ key: key, count: parsed.length, products: parsed });
        } else if (parsed && parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
          foundLists.push({ key: key, count: parsed.products.length, products: parsed.products });
        }
      } catch(e) {}
    }
  } catch(err) {
    console.error("Error scanning localStorage", err);
  }
  
  if (foundLists.length === 0) {
    showToast("No se encontraron borradores antiguos en este celular.");
    return;
  }
  
  // Pick the list with most products or offer to merge
  let best = foundLists[0];
  foundLists.forEach(item => {
    if (item.count > best.count) best = item;
  });
  
  products = best.products;
  saveCatalogData();
  renderCategoriesGrid();
  renderSectorOptions();
  renderProductsGrid();
  renderAdminProductsTable();
  updateStats();
  
  showToast(`¡Se recuperaron ${products.length} productos desde la memoria local (${best.key})!`);
}

window.recoverLostProducts = recoverLostProducts;
