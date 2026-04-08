# Comanda Yazbeck — App Design Spec

## Overview

PWA mobile-first para impresores mexicanos que compran playeras y prendas a Yazbeck (el proveedor de playeras más grande de México). Resuelve los problemas del sistema actual de comandas basado en Excel: errores de celda/fila/columna que causan pedidos incorrectos, y la verificación manual y tediosa de PDFs de confirmación.

**Modelo de negocio:** Venta directa por código de activación ($49-59 MXN pago único). Sin app stores.

## Problems Solved

1. **Excel es una trampa** — Una fila o columna mal y pides el modelo/talla/color equivocado, costando dinero y tiempo
2. **No hay validación** — No sabes que te equivocaste hasta que es tarde
3. **Verificar PDF de confirmación es tedioso** — Formato diferente al Excel, cientos de piezas, comparación manual

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js + TypeScript |
| UI | Tailwind CSS (mobile-first) |
| PWA | Service worker + web manifest |
| Database | Supabase (Postgres + Auth) |
| Hosting | Railway |
| PDF parsing | Reutilizar yazbeckPdfParser.ts de Ekipu |
| Excel export | ExcelJS (reutilizar comandaXlsx.ts de Ekipu) |

## Design System

Heredado de Ekipu, adaptado a mobile-first:

- **Primary:** #492A34 (burgundy)
- **Primary Hover:** #5A3542
- **Secondary:** #B99D86 (warm sand)
- **Background:** #fdfcfa (milk/beige)
- **Foreground:** #221B16 (obsidian)
- **Success:** #10B981, **Warning:** #F59E0B, **Error:** #8A1225
- **Font:** Carlito (400/700)
- **Border radius:** 12px

## User Roles

### Usuario (impresor)
- Ve catálogo de productos precargado
- Filtra y busca productos
- Agrega piezas al pedido desde la ficha de producto
- Modifica sus propios precios de venta (personalizados)
- Crea sesiones de compra
- Genera comanda Excel lista para enviar a Yazbeck
- Sube PDF de confirmación y la app verifica automáticamente
- Confirma recepción de pedido
- Ve bitácora de pedidos pasados

### Admin (owner)
- Gestiona catálogo base (agregar/editar/eliminar productos, imágenes, variables)
- Gestiona usuarios (ver, activar, desactivar cuentas)
- Genera y administra códigos de activación
- Ve estadísticas (usuarios activos, etc.)
- Establece precios base de Yazbeck

## Screens

### 1. Login / Activación

- Pantalla de ingreso de código de activación (primera vez)
- Login con email/contraseña (sesiones subsecuentes)
- Sesión persistente
- Supabase Auth maneja todo

### 2. Inicio — Selección de Proveedor

- Grid/cards con logos de proveedores disponibles
- v1: solo Yazbeck
- Estructura preparada para múltiples proveedores
- Cada proveedor tiene su catálogo independiente con su propia estructura

### 3. Catálogo (pantalla principal)

Fichas de producto estilo Ekipu adaptadas a mobile:

**Ficha de producto muestra:**
- Imagen del producto (o mockup SVG con color hex como fallback)
- Color (nombre + hex visual)
- Material, corte, género, marca (con iconos donde aplique)
- Costos por variante

**Tabla tallas x pesos:**
- Donde antes era stock → ahora muestra cantidad agregada al pedido
- Tocar celda incrementa cantidad (+1)
- Visual: 0 = vacío, >0 = resaltado con cantidad
- Colores de status para feedback visual

**Filtros (todos se conservan de Ekipu):**
- Color (swatches visuales circulares)
- Corte (badges multi-select)
- Material (badges multi-select)
- Género (badges multi-select)
- Tallas (agrupadas: Bebé, Niño, Adulto)
- Búsqueda por texto (nombre, color, género)

### 4. Sesión de Compra

**Crear sesión:**
- Nombre personalizado (ej: "Pedido Abril 2026")
- Lista de todos los productos/variantes agregados
- Cantidad y costo unitario por variante
- **Costo total del pedido** calculado en tiempo real

**Acciones por sesión:**
- **Generar comanda Excel** — descarga .xlsx lista para enviar a Yazbeck
- **Verificar PDF** — sube PDF de confirmación de Yazbeck, la app lo parsea y compara con el pedido, muestra diferencias
- **Confirmar recibido** — marca el pedido como entregado y lo mueve a bitácora

