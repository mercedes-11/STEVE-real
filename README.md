# Islabonita

E-commerce de piezas knitted desarrollado con Next.js, React y Supabase. Incluye landing, catálogo, detalle de producto, autenticación, perfil, carrito, checkout, historial de órdenes, panel admin y Checkout Pro de Mercado Pago con webhook.

## URL Pública

- Producción en Vercel: completar con la URL pública final del proyecto.
- Deploy automático: Vercel conectado al repositorio.
- Preview por PR: Vercel genera previews para pull requests cuando el repositorio está conectado.

> No se incluyen claves reales ni datos sensibles en este repositorio.

## Stack Tecnológico

- Next.js 14 con App Router
- React 18
- JavaScript
- Supabase Auth
- Supabase Database
- Supabase JS SDK
- API Routes de Next.js
- Mercado Pago Checkout Pro
- Vercel
- GitHub Actions
- CSS global propio

## Funcionalidades Actuales

- Landing responsive con productos destacados.
- Catálogo desde `GET /api/productos`.
- Detalle desde `GET /api/productos/[id]`.
- Registro con Supabase Auth e inserción en `public.usuarios`.
- Login y cierre de sesión.
- Perfil de usuario en `/perfil`.
- Carrito local con React Context y `localStorage`.
- Sincronización mínima del carrito con `public.carrito` cuando hay sesión.
- Checkout por transferencia bancaria.
- Checkout Pro real de Mercado Pago.
- Webhook de Mercado Pago para confirmar pagos.
- Creación de órdenes y detalles.
- Validación server-side de productos, cantidades, precios y stock.
- Stock descontado desde servidor.
- Historial de compras en `/ordenes`.
- Panel admin protegido por `public.admins`.
- CRUD admin de productos: listar, crear, editar, modificar stock y desactivar.
- Catálogo público filtrado por productos activos.

## Flujo de Pago

### Transferencia Bancaria

El flujo de transferencia se mantiene con `POST /api/ordenes`:

1. Valida usuario autenticado.
2. Valida carrito.
3. Busca productos reales en Supabase.
4. Calcula total en servidor.
5. Crea orden con `estado = pendiente_pago`.
6. Crea filas en `detalle_ordenes`.
7. Descuenta stock.

### Mercado Pago Checkout Pro

Mercado Pago usa un flujo separado:

1. El usuario elige Mercado Pago en `/checkout`.
2. El frontend llama a `POST /api/mercadopago/preferencia`.
3. La API valida sesión, productos, precios y stock.
4. Se crea una orden con:
   - `metodo_pago = mercado_pago`
   - `estado = pendiente_pago_mp`
   - `external_reference`
   - `mp_preference_id`
5. Se crean las filas en `detalle_ordenes`.
6. Se crea la preferencia en Mercado Pago.
7. Se redirige al usuario al `init_point` de Checkout Pro.
8. No se descuenta stock al crear la preferencia.
9. Mercado Pago llama al webhook.
10. Si el pago llega con `status = approved`, el webhook consulta el pago real y llama a `public.confirmar_pago_mercadopago`.
11. La función verifica stock actual, descuenta stock y marca la orden como `pagado`.

Si el pago aprobado llega cuando ya no hay stock suficiente, la orden queda con:

- `estado = pago_aprobado_sin_stock`
- `mp_status = approved`
- `stock_error` con el motivo

En ese caso no se descuenta stock y la orden no queda como pagada.

Estados relevantes:

- `pendiente_pago`
- `pendiente_pago_mp`
- `pagado`
- `pago_rechazado`
- `pago_aprobado_sin_stock`

## Variables de Entorno

Crear `.env.local` para desarrollo y configurar las mismas variables en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
```

Notas:

- `MERCADOPAGO_ACCESS_TOKEN` debe ser secreto y solo se usa en API Routes.
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` queda disponible para frontend, aunque el flujo actual usa redirección a `init_point`.
- `NEXT_PUBLIC_SITE_URL` debe apuntar a la URL pública de Vercel en producción.

