# Islabonita

E-commerce de piezas knitted desarrollado con Next.js, React y Supabase. El proyecto incluye landing, catálogo, detalle de producto, autenticación, perfil, carrito, checkout, historial de órdenes y panel admin para gestión de productos.

## URL pública

- Producción en Vercel: completar con la URL pública final del proyecto.
- Deploy automático: Vercel conectado al repositorio.
- Preview por PR: Vercel genera previews para pull requests cuando el repositorio está conectado.

> No se incluyen claves reales ni datos sensibles en este repositorio.

## Stack tecnológico

- Next.js 14 con App Router
- React 18
- JavaScript
- Supabase Auth
- Supabase Database
- Supabase JS SDK
- API Routes de Next.js
- CSS global propio
- Vercel para deploy
- GitHub Actions para CI

## Funcionalidades actuales

- Landing responsive con productos destacados.
- Catálogo desde `GET /api/productos`.
- Detalle desde `GET /api/productos/[id]`.
- Registro con Supabase Auth e inserción de perfil en `public.usuarios`.
- Login y cierre de sesión.
- Página `/perfil` con datos del usuario autenticado.
- Carrito local con React Context y `localStorage`.
- Sincronización mínima del carrito con `public.carrito` cuando el usuario está logueado.
- Checkout con transferencia bancaria y opción visual preparada para Mercado Pago.
- Creación de órdenes desde `POST /api/ordenes`.
- Validación server-side de productos, cantidades, stock y total.
- Descuento de stock desde servidor.
- Historial de compras en `/ordenes`.
- Panel admin protegido por tabla `public.admins`.
- CRUD admin de productos: listar, crear, editar, modificar stock y desactivar.
- Catálogo público filtrado por productos activos.

## Estado de Mercado Pago

Mercado Pago real todavía no está implementado. La opción existe en checkout como alternativa visual/preparada, pero no genera preferencia, no procesa pagos reales y no recibe webhooks.

Pendiente para completar E6 Excelente:

- Crear preferencia real de Mercado Pago desde servidor.
- Redirigir al checkout real de Mercado Pago.
- Crear webhook para actualizar estados de órdenes.
- Probar pagos aprobados, rechazados y pendientes.
- Documentar credenciales de entorno sin valores reales.

## Arquitectura general

La aplicación usa App Router. Las páginas viven en `app/`, los componentes reutilizables en `components/`, las utilidades compartidas en `lib/`, los assets en `public/assets/` y las API Routes en `app/api/`.

El frontend consume API Routes internas para los flujos principales. Las rutas protegidas reciben el access token de Supabase como Bearer token y operan con la anon key, respetando RLS. No se usa `service_role`.

## Estructura de carpetas

```txt
app/
  api/
    admin/
    carrito/
    ordenes/
    productos/
  admin/
  carrito/
  checkout/
  login/
  ordenes/
  perfil/
  productos/
components/
lib/
data/
public/assets/
.github/workflows/
```

`data/products.js` queda como respaldo legacy. El flujo principal de home, catálogo y detalle lee desde API/Supabase.

## Rutas principales

- `/`: landing con productos destacados desde API.
- `/productos`: catálogo público.
- `/productos/[id]`: detalle de producto activo.
- `/login`: inicio de sesión.
- `/register`: registro.
- `/perfil`: perfil del usuario autenticado.
- `/carrito`: carrito.
- `/checkout`: checkout.
- `/ordenes`: historial de compras del usuario.
- `/admin`: acceso al panel admin.
- `/admin/productos`: CRUD de productos para administradores.

## API Routes implementadas

### Públicas

- `GET /api/productos`: lista productos activos desde `public.productos`.
- `GET /api/productos/[id]`: obtiene un producto activo por id.

### Protegidas para usuario autenticado

- `POST /api/carrito`: valida producto, cantidad y stock; inserta o incrementa en `public.carrito`.
- `POST /api/ordenes`: valida sesión, productos, cantidades y stock; calcula total en servidor; crea orden y detalle; descuenta stock.
- `GET /api/ordenes`: devuelve únicamente órdenes del usuario autenticado.

### Protegidas para admin

- `GET /api/admin/me`: verifica si el usuario autenticado existe en `public.admins`.
- `GET /api/admin/productos`: lista todos los productos, activos e inactivos.
- `POST /api/admin/productos`: crea producto.
- `PUT /api/admin/productos/[id]`: edita producto.
- `DELETE /api/admin/productos/[id]`: no borra físicamente; desactiva con `activo = false`.

## Modelo de datos Supabase

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

Esta tabla identifica administradores sin hardcodear emails ni usar `service_role`.

### `carrito`

- `id`
- `usuario_id`
- `producto_id`
- `cantidad`

### `ordenes`

- `id`
- `usuario_id`
- `email`
- `nombre`
- `telefono`
- `direccion_envio`
- `total`
- `estado`
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

## RLS y permisos esperados

RLS debe permanecer activo. Las policies esperadas son:

- Usuarios pueden insertar y ver su propio perfil en `usuarios`.
- Usuarios pueden crear y ver sus propias órdenes en `ordenes`.
- Usuarios pueden insertar y ver detalles asociados a sus propias órdenes en `detalle_ordenes`.
- Usuarios autenticados pueden sincronizar su propio carrito en `carrito`.
- El catálogo público puede leer productos activos.
- Solo usuarios presentes en `admins` pueden crear, editar o desactivar productos.
- Usuarios comunes no pueden crear ni editar productos.