**Estados de sesión:**
- BORRADOR — editando pedido
- CONFIRMADO — comanda enviada a Yazbeck, esperando entrega
- RECIBIDO — pedido entregado y confirmado

### 5. Bitácora de Pedidos

Tabla simple con historial:
- Nombre del pedido
- Fecha de creación
- Fecha de recepción
- Costo total
- Status (pendiente/recibido)
- Toca para ver detalle de qué se pidió

### 6. Panel Admin (solo admin)

**Gestión de catálogo:**
- CRUD de productos (material, color, corte, género, marca, tallas, pesos, imágenes)
- Actualizar precios base

**Gestión de usuarios:**
- Lista de usuarios registrados
- Activar/desactivar cuentas
- Ver fecha de activación

**Códigos de activación:**
- Generar códigos únicos
- Ver status (usado/disponible)
- Asociar código a usuario

**Estadísticas:**
- Usuarios activos totales
- Códigos vendidos/disponibles

## Data Model

### Core Tables

**User** (Supabase Auth + profile)
- id, email, password (Supabase Auth)
- name, phone, activationCode, activatedAt
- role: USER | ADMIN
- isActive: boolean

**ActivationCode**
- id, code (unique), isUsed, usedBy?, usedAt?, createdAt

**Provider**
- id, name, logoUrl, isActive, order

**Product**
- id, providerId, name, type
- materialId, colorId, brandId, genderId, cutId
- imageUrl, description, catalogCode
- createdAt, updatedAt

**Material** — id, name, iconUrl, order
**Color** — id, name, hex, order, imageUrl
**Brand** — id, name, order
**Gender** — id, name, iconUrl, order
**Cut** — id, name, order
**Weight** — id, name, order
**SizeGroup** — id, name, order → SizeCategory (id, name, order, sizeGroupId)

**Variant**
- id, productId, size, weightId
- basePrice (precio Yazbeck)
- createdAt, updatedAt

**UserPrice** (precios personalizados por usuario)
- id, userId, variantId, customPrice
- Unique: [userId, variantId]

**PurchaseSession**
- id, userId, name, status (BORRADOR | CONFIRMADO | RECIBIDO)
- confirmedAt, receivedAt, createdAt

**PurchaseItem**
- id, sessionId, variantId, quantity, unitCost
- Unique: [sessionId, variantId]

**VerificationResult**
- id, sessionId, pdfFileName
- totalMatches, totalDifferences, details (JSON)
- createdAt

### Yazbeck-Specific

**YazbeckMapping**
- id, productId (unique), sheetName, estilo, yazbeckColor
- Para mapear productos del catálogo a celdas del Excel de comanda

## Reusable Code from Ekipu

### Direct reuse (95%+)
- `yazbeckComanda.ts` — Parser de estructura de comanda Excel (932 lines)
- `yazbeckPdfParser.ts` — Parser de PDF de confirmación (227 lines)
- `comandaXlsx.ts` — Leer/escribir Excel con ExcelJS (282 lines)

### High reuse (80-90%)
- `CartContext.tsx` — State management para items del pedido (~200 lines)
- `CartSidebar.tsx` — Panel lateral de pedido (~350 lines)
- `orderTextParser.ts` — Parser de texto para captura rápida (~400 lines)
- `imageUtils.ts` — Compresión y manejo de imágenes (~90 lines)
- `ConfirmDialog.tsx` — Diálogo de confirmación (~120 lines)

### Adapt (60-80%)
- `InventoryClient.tsx` — Fichas de producto y filtros (adaptar a mobile-first)
- `ComprasClient.tsx` — Sesiones de compra (simplificar para el nuevo flujo)
- `globals.css` — Sistema de diseño (mismos colores/fuentes)
- `prisma/schema.prisma` — Esquema base (simplificar)

## PWA Configuration

- Installable desde navegador (Android e iOS)
- Offline support: catálogo cacheado localmente
- App manifest con nombre, iconos, theme color
- Service worker para cache de assets y datos del catálogo

## Security

- Códigos de activación: strings únicos generados server-side
- Código se marca como usado al activar cuenta
- Supabase RLS (Row Level Security) para que cada usuario solo vea sus datos
- Admin role verificado server-side
- No se puede compartir la app sin código válido

## Out of Scope (v1)

- Historial de ventas
- Inventario/stock
- Mermas
- Cotizaciones
- Múltiples proveedores (estructura lista, pero solo Yazbeck activo)
- Notificaciones push
- App Store / Play Store
