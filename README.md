# Islabonita

E-commerce de piezas knitted desarrollado con Next.js, React y Supabase. El proyecto incluye catálogo, autenticación, perfil de usuario, carrito, checkout, historial de órdenes y API Routes internas para productos, carrito y órdenes.

## Stack tecnológico

- Next.js 14 con App Router
- React 18
- Supabase Auth
- Supabase Database
- Supabase JS SDK
- CSS global propio
- JavaScript

## Funcionalidades actuales

- Landing responsive con selección de productos.
- Catálogo de productos desde Supabase.
- Detalle de producto desde API interna.
- Registro de usuarios con Supabase Auth.
- Inserción de perfil en `public.usuarios`.
- Login y cierre de sesión.
- Página `/perfil` con datos del usuario.
- Carrito local con React Context y `localStorage`.
- Sincronización mínima del carrito con `public.carrito` cuando el usuario está logueado.
- Checkout visual con transferencia bancaria y opción visual preparada para Mercado Pago.
- Creación de órdenes desde `POST /api/ordenes`.
- Validación server-side de items, productos, stock y total.
- Descuento de stock desde servidor.
- Historial de órdenes en `/ordenes`.

## Arquitectura general

La aplicación usa el App Router de Next.js. Las páginas principales viven en `app/`, los componentes reutilizables en `components/`, las utilidades compartidas en `lib/` y los assets estáticos en `public/assets/`.

El frontend consume API Routes internas para los flujos principales del desafío:

- Productos: `GET /api/productos` y `GET /api/productos/[id]`
- Carrito: `POST /api/carrito`
- Órdenes: `GET /api/ordenes` y `POST /api/ordenes`

La autenticación se maneja con Supabase Auth. Las API Routes protegidas reciben el token de sesión como Bearer token y operan con la anon key, respetando RLS. No se usa `service_role` en el cliente ni en las API Routes actuales.

## Estructura de carpetas

```txt
app/
  api/
    carrito/
    ordenes/
    productos/
  auth/
  carrito/
  checkout/
  login/
  ordenes/
  perfil/
  productos/
  register/
components/
lib/
data/
public/assets/
```

## Rutas principales

- `/`: landing y productos destacados.
- `/productos`: catálogo desde Supabase.
- `/productos/[id]`: detalle de producto desde API interna.
- `/login`: inicio de sesión.
- `/register`: registro.
- `/perfil`: perfil del usuario autenticado.
- `/carrito`: carrito local.
- `/checkout`: checkout.
- `/ordenes`: historial de compras del usuario.
- `/supabase-test`: página auxiliar de prueba de conexión.

## API Routes implementadas

### `GET /api/productos`

Lee productos desde `public.productos` y devuelve datos normalizados para el frontend:

```txt
id, name, price, image, category, description, stock
```

### `GET /api/productos/[id]`

Lee un producto por id desde `public.productos` y devuelve el mismo formato normalizado.

### `POST /api/carrito`

Requiere Bearer token. Recibe:

```json
{
  "producto_id": 1,
  "cantidad": 1
}
```

Valida producto, cantidad y stock. Inserta o incrementa cantidad en `public.carrito`.

### `POST /api/ordenes`

Requiere Bearer token. Recibe items del carrito y datos del checkout. No confía en precios ni totales enviados por el cliente.

Responsabilidades:

- verificar usuario autenticado
- validar items
- buscar productos reales en Supabase
- verificar stock
- calcular total en servidor
- crear fila en `public.ordenes`
- crear filas en `public.detalle_ordenes`
- descontar stock

Estados actuales:

- `pendiente_pago`
- `pendiente_pago_mp`

### `GET /api/ordenes`

Requiere Bearer token. Devuelve únicamente órdenes del usuario autenticado:

```txt
id, total, estado, creado_en, cantidad_productos
```

## Modelo de datos Supabase

Tablas usadas por la aplicación:

### `productos`

Campos esperados:

- `id`
- `nombre`
- `precio`
- `imagen_url`
- `categoria`
- `descripcion`
- `stock`

### `usuarios`

Campos esperados:

- `id`
- `email`
- `nombre`
- `apellido`
- `direccion`
- `telefono`

