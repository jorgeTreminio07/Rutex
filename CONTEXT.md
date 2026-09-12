# Rutex — Contexto del proyecto

> Contexto acumulado del desarrollo. Actualizar conforme cambie el estado.

## Apilamiento
- **App**: Next.js (App Router, Tailwind v4, shadcn/ui, React Query, Zustand, jsPDF).
- **Backend/DB**: Supabase (PostgreSQL). RLS por tabla; API server-side en `src/app/api/**`.
- **Hora**: la tienda opera en Nicaragua (UTC-6, sin horario de verano). Filtros de fecha y "hoy" por defecto usan offset −6 h. El `DatePicker` (`src/components/ui/date-picker.tsx`) calcula su "Hoy"/vista por defecto con hora Nicaragua (`nicaToday`), no con la hora local de la máquina.
- **Imágenes**: se usa `next/image` con `images.unoptimized: true` en `next.config.ts` (las imágenes se sirven directo desde Supabase Storage/URLs externas; por eso no se exige `remotePatterns`).
- **Regla**: NO commitear/pushear sin que el usuario lo pida expresamente.

## Estados de pedidos (tabla propia)
- `public.order_statuses`: ids **4**=Eliminado, **5**=En proceso, **6**=Aprobado, **7**=Rechazado.
- `orders.status_id` referencia `order_statuses` (la FK se repuntó desde `statuses`).
- `public.statuses` (ids 1–4: Activo/Inactivo/Bloqueado/Eliminado) queda solo para roles, perfiles y productos.
- Los joins en la API usan `order_statuses!inner(name)`. El campo del DTO sigue siendo `statusId`/`status`.

