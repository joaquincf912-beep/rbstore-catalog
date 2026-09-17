# 🔧 Arreglo del guardado de productos — RBstore

**Fecha:** 17/09/2026 · **Archivos tocados:** `app.js`, `index.html`

## Por qué fallaba agregar / editar un producto

Reproduje el flujo completo en un navegador real y estas son las causas, comprobadas con evidencia:

| # | Causa encontrada | Evidencia |
|---|---|---|
| 1 | **La clave de ImgBB no sirve** | `POST api.imgbb.com` → `400 Invalid API v1 key` |
| 2 | **Firebase Storage no existe** (bucket 404) y el SDK **reintenta hasta 8 veces sin rendirse** → la foto se quedaba "cargando" para siempre | `OPTIONS .../o → 404 (Preflight)` repetido 8+ veces; el formulario nunca terminaba |
| 3 | **La foto terminaba como texto base64 dentro del producto** y Firestore rechaza documentos de más de **1 MB** → el guardado en la nube fallaba | documentos actuales de hasta **529.292 bytes**; una foto real de 1,7 MB supera el límite |
| 4 | El error de la nube se avisaba poco y el producto **solo se veía en el celular del dueño**, nunca en la web para los clientes | el guardado dependía de un `catch` con aviso breve |
| 5 | Al **editar**, si la categoría del producto no estaba en la lista, el selector la cambiaba **en silencio** a la primera de la lista | `select.value = p.sector` no aplica si la opción no existe |
| 6 | La foto se procesaba/ subía **dos veces** (al elegirla y al guardar) → doble espera | dos llamadas al mismo pipeline |

## Qué se cambió

1. **Presupuesto de imagen**: toda foto se re-codifica a JPEG y se reduce por pasos hasta quedar en **~190 KB máximos** (`FIRESTORE_IMG_TARGET_CHARS`), con techo de seguridad de 800.000 caracteres. Antes: PNG/base64 sin límite → error de guardado.
2. **Subida con tiempo límite**: Firebase Storage ahora usa `uploadBytesResumable` con 5 s de espera y **se desactiva tras el primer fallo de la sesión** (ya no deja el formulario colgado). Igual criterio para la clave de ImgBB inválida.
3. **Cola de pendientes**: si la nube rechaza el guardado, el producto queda marcado como `⏳ sin publicar`, aparece el botón **"Sincronizar pendientes (n)"** y se reintenta solo al recuperar internet o al abrir la web. Nada se pierde en silencio.
4. **Sin duplicados al editar**: si el id cambió (producto venido de Firestore), se reemplaza por nombre en vez de crear otra fila.
5. **La categoría ya no cambia sola**: si la categoría del producto no existe, se agrega como opción `⚠️ ... (categoría desconocida)`.
6. **Una sola subida por foto**: se reutiliza la imagen ya procesada al pulsar Guardar.
7. **Mensajes claros**: toasts largos con el motivo real (`permisos denegados`, `sin conexión`, `documento demasiado grande`).
8. **Caché**: `app.js?v=67.0` y `style.css?v=67.0` para que el navegador de los clientes no siga usando la versión vieja.

## Pruebas realizadas (navegador real, Firestore real)

- ✅ Agregar producto con foto de cámara de **1,7 MB** → guardada como **137 KB**, publicada (`🔥 Producto publicado para todos`), documento de 192 KB en Firestore.
- ✅ Editar ese producto (precio 7.50 → 11.25 y categoría correcta) → actualizado en Firestore, **sin duplicar fila**.
- ✅ Foto elegida dos veces → se sube una sola vez.
- ✅ Cambio rechazado por la nube → queda **pendiente (1)**, el botón aparece y el aviso explica el fallo; el cambio no se pierde.
- ✅ Recarga de la página → los pendientes se reintentan solos.
- ✅ Consola sin errores de JavaScript (11 productos, 5 categorías).

*El producto de prueba usado se eliminó de Firestore al terminar.*

## Pendiente para que se vea en la web

Los cambios están en `_rbstore_src/` (copia local del repo `rbstore-catalog`). Hay que **subirlos** (commit + push a `main`) para que GitHub Pages / TraccionWeb los sirva.

Además sigue pendiente de decisiones tuyas:

- Las reglas de Firestore **continúan abiertas** (cualquiera puede escribir el catálogo). El archivo listo está en `firestore.rules`.
- Quedan datos ajenos en la nube: categoría **🎽 Franelas deportivas** y 2 productos **"Franela Nike talla L"**, además de 2 documentos de 529 KB con fotos sin optimizar.
