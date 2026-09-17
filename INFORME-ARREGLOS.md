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

## Estado de publicación

✅ **Publicado.** Los cambios están en `main` del repo `rbstore-catalog` (commit `170d44c`, luego `f14c28b`) y la web real los sirve: `https://rbstore.traccionweb.com` entrega `app.js?v=68.0` con el login por correo y el botón de seguridad. (El dominio de GitHub Pages redirige a TraccionWeb, así que hay un solo sitio en vivo.)

## Segunda tanda de arreglos (17/09/2026)

### Bug corregido: producto invisible al recrearlo con un nombre ya borrado

El historial de borrados (`rbstore_deleted_product_ids`) guardaba **también el nombre**, y el merge contra Firestore excluye cualquier producto cuyo id **o nombre** esté en esa lista. Consecuencia: si borrabas un producto y luego creabas otro con el **mismo nombre**, se publicaba en la nube pero **nunca aparecía** en tu panel ni en la web (y cada recarga seguía ocultándolo).

- Nuevo: `removeDeletedProductRecord()` / `removeDeletedCategoryRecord()`.
- Al guardar un producto se limpian su id y su nombre de la lista de borrados, y se descarta su borrado pendiente.
- Mismo arreglo aplicado al crear categorías.
- Probado: con `"zz smoke test (borrar)"` ya en la lista de borrados, se creó de nuevo ese producto → aparece en el panel (11 filas), se publica en la nube y la marca desaparece, conservando las demás entradas.

### Nuevo: botón 🛡️ «Comprobar seguridad» en el panel

Hace una **sonda inofensiva**: intenta borrar un documento inexistente en `productos` y `categorias` desde una instancia de Firebase **sin sesión** (lo que puede hacer un visitante). No crea ni destruye nada real.

- 🔴 «TU CATÁLOGO ESTÁ ABIERTO (productos y categorías)» → faltan publicar las reglas.
- 🟢 «Protegido» → listo, nadie sin tu sesión puede escribir.

Comprobado hoy: responde 🔴 con las reglas actuales (abren solo `productos` y `categorias`; el resto de colecciones ya están cerradas).

### Verificaciones hechas en la nube real

- ✅ `Rrodriguezcesar00@gmail.com` inicia sesión y el token trae ese correo exacto → la regla estricta pasará.
- ✅ Login del panel + banda verde «✅ Conectado a la nube».
- ✅ Agregar producto con foto → publicado en 3,3 s (documento de 14 KB).
- ✅ Borrar desde el panel → eliminado también de la nube.
- ✅ Cerrar sesión de la nube deja `currentUser` en null.
- ⚠️ **El registro público está ABIERTO**: se pudo crear una cuenta cualquiera solo con la API key (se eliminó en el momento). Por eso las reglas quedaron **amarradas a tu correo**, no solo a «estar logueado».
- ✅ La nube quedó limpia: **3 productos tuyos**, 0 categorías, sin residuos de prueba.
- ⚠️ Publicar reglas por API devuelve **401** (Google exige OAuth de consola): es el único paso que solo puedes hacer tú.

## ÚNICO paso manual pendiente: publicar las reglas

1. **Firebase Console → Firestore Database → pestaña «Reglas»**: borra todo, pega el contenido de `firestore.rules` y pulsa **Publicar**.
2. **Panel Dueño → 🛡️ Comprobar seguridad**: debe responder **🟢 Protegido**.
3. Opcional: **Authentication → Settings → User actions** → desactiva **«Enable create (sign-up)»** para que nadie pueda registrarse en tu proyecto.
4. Si algún día cambias de cuenta de dueño, actualiza el correo dentro de `firestore.rules` en la función `esDueno()`.