## Pedidos
- Número de pedido: `PED[YYYYMMDD][6 dígitos]` sin guiones, seqdiario irrepetible vía RPC `next_order_number()` (tabla `order_counters`, patch 004).
- Crear pedido → status 5. **Aprobar (6)** descuenta stock de los productos. **Rechazar (7)** NO toca stock. **Eliminar** devuelve stock si estaba aprobado y pone status 4.
- **`POST /api/orders` es público** (el carrito deslogueado también registra el pedido y avisa por WhatsApp): usa `createAdminClient()` (service role) para no depender de permisos RLS de `anon`. `GET` sigue con sesión/admin. `createAdminClient` (`src/lib/supabase/admin.ts`) está tipado `SupabaseClient<any, "public", any>` (sin ese tipado el TS resuelve `never`).
- **Nuevo pedido (interno)**: botón "Nuevo pedido" en `/pedidos` abre `order-form-dialog.tsx` (`src/features/orders/components/`). Funciona como el carrito logueado pero el cliente se elige con **combobox de búsqueda** sobre clientes registrados (nombre/teléfono/cédula; sin inputs libres de nombre/teléfono); productos con steppers (límite = stock) + buscador; modalidad de pago contado/2 quincenas/4 semanas. Al guardar crea el pedido, genera y sube la proforma y abre WhatsApp al cliente (mensaje igual al carrito logueado).
- **Proforma** (patch 022): `orders.proforma_url` guarda la URL del PDF. Se genera y sube **una sola vez, al crear el pedido, server-side en `POST /api/orders`** (`generateAndStoreProforma`, best-effort: si falla devuelve `null` sin romper el alta). La **clave del archivo se sanitiza** con `sanitizeStorageKeySegment` (`src/lib/assets.ts`): apóstrofes, ñ y otros caracteres prohibidos por Supabase Storage se limpian del nombre (un cliente como `QUI'ONES` rompía el upload con `StorageApiError: Invalid key`). El endpoint de upload del fallback (`/api/catalog/proforma`) sanitiza igual su `customerId`. Los mensajes (carrito logueado, pedido interno, aprobación/reenvío en `orders-view`) **reutilizan `order.proformaUrl`** en vez de regenerar/subir de nuevo. Pedidos legacy sin URL: `sendApprovalMessage` genera+sube y persiste vía `POST /api/orders/[id]/proforma` (admin) para que el siguiente envío reutilice. El fallback cliente del form interno (`order-form-dialog.tsx`) es **best-effort no fatal**: si el servidor no devolvió URL, genera y sube en cliente dentro de un `try/catch` y, si también falla, abre igual el `OrderActionDialog` (con `proformaUrl` null) sin toasts de error espurios (el toast de error real lo da `useCreateOrder`).
- **Acción tras crear pedido** (`order-action-dialog.tsx`): al crear un pedido (form interno o carrito logueado) se abre un modal para elegir **enviar mensaje con proforma** (WhatsApp, como antes) o **imprimir recibo** (58/80 mm).
- **Re-notificar desde Pedidos** (`order-detail-dialog.tsx` + `orders-view.tsx`): el modal de detalle muestra el botón **"Notificar al cliente"** para pedidos **En proceso (5)** y **Aprobado (6)**; abre el **mismo `OrderActionDialog`** (enviar proforma+WhatsApp **o** imprimir recibo). Para pedidos legacy sin proforma, `handleNotify` en `orders-view.tsx` genera+sube y persiste la URL (`POST /api/orders/[id]/proforma`) antes de abrir el modal. Aprobar sigue igual (aprueba + `sendApprovalMessage`); el botón viejo "Enviar mensaje" de aprobado se reemplazó por Notificar al cliente.
- **Recibo térmico 58/80 mm** (`src/features/printing/`): se genera en cliente. `lib/escape-pos.ts` encoda ESC/POS (codepage CP850, tildes/ñ/¿/º/ª/°; sin dependencias). `lib/receipt.ts` arma el contenido (tienda, dirección, Fecha **con hora**, Pedido, **Cliente**, Vendedor + Teléfono, tabla Cant/Descripción/Valor, TOTAL, "Muchas gracias!" sin ¡, todo con fecha/hora Nicaragua `America/Managua`). **Los textos largos (tienda, dirección, Pedido, Cliente, Vendedor, Tel) hacen word-wrap** en el espacio más cercano al ancho (`wrapLines`/`pushWrapped`); los productos se trunc simplmente con "…". `lib/bluetooth.ts` conecta por **Web Bluetooth** (solo impresoras BLE; declara `optionalServices` con `RECEIPT_SERVICES` 0x18f0/0xff00/0xff02/0x1101/0x180a para que `requestDevice` no bloquee el acceso a servicios; busca característica escribible; envía por bloques) y `components/receipt-print-view.tsx` muestra la vista previa + selección de impresora. Requiere Chrome/Edge y HTTPS; **Brave no lo soporta**, **iPhone/iOS no tiene Web Bluetooth** (WebKit) y Bluetooth clásico (SPP) **no** es compatible con navegadores. DevDependency solo de tipos: `@types/web-bluetooth`. **Papel**: el selector del modal permite elegir **58 mm (32 chars)** u **80 mm (48 chars)**, por defecto 58 mm; `RECEIPT_PAPER_SIZES`/`RECEIPT_PAPER_WIDTHS` en `lib/receipt.ts` parametrizan columnas y truncados.
- Al **eliminar** un pedido (soft delete: `deleted_at` + status 4), el trigger `trg_orders_cleanup_cartera` (patch 012) elimina sus filas de `pagos`, `abonos` y `abono_registros` (el `ON DELETE CASCADE` de las FK solo aplica a borrado físico).
- Las filas/tarjetas de la vista de pedidos son clicables; aprobar/rechazar/eliminar están dentro del **modal de detalle** (`order-detail-dialog.tsx`).
- El filtro de fecha usa `DatePicker` personalizado (no nativo).
- UI de pedidos: tabla (desktop) y lista (móvil) en `src/features/orders/`.

## Selectores / UI
- Tab bar móvil: solo 3 secciones (Inicio, Configuración, Usuarios) vía `MOBILE_TABS` en `src/components/layout/navigation.ts` (`PRIMARY_TABS` ya no se usa en el tab bar).
- Menú lateral móvil (`mobile-nav-sheet.tsx`): incluye `NAV_CLIENTS` dentro del grupo de Clientes (además del acceso directo del sidebar desktop).
- Sidebar por grupos ("Tienda", "Usuarios"): cada grupo tiene su propio estado de abierto/cerrado (`openGroups: Set<string>` en `sidebar.tsx`), se abre por defecto el de la ruta activa.
- **Paleta**: teal "médico" actual (hue oklch ~195-200 en `src/app/colors.css`). Se intentó cambiar a ámbar comercio pero el usuario **lo revirtió** — mantener la paleta teal actual.
- **Favicon** (`public/favicon.svg`): ícono de tienda en teal `#008484` (antes estetoscopio).

