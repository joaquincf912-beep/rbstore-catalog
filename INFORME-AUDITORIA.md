# 🔍 Auditoría completa — RBstore (rbstore-catalog)

**Fecha:** 16/09/2026 · **Sitio:** http://rbstore.traccionweb.com · **Repo:** `joaquincf912-beep/rbstore-catalog`
**Alcance:** 100% del código (`index.html`, `app.js` (1.734 líneas), `style.css`, `firebase-config.js`, `catalog.json`) + backend Firebase en vivo + prueba interactiva en local (preview).

---

## 🎯 Veredicto general

| Área | Estado |
|---|---|
| Código del sitio | ✅ **Correcto** — probado en local: carga 11 productos, 5 categorías, modales, buscador y panel operativos, consola sin errores |
| Archivos publicados | ✅ **Idénticos byte a byte** al repo `main` (comparados los 4 archivos; los "tamaños distintos" eran solo compresión gzip del CDN) |
| Backend Firestore | 🔴 **VULNERABLE** — escritura pública sin autenticación, verificada con prueba controlada |
| Datos del backend | 🟠 **Contaminados** — productos ajenos ("Franela Nike talla L") y basura de prueba |
| Panel admin | 🔴 **Cosmético** — la contraseña `"2828"` vive en el JS público y NO protege nada |

**El bug "catálogo vacío en el live" que viste antes ya no existe hoy:** el sitio remoto ahora sirve los mismos archivos que el repo y Firestore responde. Si en su momento se vio "No encontramos resultados", fue por (a) una copia desactualizada en caché del CDN/Cloudflare, o (b) que las reglas de Firestore estaban cerradas a lecturas en ese momento (durante esta auditoría hubo instantes con `PERMISSION_DENIED` para lecturas anónimas y luego se abrieron). Ambas causas son transitorias y ya quedan mitigadas si aplicas las reglas de FASE 1 (que mantienen lectura pública estable).

---

## 🔴 HALLAZGO #1 — VULNERABILIDAD CRÍTICA: Firestore es de escritura pública

**Evidencia (prueba controlada realizada durante esta auditoría):**
1. Creé un documento de prueba en `productos` desde curl, **sin sesión y sin token** → HTTP 200 (aceptado).
2. Lo eliminé después → HTTP 200. *(La base quedó limpia.)*

**Impacto real:** cualquier visitante puede, desde la consola del navegador:
- Borrar o corromper todo el catálogo (`deleteDoc` sobre cada documento).
- Insertar productos falsos (ya pasó: aparecen "Franela Nike talla L" ×2).
- Guardar imágenes/textos ofensivos que verían todos tus clientes.

**Solución:** aplicar `firestore.rules` (incluido en este repo, FASE 1 ya lista) en Firebase Console → Firestore → Reglas → Publicar. Luego, para que el panel del dueño vuelva a guardar en la nube, FASE 2:
1. Firebase Console → **Authentication** → habilitar proveedor **Email/contraseña** → crear el usuario dueño (ej. `dueno@rbstore.com`).
2. Sustituir en `firestore.rules` los bloques de la FASE 2 usando ese correo y publicar.
3. **Opcional (automatización):** conectar `signInWithCustomToken`/`signInWithEmailAndPassword` en `app.js` (línea ~350) para que el login del panel autentique de verdad contra Firebase.

---

## 🔴 HALLAZGO #2 — El panel admin no protege nada (seguridad de utilería)

- La contraseña del dueño está en texto plano en `app.js` línea 7: `adminKey: "2828"`. Cualquiera que abra el código fuente la ve y entra al panel.
- El login solo hace `isAdminLoggedIn = true` en el navegador del visitante: **no autentica nada en el servidor**. Las reglas actuales permiten escribir a cualquiera, con o sin contraseña.
- `onAuthStateChanged` (línea ~350) desbloquea el panel para **cualquier usuario anónimo de Firebase que exista**, porque no filtra por correo.

**Solución:** la FASE 2 de las reglas. La contraseña del panel puede quedarse como conveniencia de UI, pero la seguridad real debe venir de la autenticación + reglas del servidor.

---

## 🟠 HALLAZGO #3 — Datos contaminados en producción

Contenido actual de Firestore (verificado por API):
- `productos`: "Franela Nike talla L" ×2 (categoría `franelas_deportivas`, de otro negocio) + 4 productos reales de tech ("Cable Lightning", "Cable type C", "Cargador dynamic 60w" — duplicados parciales de los por defecto) + 1 doc de prueba (ya eliminado por mí).
- `categorias`: "Franelas deportivas" 🎽.
- El código **fusiona** Firestore con los 11 productos por defecto → el catálogo en vivo muestra los 11 tech **+ los ajenos**. Además, como los 2 documentos duplicados tienen IDs distintos de `rb8`/`rb9`/`rb10`, los merges no los detectan y pueden verse duplicados.