Webhook Mercado Pago:

```txt
{NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook
```

En desarrollo local, Mercado Pago necesita una URL pública para llegar al webhook. Para probar webhook localmente se puede usar un túnel como ngrok y configurar `NEXT_PUBLIC_SITE_URL` con esa URL temporal.

## Arquitectura General

La aplicación usa App Router. Las páginas viven en `app/`, los componentes reutilizables en `components/`, las utilidades compartidas en `lib/`, los assets en `public/assets/` y las API Routes en `app/api/`.

Las rutas protegidas reciben el access token de Supabase como Bearer token y operan con anon key, respetando RLS. No se usa `service_role`.

`data/products.js` queda como respaldo legacy. El flujo principal de home, catálogo y detalle lee desde API/Supabase.

## Rutas Principales

- `/`: landing con productos destacados desde API.
- `/productos`: catálogo público.
- `/productos/[id]`: detalle de producto activo.
- `/login`: inicio de sesión.
- `/register`: registro.
- `/perfil`: perfil del usuario autenticado.
- `/carrito`: carrito.
- `/checkout`: checkout.
- `/ordenes`: historial de compras.
- `/admin`: acceso admin.
- `/admin/productos`: CRUD de productos.

## API Routes Implementadas

### Públicas

- `GET /api/productos`: lista productos activos.
- `GET /api/productos/[id]`: obtiene un producto activo.

### Usuario Autenticado

- `POST /api/carrito`: inserta o incrementa un producto en `public.carrito`.
- `POST /api/ordenes`: crea orden por transferencia y descuenta stock.
- `GET /api/ordenes`: devuelve órdenes propias.
- `POST /api/mercadopago/preferencia`: crea orden pendiente y preferencia de Mercado Pago sin descontar stock.

### Mercado Pago

- `POST /api/mercadopago/webhook`: recibe notificaciones, consulta el pago real y confirma stock/estado vía RPC.

### Admin

- `GET /api/admin/me`: verifica si el usuario está en `public.admins`.
- `GET /api/admin/productos`: lista todos los productos.
- `POST /api/admin/productos`: crea producto.
- `PUT /api/admin/productos/[id]`: edita producto.
- `DELETE /api/admin/productos/[id]`: desactiva producto con `activo = false`.

## Modelo de Datos Supabase

### `productos`

- `id`
- `nombre`
- `precio`
- `imagen_url`
- `categoria`
- `descripcion`
- `stock`
- `activo`

### `usuarios`

- `id`
- `email`
- `nombre`
- `apellido`
- `direccion`
- `telefono`

### `admins`

- `usuario_id`
- `creado_en`

### `ordenes`

- `id`
- `usuario_id`
- `email`
- `nombre`
- `telefono`
- `direccion_envio`
- `total`
- `estado`
- `metodo_pago`
- `mp_preference_id`
- `mp_payment_id`
- `mp_status`
- `mp_status_detail`
- `external_reference`
- `pagado_en`
- `mp_ultima_notificacion_en`
- `stock_confirmado_en`
- `stock_error`
- `creado_en`
- `actualizado_en`

### `detalle_ordenes`

- `id`
- `orden_id`
- `producto_id`
- `nombre_producto`
- `cantidad`
- `precio_unitario`
- `subtotal`
- `creado_en`

### `mercadopago_webhook_events`

- `id`
- `event_id`
- `action`
- `type`
- `mp_payment_id`
- `external_reference`
- `mp_status`
- `payload`
- `procesado`
- `error`
- `creado_en`

## RLS y Seguridad

- RLS debe permanecer activo.
- No se usa `service_role`.
- El webhook no actualiza tablas directamente con permisos amplios.
- La confirmación de Mercado Pago usa la función limitada `public.confirmar_pago_mercadopago`.
- El webhook consulta el pago real en Mercado Pago antes de modificar la orden.
- Queda pendiente implementar validación criptográfica de firma con `MERCADOPAGO_WEBHOOK_SECRET`.