## Clientes
- Tabla `public.clients` (patch 018): `full_name`, `phone`, `cedula` (**sin guiones**, se sanitiza en API/UI), `address`, `city` (texto libre con sugerencias de `cities`), `latitude`/`longitude` (opcionales, ambas o ninguna), `created_at`, `updated_at`. **Estados** (patch 019): `status_id` FK `public.statuses` (1=Activo, 2=Inactivo, 3=Bloqueado, 4=Eliminado) + `deleted_at`. RLS lectura autenticada / escritura admin.
- **Eliminar = borrado lógico**: `DELETE /api/clients/[id]` (admin) pone `status_id=4` + `deleted_at`; el GET **no devuelve** clientes en estado 4 (`.neq("status_id", 4)`). La UI no ofrece reactivar.
- **Mapa**: selector de ubicación con Leaflet (`src/features/clients/components/map-picker.tsx`, import dinámico para no romper SSR; CSS global en `src/app/layout.tsx`). Se abre/enciende dentro del formulario ("Abrir mapa para elegir ubicación"); clic en el mapa o "Usar mi ubicación" (geolocalización) llenan lat/lng. Tile de OpenStreetMap (requiere internet).
- APIs: `GET/POST /api/clients`, `GET/PUT /api/clients/[id]` (admin). Hooks `useClients/useCreateClient/useUpdateClient` (`clientsKeys.all`, refetch 10s).
- UI en `src/features/clients/` (vista con búsqueda por **nombre o cédula**, sin filtro de fecha, tabla + lista móvil, fila clicable → editar) y modal `client-form-dialog.tsx` (nombre*, teléfono*, cédula sin guiones, dirección, ciudad combobox, coordenadas + mapa). Botón "Agregar cliente". Ruta `/clientes`, nav `NAV_CLIENTS` en grupo "Clientes" del sidebar (entre Tienda y Usuarios).

## Configuración
- `src/features/store/views/store-settings-view.tsx`: formulario de tienda, cuentas bancarias y **sección Ciudades** (debajo de bancos).
- `public.cities`: `id int generated by default as identity` (autoincremental desde 1), `name` único case-insensitive, RLS lectura autenticada / escritura admin.
- APIs: `GET/POST /api/cities`, `DELETE /api/cities/[id]`; hooks `useCities/useAddCity/useDeleteCity` en `use-store.ts`.

## Inventarios
- Tabla `public.inventories` (patch 013): `inventory_number`, `items` jsonb `[{ productId, productName, quantity }]`, `total_value` numeric (patch 017, ver abajo), `created_at`, `updated_at`. **Sin DELETE** (sin política de borrado; la UI no ofrece eliminar).