**Solución (limpieza, en este orden):**
1. Aplicar FASE 1 de las reglas (cerrar escritura) para que no sigan entrando.
2. Firebase Console → Firestore → borrar los documentos: `productos` con nombre "Franela Nike talla L" (los 2) y `categorias/franelas_deportivas`.
3. Opcional: eliminar los duplicados parciales (`Cable Lightning`, `Cable type C`, `Cargador dynamic 60w`) si prefieres servir solo los 11 por defecto — el merge por nombre ya los reemplaza, no es imprescindible.
4. Con FASE 2 aplicada, volver a guardar desde el panel del dueño los productos que quieras en la nube.

---

## 🟡 HALLAZGO #4 — Secretos públicos de bajo impacto

| Secreto | Dónde | Riesgo |
|---|---|---|
| API key Firebase | `firebase-config.js` | Bajo (es pública por diseño; el peligro real era #1) |
| API key ImgBB | `app.js` ~línea 1042 | Medio: cualquiera puede consumir tu cuota de subida de imágenes |
| Token GitHub del dueño | Se pega en el navegador (`localStorage`) | Si se pega en una PC compartida, queda expuesto localmente. Nunca pegarlo en dispositivos ajenos; usar token con expiración y alcance mínimo |

Las restricciones recomendadas (restringir la API key de Firebase por dominio HTTP referrer; rotar la clave de ImgBB) son de duración media y conviene hacerlas cuando toque.

---

## 🟢 HALLAZGO #5 — Bugs menores de calidad (no rompen la web)

1. **Página "oficial" remitida no existe:** `https://yesmar.traccionweb.com/` da 404 (GitHub Pages). Su `script.js` NO comparte el proyecto Firebase con RBstore (verificado): la contaminación no vino de ahí.
2. **XSS reflejo en el catálogo:** nombre/descripción se insertan con `innerHTML` sin escapar (líneas ~469 y ~546). Hoy el único que puede crear productos es quien quiera vandalizar; cuando cierres las reglas, el riesgo baja a tu propio panel. Mejorar en una próxima iteración (escapar HTML o usar `textContent`).
3. **`rb11` (MagSafe) y `rb3`:** `rb3` no existe en los datos por defecto (id salteado) — cosmético.
4. **`catalog.json` está huérfano en la web:** el usuario final nunca lo carga; solo sirve para el flujo de Auto-Sync a GitHub. No confundirlo con la fuente de datos real (Firestore).
5. **Doble `initApp()` defensivo:** la página inicializa dos veces por diseño (fail-safe). Inofensivo, aunque duplica logs en consola.
6. **Contador del hero** ya no usa animación por scroll (solo al iniciar) — cosmético.
7. **Módulo `script.js` viejo** sigue en el repo (herencia del proyecto original); no se carga desde `index.html` nuevo. Archivar/eliminar para evitar confusión.

---

## ✅ Lo que está BIEN (verificado en vivo, local)

- Carga de Firebase SDK modular v10 con degradación elegante a modo offline.
- Fusión Firestore + defaults con exclusión de borrados (`rbstore_deleted_product_ids`) — solidísimo para evitar "zombis".
- Compresión de imágenes cliente (10 MB → ~50 KB) con triple fallback: ImgBB → Firebase Storage → base64 local.
- Auto-Sync del catálogo a GitHub Pages vía token del dueño (solo si se configura).
- Pedidos por WhatsApp con plantilla, cantidad y total en el modal.
- Menú móvil, buscador con botón de limpiar, scroll suave, trigger secreto del panel (3 clics en el logo).
- Responsive y accesibilidad básica correctas (labels, aria, roles).

---

## 📋 Plan de acción priorizado

| # | Acción | Esfuerzo | Cuándo |
|---|---|---|---|
| 1 | Publicar `firestore.rules` FASE 1 (cerrar escritura) | 2 min | **HOY** |
| 2 | Limpiar Firestore: borrar franelas + categoría ajena | 5 min | HOY |
| 3 | Crear usuario dueño en Authentication + FASE 2 en reglas | 15 min | Esta semana |
| 4 | (Opcional) Conectar login real del panel a Firebase Auth | 1 h | Próxima iteración |
| 5 | (Opcional) Escapar HTML en tarjetas y tabla admin | 45 min | Próxima iteración |
| 6 | Rotar clave ImgBB y restringir API keys por dominio | 20 min | Cuando toque |
| 7 | Eliminar `script.js`/restos del proyecto viejo | 5 min | Cuando toque |