## Cómo Crear un Admin

1. Ir a Supabase Dashboard.
2. Entrar en Authentication -> Users.
3. Copiar el `user_id`.
4. Ejecutar:

```sql
insert into public.admins (usuario_id)
values ('PEGAR_USER_ID_AQUI')
on conflict (usuario_id) do nothing;
```

5. Verificar en Table Editor -> `admins`.
6. Iniciar sesión y entrar a `/admin`.

## Instalación

```bash
npm install
```

## Desarrollo Local

```bash
npm run dev
```

Abrir:

```txt
http://localhost:3000
```

## Build

```bash
npm run build
```

## CI/CD

El repositorio incluye GitHub Actions en `.github/workflows/ci.yml`.

El pipeline corre en push y pull request:

1. Checkout.
2. Setup Node.js 20.
3. `npm install`.
4. `npm run build`.

Secrets requeridos en GitHub Actions:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Deploy en Vercel

Next.js despliega en Vercel sin `vercel.json`.

Checklist:

- Repo conectado a Vercel.
- Variables de Supabase configuradas.
- Variables de Mercado Pago configuradas.
- `NEXT_PUBLIC_SITE_URL` apunta a producción.
- Build remoto exitoso.
- Preview por PR habilitado.

## Checklist de Pruebas Manuales

### Catálogo

- Abrir `/api/productos`.
- Confirmar que devuelve productos activos.
- Abrir `/productos`.
- Abrir `/productos/[id]`.
- Desactivar un producto desde admin y confirmar que no aparece públicamente.

### Auth y Perfil

- Registrar usuario.
- Confirmar usuario en Supabase Auth.
- Confirmar perfil en `public.usuarios`.
- Iniciar sesión.
- Abrir `/perfil`.
- Cerrar sesión.

### Admin

- Iniciar sesión con usuario admin.
- Verificar que aparece `Panel admin`.
- Crear producto.
- Editar producto.
- Cambiar stock.
- Desactivar producto.
- Iniciar sesión con usuario común y confirmar que no accede a `/admin`.

### Transferencia

- Agregar productos al carrito.
- Elegir transferencia.
- Confirmar pedido.
- Verificar orden con `estado = pendiente_pago`.
- Verificar filas en `detalle_ordenes`.
- Verificar descuento de stock.

### Mercado Pago Sandbox

- Usar credenciales de prueba de Mercado Pago.
- Configurar `MERCADOPAGO_ACCESS_TOKEN` de test.
- Configurar `NEXT_PUBLIC_SITE_URL` con la URL pública de Vercel o un túnel público.
- En Mercado Pago Developers, configurar webhook:

```txt
{NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook
```

- Agregar productos al carrito.
- Elegir Mercado Pago.
- Confirmar pedido.
- Verificar redirección a Checkout Pro.
- Realizar pago con tarjeta de prueba.
- Esperar webhook.
- Verificar en `ordenes`:
  - `estado`
  - `metodo_pago`
  - `mp_preference_id`
  - `mp_payment_id`
  - `mp_status`
  - `mp_status_detail`
  - `pagado_en`
  - `stock_confirmado_en`
  - `stock_error`
- Verificar en `mercadopago_webhook_events` que se guardó el evento.
- Verificar que el stock solo baja si `mp_status = approved`.

### Caso Sin Stock Post Pago

- Crear preferencia con stock disponible.
- Antes de aprobar el pago, bajar el stock desde admin o Supabase.
- Aprobar el pago.
- Verificar que la orden queda `pago_aprobado_sin_stock`.
- Verificar que `stock_error` explica el motivo.
- Verificar que no se descuenta stock adicional.

## Scripts Disponibles

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

Actualmente no hay scripts de lint ni test configurados.