## Productos
- **Código de barras** (patch 021): columna opcional `barcode` en `products` (sin restricción única, se limpia en la API). El formulario `product-form-dialog.tsx` usa **solo el botón Escanear** (cámara, sin campo de escritura manual): al escanear se muestra el código y se puede re-escanear/quitar. Opcional.
- **Escáner de cámara**: componente compartido `BarcodeScannerDialog` (`src/components/barcode/barcode-scanner-dialog.tsx`, lib `html5-qrcode`, import dinámico para SSR). Se usa en el form de producto y en el pedido interno (`order-form-dialog.tsx`), donde además la búsqueda de productos matchea por nombre, categoría **y** barcode (botón con ícono al lado del buscador).
- `ProductDto` expone `barcode` (nullable) y `CreateProductPayload`/`UpdateProductPayload` aceptan `barcode?`. Se incluye en `PRODUCT_SELECT` de `/api/products` (`route.ts` y `[id]/route.ts`) y en el catálogo público `/api/catalog`.
- **Valor de inventario** (patch 017): columna `total_value` = suma(precio de venta × cantidad) de sus items. Se calcula en el servidor al crear/editar (`computeInventoryValue` en `src/app/api/inventories/helpers.ts`, con los precios vigentes de `products`) y se guarda como snapshot. El DTO expone `totalValue` y aparece como columna "Valor" en tabla y listado móvil.
- Número de inventario: `INV[YYYYMMDD][6 dígitos]` vía RPC `next_inventory_number()` (tabla `inventory_counters`), mismo patrón que pedidos.
- **Al crear**: el modal lista TODOS los productos iniciando en 0 (sin importar su stock real); se suma/resta por producto. Al guardar, el stock del producto **AUMENTA** según lo ingresado.
- **Al editar**: se muestra el inventario con las cantidades guardadas; al bajar/subir y guardar, el stock se ajusta por la **diferencia** (nueva − anterior); nunca baja de 0.
- APIs: `GET/POST /api/inventories`, `GET/PUT /api/inventories/[id]` (sin DELETE). Lógica de deltas en `src/app/api/inventories/helpers.ts`. Hooks `useInventories/useCreateInventory/useUpdateInventory` (`inventoriesKeys.all`); crear/editar invalida inventarios **y** productos (stock cambia).
- UI en `src/features/inventories/` (vista con búsqueda por número + DatePicker, filtro de fecha **vacío por defecto**, tabla + lista móvil, fila clicable → editar) y modal `inventory-form-dialog.tsx` (stepper +/- por producto **con cantidad editable a teclado**: el número es un input numérico que filtra no-dígitos y se selecciona al enfocarlo, además de los botones). Ruta `/inventarios`, nav `NAV_INVENTORIES`.
- **Stock de producto**: solo entra vía inventario (crear/editar). El campo Stock **se quitó** del formulario de producto (schema, payloads y dialog); la API sigue aceptándolo por tolerancia pero el cliente ya no lo envía. Baja al aprobar pedidos (status 6) y sube al eliminar pedidos aprobados.

## Mermas (bajas de stock)
- Tablas (patch 026): `public.merma_motivos` (catálogo de motivos genéricos sembrado, id+name, RLS lectura autenticada/escritura admin) y `public.mermas`: `merma_number` `MER[YYYYMMDD][6 dígitos]` vía RPC `next_merma_number()` (tabla `merma_counters`), `motivo_id` FK `merma_motivos`, `items` jsonb `[{ productId, productName, quantity, purchasePrice, sellPrice }]`, `total_value` (suma precio de venta × cantidad, snapshot server-side), `observation`, `created_at`, `updated_at`.
- **Crear** (POST `/api/mermas`, admin): el server enriquece cada item con nombre y precios de compra/venta **vigentes**, valida el motivo, y aplica **deltas NEGATIVOS** al stock. **No permite dar de baja más de lo que hay en stock** (`validateStock` en `helpers.ts`, rechaza con 400 indicando producto/stock solicitado); el `Math.max(0, …)` de `applyStockDeltas` queda solo como salvaguarda.
- **Editar** (PUT `/api/mermas/[id]`): ajuste de stock = **anterior − nueva** (bajar la merma devuelve stock, subirla lo resta; productos que se quitan devuelven todo). Validación de stock con allowance = stock actual + cantidad ya restada por la merma.
- **UI**: el stepper del form (`merma-form-dialog.tsx`) muestra `Stock` y `Máx. baja` por producto y **no deja exceder** el límite (botón + deshabilitado y texto/límite clamp, incluida la edición).
- **Eliminar** (DELETE `/api/mermas/[id]`, política admin `mermas_delete` — **sin política no se elimina, falla 403**): borrado **físico** y se **devuelve el stock** restado de cada item (reversa).
- APIs: `GET/POST /api/mermas`, `GET/PUT/DELETE /api/mermas/[id]`, `GET /api/mermas/motivos`. DTO `MermaDto`/`MermaMotivoDto`/payloads en `src/types/interfaces/merma.interface.ts`. Hooks `useMermas/useMermaMotivos/useCreateMerma/useUpdateMerma/useDeleteMerma` (`mermasKeys.all`/`motivos`); crear/editar/eliminar invalidan mermas **y** productos (stock cambia).
- UI en `src/features/mermas/` (vista con búsqueda por número o motivo + DatePicker vacío por defecto, tabla + lista móvil, fila clicable → editar) y modales `merma-form-dialog.tsx` (**combobox de motivo** con búsqueda + campo Observaciones + steppers por producto que muestran el stock) y `merma-delete-dialog.tsx` (avisa que el stock se devuelve). Acciones editar (lápiz) y eliminar (basura) en tabla y lista móvil. Ruta `/mermas`, nav `NAV_MERMAS` en grupo Tienda del sidebar **debajo de Cartera**.