## Cómo crear un admin

1. Ir a Supabase Dashboard.
2. Entrar en Authentication -> Users.
3. Copiar el `user_id` del usuario que debe ser admin.
4. Ejecutar en SQL Editor:

```sql
insert into public.admins (usuario_id)
values ('PEGAR_USER_ID_AQUI')
on conflict (usuario_id) do nothing;
```

5. Verificar en Table Editor -> `admins` que el usuario quedó insertado.
6. Iniciar sesión en la app y entrar a `/admin`.

## Variables de entorno

Crear `.env.local` para desarrollo:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

En Vercel configurar las mismas variables en Project Settings -> Environment Variables.

## Instalación

```bash
npm install
```

## Desarrollo local

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

1. Checkout del repositorio.
2. Setup de Node.js 20.
3. `npm install`.
4. `npm run build`.

El build usa secrets de GitHub:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Para verificar CI:

1. Hacer push a una rama.
2. Abrir GitHub -> Actions.
3. Verificar que el workflow `CI` termine en verde.

## Deploy en Vercel

El proyecto despliega en Vercel como aplicación Next.js sin necesidad de `vercel.json`.

Checklist de deploy:

- Repo conectado a Vercel.
- Variables de Supabase configuradas.
- Build remoto exitoso.
- URL pública accesible.
- Preview por PR habilitado desde la integración Vercel/GitHub.

## Checklist de pruebas manuales

### Catálogo desde Supabase/API

- Abrir `/api/productos`.
- Confirmar que devuelve productos activos desde Supabase.
- Abrir `/productos`.
- Confirmar que coincide con la API.
- Abrir `/api/productos/1`.
- Abrir `/productos/1`.
- Desactivar un producto desde admin y confirmar que no aparece en catálogo público.

### Registro y login

- Registrar un usuario nuevo.
- Confirmar que aparece en Supabase Auth.
- Confirmar que aparece en `public.usuarios`.
- Iniciar sesión.
- Cerrar sesión desde `/perfil`.

### Perfil

- Abrir `/perfil` con sesión activa.
- Verificar nombre, apellido, email, dirección y teléfono.
- Cerrar sesión y confirmar que no se muestran datos privados.

### Carrito

- Agregar producto desde `/productos`.
- Agregar producto desde `/productos/[id]`.
- Verificar contador en header.
- Abrir `/carrito`.
- Aumentar cantidad.
- Disminuir cantidad.
- Eliminar producto.
- Probar sin sesión y confirmar persistencia local.
- Probar con sesión y verificar sincronización en `public.carrito`.

### Checkout y stock

- Agregar productos al carrito.
- Abrir `/checkout` con usuario logueado.
- Confirmar pedido con transferencia.
- Confirmar pedido con Mercado Pago visual.
- Verificar fila en `public.ordenes`.
- Verificar filas en `public.detalle_ordenes`.
- Verificar que baja `productos.stock`.
- Intentar comprar más que el stock disponible y confirmar error claro.

### Órdenes

- Abrir `/ordenes` con sesión.
- Verificar número de orden, fecha, estado, cantidad de productos y total.
- Probar con otro usuario y confirmar que no ve órdenes ajenas.
- Cerrar sesión y confirmar que `/ordenes` solicita iniciar sesión.

### Admin con permisos

- Iniciar sesión con un usuario cargado en `public.admins`.
- Verificar que el header muestra `Panel admin`.
- Entrar a `/admin`.
- Entrar a `/admin/productos`.
- Crear un producto.
- Editar nombre, precio, categoría, descripción, imagen, stock y activo.
- Desactivar un producto.
- Confirmar que productos inactivos no aparecen en `/productos`.
- Usar `Vista cliente` para volver al catálogo público.

### Usuario común sin permisos

- Iniciar sesión con un usuario no cargado en `public.admins`.
- Verificar que el header no muestra `Panel admin`.
- Intentar abrir `/admin`.
- Confirmar mensaje `No autorizado`.
- Intentar abrir `/admin/productos`.
- Confirmar que no puede acceder ni modificar productos.

### CI y deploy

- Hacer push a una rama.
- Confirmar GitHub Actions en verde.
- Abrir el preview de Vercel si es un pull request.
- Validar rutas principales en producción:
  - `/`
  - `/productos`
  - `/productos/[id]`
  - `/login`
  - `/register`
  - `/perfil`
  - `/carrito`
  - `/checkout`
  - `/ordenes`
  - `/admin`
  - `/api/productos`

## Scripts disponibles

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

Actualmente no hay scripts de lint ni test configurados.

## Estado actual del proyecto

Implementado:

- Deploy en Vercel.
- CI con GitHub Actions.
- Catálogo y detalle desde API/Supabase.
- Auth con Supabase.
- Perfil.
- Carrito local y sincronización mínima con API.
- Checkout con validación server-side y descuento de stock.
- Historial de órdenes.
- Admin CRUD con tabla `admins`.
- Productos activos/inactivos.

Pendiente para cerrar Excelente global:

- Integración real de Mercado Pago.
- Webhook de Mercado Pago.
- Evidencia final de pruebas de pago.
- Completar en este README la URL pública final de Vercel.
- Opcional: agregar lint/tests automatizados.