### `carrito`

Campos esperados:

- `id`
- `usuario_id`
- `producto_id`
- `cantidad`

### `ordenes`

Campos esperados:

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

Campos esperados:

- `id`
- `orden_id`
- `producto_id`
- `nombre_producto`
- `cantidad`
- `precio_unitario`
- `subtotal`
- `creado_en`

## Variables de entorno

Crear un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

No incluir claves reales en el repositorio.

## Instalación

```bash
npm install
```

## Correr localmente

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

## Scripts disponibles

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

Actualmente no hay script de lint ni test configurado.

## Checklist de pruebas manuales

### Catálogo

- Abrir `/api/productos` y verificar productos desde Supabase.
- Abrir `/productos` y verificar que coincida con Supabase.
- Abrir `/api/productos/1`.
- Abrir `/productos/1`.
- Cambiar un precio en Supabase y verificar que se refleje al refrescar.

### Autenticación

- Registrar usuario nuevo.
- Confirmar que aparece en Supabase Auth.
- Confirmar que aparece en `public.usuarios`.
- Iniciar sesión.
- Cerrar sesión desde `/perfil`.

### Perfil

- Abrir `/perfil` con sesión activa.
- Verificar nombre, apellido, email, dirección y teléfono.
- Intentar abrir `/perfil` sin sesión.

### Carrito

- Agregar producto desde `/productos`.
- Agregar producto desde `/productos/[id]`.
- Verificar contador en header.
- Abrir `/carrito`.
- Aumentar cantidad.
- Disminuir cantidad.
- Eliminar producto.
- Probar carrito sin sesión y verificar persistencia local.
- Probar carrito con sesión y verificar `public.carrito`.

### Checkout

- Agregar productos al carrito.
- Abrir `/checkout`.
- Confirmar pedido con transferencia.
- Confirmar pedido con Mercado Pago visual.
- Verificar fila en `public.ordenes`.
- Verificar filas en `public.detalle_ordenes`.
- Verificar descuento de stock.
- Intentar comprar más que el stock disponible.

### Órdenes

- Abrir `/ordenes` con sesión.
- Verificar número de orden, fecha, estado, productos y total.
- Cerrar sesión y verificar que `/ordenes` solicita iniciar sesión.
- Probar con otro usuario y verificar que no ve órdenes ajenas.

## Estado actual del proyecto

Implementado:

- Landing y vistas principales.
- Catálogo desde Supabase.
- API Routes para productos, carrito y órdenes.
- Auth con Supabase.
- Perfil de usuario.
- Checkout con validación server-side.
- Historial de órdenes.
- Stock validado y descontado desde servidor.

Pendiente para nivel Excelente:

- Deploy público estable.
- Pipeline CI/CD.
- Preview por PR.
- Integración real de Mercado Pago.
- Webhook de Mercado Pago.
- Panel admin funcional.
- Tests automatizados o evidencia formal de pruebas.
- Documentación final de RLS y políticas.

## Preparación para despliegue

El proyecto está preparado para desplegarse en una plataforma compatible con Next.js, como Vercel.

Para completar despliegue excelente falta:

- crear proyecto en Vercel
- configurar variables de entorno
- verificar build remoto
- configurar dominio o URL pública estable
- documentar URL pública
- validar rutas principales en producción
- habilitar preview por PR

## Preparación para CI/CD

Actualmente no existe configuración de GitHub Actions ni otro pipeline en el repositorio.

Para completar CI/CD excelente falta:

- agregar workflow de CI
- ejecutar `npm install` o `npm ci`
- ejecutar `npm run build`
- agregar lint cuando esté configurado
- agregar tests cuando estén configurados
- verificar checks en pull requests
- documentar el flujo de PR y preview

## Próximos pasos

1. Configurar deploy público estable.
2. Configurar GitHub Actions para CI.
3. Agregar preview por PR.
4. Implementar Mercado Pago real.
5. Implementar webhook de Mercado Pago.
6. Crear panel admin con CRUD de productos y stock.
7. Agregar pruebas automatizadas o checklist formal versionado.
8. Documentar RLS, políticas y modelo de datos final.