## Almacén / Entregas
- Tabla `public.deliveries` (patch 014): una fila por pedido aprobado (`order_id` FK orders, índice único), `status_id` FK `delivery_statuses` (**1=En almacén, 2=En ruta, 3=Entregado**), `entered_at` (fecha/hora de ingreso al almacén). Identificador = número de pedido (vía join).
- **Al aprobar** un pedido (status 6), `PUT /api/orders/[id]` inserta la entrega con estado 1 si no existe (solo la primera vez).
- **Avanzar estado**: `PUT /api/deliveries/[id]` con `{ statusId }`; el servidor solo acepta el estado **siguiente** (actual + 1), nunca revertir ni saltar. Sin DELETE.
- **Al eliminar** un pedido aprobado (soft delete), el trigger `cleanup_order_cartera` (ampliado en patch 014) borra también su fila de `deliveries`.
- APIs: `GET /api/deliveries` (join `orders!inner` + `delivery_statuses!inner`, orden por `entered_at desc`), `PUT /api/deliveries/[id]`. DTO `DeliveryDto` (`src/types/interfaces/delivery.interface.ts`) con filtros/helpers: `matchesDeliveryStatus`, `deliveryStatusVariant`, `nextDeliveryStatus`.
- UI en `src/features/deliveries/` (vista con búsqueda pedido/cliente + Select de estado + DatePicker **vacío por defecto**, filtros client-side con hora Nicaragua, tabla + lista móvil, fila clicable → detalle) y modal `delivery-detail-dialog.tsx` (número de pedido, cliente, teléfono, fecha y hora de ingreso en Nicaragua `nicaDateTime`, lista de productos con cantidad) + `delivery-advance-dialog.tsx` (confirmación: "no se puede revertir"). Ruta `/almacen`, nav `NAV_DELIVERIES`.
- Hooks `useDeliveries/useAdvanceDeliveryStatus` (`deliveriesKeys.all`); avanzar invalida solo entregas. El modal se deriva de la query fresca (patrón cartera).

## Rutas
- Tablas (patch 023): `public.routes` (route_code `RUT[YYYYMMDD][6 dígitos]` vía RPC `next_route_number()` + tabla `route_counters`, `type` 'visita'|'entregas', `status` 'en_proceso'|'completada'|'cancelada', `created_at`, `updated_at`) y `public.route_clients` (route_id FK routes ON DELETE CASCADE, client_id FK clients, `visit_order` entero, `status` 'pendiente'|'completada'|'cancelada', `observation` nullable, FK única `(route_id, client_id)`).
- **Estado de ruta**: al actualizar un cliente de ruta (PUT), si **todos** los clientes tienen estado final (completada **o** cancelada, mezcla permitida) → ruta `completada`; si queda algún `pendiente` → `en_proceso`. "Cancelar ruta" (PATCH) pone la ruta en `cancelada` directo, sin recomputar.
- **Orden de la mejor ruta (definitivo)**: se calcula **una sola vez, al crear la ruta** en `POST /api/routes`: exige la **ubicación actual** (`start: { lat, lng }`, 400 si falta — "Enciende la localización"), lee lat/lng de los clientes, aplica `computeBestRoute` (vecino más cercano desde mi inicio, `src/features/routes/lib/route-path.ts`) y guarda ese orden en `route_clients.visit_order` (los clientes sin coordenadas van al final). El detalle y el mapa **NO recalcular**: usan siempre el `visit_order` guardado. Rutas creadas antes del patch conservan su orden viejo (no hay migración).
- **GPS obligatorio**: el formulario (`route-form-dialog.tsx`) pide la ubicación al crear ("Enciende la localización…" si se deniega, error inline en el modal); el botón "Agregar ruta" se deshabilita con spinner desde el primer clic (`submitting` local, no solo `createRoute.isPending`, para cubrir el lapso de `getCurrentPosition`). El mapa (`route-map.tsx`) también exige GPS al abrir: si no hay ubicación muestra aviso + botón **Reintentar**; sin GPS no se puede ver el mapa.
- **Mapa con calles**: los puntos llegan YA ordenados por `visit_order`; se dibuja mi ubicación (marcador verde "INICIO"), clientes numerados y la ruta **por calles/carreteras** consultando a **OSRM** público `https://router.project-osrm.org/route/v1/driving/{lng},{lat};...?overview=full&geometries=geojson` (gratis, sin key, datos OpenStreetMap); `fetchRoadRoute` devuelve `[lat,lng]` o `null`. Si OSRM falla, se mantiene la **línea recta como respaldo**. Indicador "Calculando ruta por calles…" mientras carga. Leaflet dinámico con guardas anti-carreras (`active`, `container.isConnected`, `_leaflet_id`, try/catch).
- **Cancelar/eliminar**: "Cancelar ruta" junto a "Ver mapa" (solo si `en_proceso`); eliminar (trash en tabla y lista móvil + `RouteDeleteDialog` + `DELETE /api/routes/[code]`). El dialog de eliminar **cierra siempre** (éxito o error) y el error se ve en toast. El patch 024 agrega la política DELETE admin (**idempotente** con `drop policy if exists`; si no se aplica, eliminar falla 403).
- APIs: `GET/POST /api/routes`, `GET/PATCH/DELETE /api/routes/[code]`, `PUT /api/routes/[code]/clients/[clientId]`. Hooks `useRoutes/useCreateRoute/useRouteByCode/useUpdateRouteClient/useCancelRoute/useDeleteRoute` (`routesKeys.all`). `apiClient` ganó el método `PATCH`.
- UI en `src/features/routes/` (vista con búsqueda por código + Select de estado + DatePicker vacío por defecto, tabla + lista móvil, fila clicable → detalle; modal `route-client-dialog.tsx` con observación y botones apilados en columna: Completada → Cancelada → Cerrar). Rutas `/rutas` y `/rutas/[code]`, nav `NAV_ROUTES` en grupo "Rutas" del sidebar (y menú lateral móvil).
- **base-ui**: `Button` no soporta `asChild` → usar `nativeButton={false}` + `render={<Link…/>}` (patrón de `pagination.tsx`). Los `<SelectValue>` requieren `placeholder` (un `value=""` con SelectItem de valor `""` no muestra texto). Regla de lint `react-hooks/set-state-in-effect` activa: no setState síncrono en el cuerpo de un efecto (resolver con `.then` asíncrono o remonte vía `key`).

## Gastos
- Tabla `public.gastos` (patch 027): `title`, `observation` (opcional), `amount` numeric >= 0, `receipt_path` (opcional, guarda el path relativo del recibo en Storage), `created_at`, `updated_at`. RLS: lectura autenticada / escritura y borrado admin. **Borrado físico**.
- **Recibo**: se sube al guardar vía `POST /api/gastos/receipts` (admin) que valida tipo (imagen o PDF) y máx 15 MB, y guarda en la carpeta `gastos` del bucket (`uploadToStorage` + `getAssetUrl`). El DTO expone `receiptPath` (raw) **y** `receiptUrl` (público); en el modal se gestiona en un par `{ path, url }` para que el enlace "Ver recibo" apunte al archivo recién subido y no al viejo.
- **Limpiar storage**: al editar, si el recibo cambia o se quita (`receiptPath: null`), `PUT /api/gastos/[id]` borra el archivo anterior del storage (`removeFromStorage`). Al **eliminar** el gasto, `DELETE /api/gastos/[id]` borra también su recibo del storage.
- APIs: `GET/POST /api/gastos`, `GET/PUT/DELETE /api/gastos/[id]`. DTO `GastoDto`/payloads en `src/types/interfaces/gasto.interface.ts`. Hooks `useGastos/useCreateGasto/useUpdateGasto/useDeleteGasto` (`gastosKeys.all`) en `use-gastos.ts`; crear/editar/eliminar invalida solo gastos.
- UI en `src/features/gastos/` (vista con búsqueda por título/comentario + DatePicker vacío por defecto, tabla + lista móvil, fila clicable → editar) y modales `gasto-form-dialog.tsx` (título*, monto* C$, comentario opcional y subida de recibo con input de archivo `accept="image/*,pdf"`) y `gasto-delete-dialog.tsx` (avisa que también se elimina el recibo). Acciones editar (lápiz) y eliminar (basura) en tabla y lista móvil. Ruta `/gastos`, nav `NAV_GASTOS` en el área de enlaces del sidebar y menú móvil **debajo de Rutas**.

## Cartera y abonos
- Tabla `public.pago_estados`: ids 1=Pendiente, 2=Pagado, 3=En mora (estado del pago del pedido, NO del pedido).
- `public.pagos`: una fila por pedido aprobado, PK = `order_id` (FK orders, cascade), `estado_pago_id` FK `pago_estados`.
- `public.abonos`: `fecha_a_abonar`, `monto_a_abonar`, `abonado` (parciales), `pagado` bool, `fecha_pago`; se auto-generan al aprobar según `payment_type`: `contado`→1 abono hoy, `cuotas_2`→2 quincenales (15 días), `cuotas_4`→4 semanales (7 días). Reparto exacto en `buildAbonoPlan`/`splitAmount` (`src/features/cartera/lib/pagos.ts`).
- `public.abono_registros`: histórico, **una fila por cada "Registrar abono"** (`order_id`, `monto`, `fecha`); el modal los muestra uno por uno (fecha + monto + saldo restante tras el abono). Patch 011.
- Al **aprobar** un pedido (PUT `/api/orders/[id]`), si no existe su fila en `pagos`, se inserta `pagos` (1) + abonos del plan. `recomputePagoEstado` (`src/app/api/cartera/helpers.ts`) recalcula el estado: todos pagados→2, algún vencido sin pagar→3, si no→1.
- **Registrar abono** = `POST /api/cartera/[orderId]/abonos` (admin): monto>0, valida saldo (error si pago generado y saldo 0, y si el monto sobrepasa el saldo), aplica secuencialmente a abonos pendientes (campo `abonado`), marca `pagado`/`fecha_pago` al completar e inserta su fila en `abono_registros`.
- `GET /api/cartera` devuelve pedidos en cartera (con `pago_estados!inner(name)`, fecha desc) + abonos por pedido + `registros[]`; DTO `CarteraPagoDto` con `estadoPagoId`, `estadoPago`, `abonado`, `saldo`, `abonos[]`, `registros[]` (`src/types/interfaces/cartera.interface.ts`).
- UI en `src/features/cartera/` (vista con filtros cliente/pedido, estado y fecha client-side con hora Nicaragua, listado columnas Pedido/Cliente/Pago/Total/Fecha/Estado/Acciones → "Ver detalles", fila clicable) y modal `cartera-detail-dialog.tsx` (cliente, teléfono, deuda total, abonado, saldo, sección "Fechas de pago / montos" que numera las cuotas "Fecha N · fecha / monto" con estado Pendiente/Vencido/Pagado, un bloque por abono registrado con fecha+monto+saldo restante, y "Registrar abono"; no permite abonar si está saldado ni montos que sobrepasen el saldo). Ruta `/cartera`, nav `NAV_CARTERA`.
- Filtros de la vista son **client-side** (no en la API): búsqueda + Select de estado + DatePicker. El filtro de fecha **inicia vacío** (no filtra por "hoy"); solo filtra cuando el usuario escoge fecha en el DatePicker.
- El modal se deriva de la query: la vista guarda `viewingId` y busca el pedido en los datos frescos de `useCartera`, así al registrar un abono la mutación invalida, refetchea y el modal se actualiza solo.

## Caché/queries
- `ordersKeys.all`/`filtered` en `use-orders.ts`; `storeKeys.all` y `citiesKeys.all` en `use-store.ts`. `carteraKeys.all` en `use-cartera.ts` (registrar abono invalida cartera y pedidos). `inventoriesKeys.all` en `use-inventories.ts` (crear/editar invalida inventarios y productos). `deliveriesKeys.all` en `use-deliveries.ts` (avanzar estado invalida solo entregas). `routesKeys.all` en `use-routes.ts` (crear/actualizar/cancelar/eliminar invalidan la lista y el detalle). `mermasKeys.all`/`motivos` en `use-mermas.ts` (crear/editar/eliminar invalidan mermas y productos). `gastosKeys.all` en `use-gastos.ts` (crear/editar/eliminar invalida solo gastos).

## Patches de SQL (aplicar en Supabase SQL Editor, en orden)
1. `001-fix-is-admin.sql`
2. `002-products-orders.sql`
3. `003-products-purchase-price.sql`
4. `004-order-number-sequential.sql`
5. `005-order-statuses.sql`
6. `006-data-repair.sql`
7. `008-cities.sql`
8. `010-pagos-abonos.sql`
9. `011-abono-registros.sql`
10. `012-order-delete-cleanup.sql`
11. `013-inventories.sql`
12. `014-entregas.sql`
13. `015-entregas-backfill.sql` (entregas para pedidos ya aprobados que quedaron sin fila; idempotente)
14. `016-delivery-statuses-rls.sql` (fix RLS: sin él, Almacén se ve vacío porque el join `delivery_statuses!inner` se filtra a cero)
15. `017-inventories-total-value.sql` (columnas `total_value` en `inventories` + backfill del valor de inventarios existentes)
16. `018-clients.sql` (tabla `clients` con RLS)
17. `019-clients-status.sql` (estados de clientes: `status_id` FK `statuses` + `deleted_at`)
18. `020-wipe-data.sql` (**no es migración**): truncate `RESTART IDENTITY CASCADE` de `abono_registros, abonos, pagos, deliveries, orders, inventories, products, order_counters, inventory_counters`; conserva users/profiles/roles/clients/cities/statuses.
19. `021-products-barcode.sql` (columna opcional `barcode` en `products` + índice de búsqueda, sin restricción única)
20. `022-orders-proforma-url.sql` (columna `proforma_url` en `orders` para reutilizar la URL de la proforma al enviar mensajes)
21. `023-routes.sql` (tablas `routes`/`route_clients` con RLS + RPC `next_route_number`)
22. `024-routes-delete.sql` (política DELETE admin para rutas; **idempotente** con `drop policy if exists` — aplicar manualmente, sin él eliminar rutas falla 403)
23. `025-suppliers.sql` (tabla `suppliers` con RLS, estado y borrado lógico)
24. `026-mermas.sql` (catálogo `merma_motivos` sembrado + tabla `mermas` con contador/RPC `next_merma_number` + RLS; **incluye política DELETE**)
25. `027-gastos.sql` (tabla `gastos` con RLS: lectura autenticada / escritura y borrado admin)

## Despliegue
- **Producción**: Vercel con **integración nativa de GitHub** (repo `jorgeTreminio07/Rutex`, rama `master`): cada push a master se despliega solo. **NO reintroducir** el workflow de GitHub Actions (`.github/workflows/deploy.yml` se eliminó porque el doble deploy rompió producción con `MIDDLEWARE_INVOCATION_FAILED`). Los secrets `VERCEL_*` de GitHub ya no se usan.
- Env vars de Vercel (misión de las mismas 6 de `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, `NEXT_PUBLIC_SUPABASE_STORAGE_URL`.

## Scripts de mantenimiento
- `scripts/clean-proforma-storage.mjs`: borra los archivos del bucket de storage (`SUPABASE_STORAGE_BUCKET`) dentro de la carpeta `proforma` (SDK, paginado de 1000, recursivo, pide confirmación "borrar"). Requiere variar de entorno `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` al ejecutar.

## Notas / pendientes
- **Cuotas por pedido (ROOLBACK)**: se implementó `order_quotas` (patch 007) y se revirtió por decisión del usuario — **no reintroducir**. Si el patch 007 llegó a ejecutarse en la BD, la tabla `order_quotas` sigue existiendo ahí (limpiar si molesta). El código quedó limpio (sin referencias a cuotas). Reemplazada por el modelo `pagos`/`abonos` (patch 010).