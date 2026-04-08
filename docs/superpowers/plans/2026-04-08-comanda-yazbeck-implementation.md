# Comanda Yazbeck — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA for Mexican textile printers to fill Yazbeck supplier orders, replacing error-prone Excel workflows with guided product selection, automated Excel generation, and PDF verification.

**Architecture:** Next.js app with Supabase (Postgres + Auth), deployed on Railway. Business logic for Yazbeck Excel/PDF parsing is copied from Ekipu. All UI is built mobile-first with Tailwind CSS. Product catalog is precargado by admin. Users activate via one-time purchase code.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase (Auth + Postgres), Prisma, ExcelJS, pdf-parse, Lucide React

**Key constraint:** All UI code from Ekipu must be redesigned mobile-first. Business logic (parsers, Excel, PDF) can be copied directly.

**Ekipu source path:** `C:\Users\figok\OneDrive\Escritorio\kuzamil inventario\app-inventario`

---

## File Structure

```
comanda-yazbeck/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   ├── icons/                     # App icons (192, 512)
│   └── fonts/
│       └── Carlito-Regular.woff2
│       └── Carlito-Bold.woff2
├── prisma/
│   └── schema.prisma              # Database schema (Supabase Postgres)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout + providers
│   │   ├── globals.css            # Design system (Ekipu colors + Tailwind)
│   │   ├── page.tsx               # Redirect: auth check → /proveedores or /login
│   │   ├── login/
│   │   │   └── page.tsx           # Login + activation code screen
│   │   ├── proveedores/
│   │   │   └── page.tsx           # Provider selection grid
│   │   ├── catalogo/
│   │   │   ├── page.tsx           # Server component: fetch catalog data
│   │   │   └── CatalogoClient.tsx # Product cards + filters + order qty
│   │   ├── pedido/
│   │   │   ├── page.tsx           # Purchase sessions list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Session detail: items, totals, actions
│   │   ├── bitacora/
│   │   │   └── page.tsx           # Purchase history table
│   │   ├── admin/
│   │   │   ├── page.tsx           # Admin dashboard (stats)
│   │   │   ├── catalogo/
│   │   │   │   └── page.tsx       # CRUD products
│   │   │   ├── usuarios/
│   │   │   │   └── page.tsx       # Manage users
│   │   │   └── codigos/
│   │   │       └── page.tsx       # Activation codes
│   │   ├── api/
│   │   │   ├── upload-comanda/
│   │   │   │   └── route.ts       # Upload Yazbeck Excel template
│   │   │   ├── fill-comanda/
│   │   │   │   └── route.ts       # Generate filled Excel
│   │   │   └── verify-pdf/
│   │   │       └── route.ts       # Parse & compare PDF
│   │   └── actions/
│   │       ├── authActions.ts     # Login, activate, check session
│   │       ├── catalogActions.ts  # Products CRUD, filters data
│   │       ├── sessionActions.ts  # Purchase sessions CRUD
│   │       ├── adminActions.ts    # Admin: users, codes, stats
│   │       └── yazbeckActions.ts  # Comanda structure, mappings, export
│   ├── components/
│   │   ├── MobileNav.tsx          # Bottom tab navigation
│   │   ├── ProductCard.tsx        # Product ficha (mobile-first)
│   │   ├── FilterBar.tsx          # Collapsible filters
│   │   ├── SizeWeightGrid.tsx     # Tallas × pesos quantity picker
│   │   ├── SessionSummary.tsx     # Purchase session totals
│   │   ├── PdfVerifier.tsx        # Upload PDF + show comparison
│   │   ├── ConfirmDialog.tsx      # Reusable confirm modal
│   │   └── OrderContext.tsx       # Order state management (cart)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser Supabase client
│   │   │   └── server.ts          # Server Supabase client
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── yazbeckComanda.ts      # COPY from Ekipu (comanda parser)
│   │   ├── yazbeckPdfParser.ts    # COPY from Ekipu (PDF parser)
│   │   ├── comandaXlsx.ts         # ADAPT from Ekipu (Excel handler)
│   │   └── imageUtils.ts          # COPY from Ekipu (image compression)
│   └── middleware.ts              # Auth guard + admin role check
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## Task 1: Project Scaffold + Design System

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `public/manifest.json`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Expected: Project scaffold created with Next.js + Tailwind + TypeScript.

- [ ] **Step 2: Install dependencies**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
npm install @supabase/supabase-js @supabase/ssr @prisma/client lucide-react exceljs pdf-parse
npm install -D prisma @types/pdf-parse
```

- [ ] **Step 3: Configure tailwind.config.ts with Ekipu design system**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#492A34",
          hover: "#5A3542",
        },
        secondary: "#B99D86",
        background: "#fdfcfa",
        foreground: "#221B16",
        card: "#FFFFFF",
        border: "#E8DCCB",
        input: "#FDFBF7",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#8A1225",
      },
      fontFamily: {
        sans: ["Carlito", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(34 27 22 / 0.05)",
        DEFAULT: "0 4px 6px -1px rgb(34 27 22 / 0.08), 0 2px 4px -2px rgb(34 27 22 / 0.08)",
        lg: "0 10px 15px -3px rgb(34 27 22 / 0.1), 0 4px 6px -4px rgb(34 27 22 / 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Set up globals.css with Ekipu design tokens**

Replace `src/app/globals.css`:

```css
@import "tailwindcss";

@font-face {
  font-family: "Carlito";
  src: url("/fonts/Carlito-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Carlito";
  src: url("/fonts/Carlito-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --primary: #492A34;
  --primary-hover: #5A3542;
  --secondary: #B99D86;
  --background: #fdfcfa;
  --foreground: #221B16;
  --card: #FFFFFF;
  --border: #E8DCCB;
  --input: #FDFBF7;
  --ring: rgba(73, 42, 52, 0.2);
  --success: #10B981;
  --warning: #F59E0B;
  --error: #8A1225;
  --radius: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

html {
  font-family: "Carlito", sans-serif;
  background: var(--background);
  color: var(--foreground);
}

body {
  min-height: 100dvh;
  overscroll-behavior: none;
}
```

- [ ] **Step 5: Set up root layout with mobile viewport**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comanda Yazbeck",
  description: "Llena y verifica tus comandas Yazbeck sin errores",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comanda Yazbeck",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#492A34",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create PWA manifest**

Replace `public/manifest.json`:

```json
{
  "name": "Comanda Yazbeck",
  "short_name": "Comanda",
  "description": "Llena y verifica tus comandas Yazbeck sin errores",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fdfcfa",
  "theme_color": "#492A34",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 7: Create placeholder icons and fonts directory**

```bash
mkdir -p public/icons public/fonts
# Create placeholder SVG icons (replace with real ones later)
echo '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" fill="#492A34" rx="24"/><text x="96" y="110" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">CY</text></svg>' > public/icons/icon-192.svg
```

Note: Download Carlito font files (.woff2) from Google Fonts and place in `public/fonts/`. For now the app will fall back to system sans-serif.

- [ ] **Step 8: Configure next.config.ts**

Replace `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
```

- [ ] **Step 9: Create placeholder home page**

Replace `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Comanda Yazbeck</h1>
        <p className="mt-2 text-secondary">En construcción</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Verify dev server runs**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
npm run dev
```

Expected: App runs on localhost:3000, shows "Comanda Yazbeck - En construcción" with burgundy heading.

- [ ] **Step 11: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add -A
git commit -m "feat: project scaffold with Next.js, Tailwind, Ekipu design system, PWA manifest"
```

---

## Task 2: Database Schema + Prisma Setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `.env.local` (template)

- [ ] **Step 1: Initialize Prisma with PostgreSQL**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Create .env.local template**

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase Postgres direct connection)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add `.env.local` to `.gitignore` (should already be there from create-next-app).

- [ ] **Step 3: Write database schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === AUTH & USERS ===

model UserProfile {
  id             String   @id // matches Supabase auth.users.id
  email          String   @unique
  name           String?
  phone          String?
  role           String   @default("USER") // "USER" | "ADMIN"
  isActive       Boolean  @default(true)
  activationCode String?
  activatedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  userPrices       UserPrice[]
  purchaseSessions PurchaseSession[]
}

model ActivationCode {
  id        Int       @id @default(autoincrement())
  code      String    @unique
  isUsed    Boolean   @default(false)
  usedBy    String?   // UserProfile.id
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

// === CATALOG ===

model Provider {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  logoUrl  String?
  isActive Boolean   @default(true)
  order    Int       @default(0)
  products Product[]
}

model Material {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  iconUrl  String?
  order    Int       @default(0)
  products Product[]
}

model Color {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  hex      String?
  order    Int       @default(0)
  imageUrl String?
  products Product[]
}

model Brand {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  order    Int       @default(0)
  products Product[]
}

model Gender {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  iconUrl  String?
  order    Int       @default(0)
  products Product[]
}

model Cut {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  order    Int       @default(0)
  products Product[]
}

model Weight {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  order    Int       @default(0)
  variants Variant[]
}

model SizeGroup {
  id      Int            @id @default(autoincrement())
  name    String         @unique
  order   Int            @default(0)
  options SizeCategory[]
}

model SizeCategory {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  order       Int       @default(0)
  sizeGroup   SizeGroup @relation(fields: [sizeGroupId], references: [id])
  sizeGroupId Int

  @@index([sizeGroupId])
}

model Product {
  id          Int     @id @default(autoincrement())
  name        String
  type        String  @default("CLOTHING")

  provider    Provider? @relation(fields: [providerId], references: [id])
  providerId  Int?
  material    Material? @relation(fields: [materialId], references: [id])
  materialId  Int?
  color       Color?    @relation(fields: [colorId], references: [id])
  colorId     Int?
  brand       Brand?    @relation(fields: [brandId], references: [id])
  brandId     Int?
  gender      Gender?   @relation(fields: [genderId], references: [id])
  genderId    Int?
  cut         Cut?      @relation(fields: [cutId], references: [id])
  cutId       Int?

  imageUrl    String?
  description String?
  catalogCode String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  variants       Variant[]
  yazbeckMapping YazbeckMapping?

  @@unique([name, materialId, colorId, genderId, cutId, brandId])
  @@index([providerId])
  @@index([materialId])
  @@index([colorId])
  @@index([brandId])
  @@index([type])
}

model Variant {
  id        Int     @id @default(autoincrement())
  size      String
  weight    Weight? @relation(fields: [weightId], references: [id])
  weightId  Int?
  basePrice Float   @default(0) // Yazbeck price

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId Int

  userPrices    UserPrice[]
  purchaseItems PurchaseItem[]

  @@unique([productId, size, weightId])
  @@index([productId])
}

model UserPrice {
  id          Int    @id @default(autoincrement())
  customPrice Float

  user      UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  variant   Variant     @relation(fields: [variantId], references: [id], onDelete: Cascade)
  variantId Int

  @@unique([userId, variantId])
  @@index([userId])
}

// === YAZBECK MAPPING ===

model YazbeckMapping {
  id           Int     @id @default(autoincrement())
  productId    Int     @unique
  product      Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  sheetName    String
  estilo       String
  yazbeckColor String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// === PURCHASE SESSIONS ===

model PurchaseSession {
  id     Int    @id @default(autoincrement())
  name   String
  status String @default("BORRADOR") // "BORRADOR" | "CONFIRMADO" | "RECIBIDO"

  user   UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  confirmedAt DateTime?
  receivedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  items              PurchaseItem[]
  verificationResults VerificationResult[]

  @@index([userId])
  @@index([status])
}

model PurchaseItem {
  id       Int   @id @default(autoincrement())
  quantity Int
  unitCost Float @default(0)

  session   PurchaseSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId Int
  variant   Variant         @relation(fields: [variantId], references: [id])
  variantId Int

  createdAt DateTime @default(now())

  @@unique([sessionId, variantId])
  @@index([sessionId])
}

model VerificationResult {
  id               Int    @id @default(autoincrement())
  pdfFileName      String
  totalMatches     Int    @default(0)
  totalDifferences Int    @default(0)
  details          Json   @default("[]")

  session   PurchaseSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId Int

  createdAt DateTime @default(now())

  @@index([sessionId])
}
```

- [ ] **Step 4: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Generate Prisma client**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
npx prisma generate
```

Expected: Prisma Client generated successfully.

Note: `prisma db push` will be run later when Supabase project is created and DATABASE_URL is configured.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add prisma/schema.prisma src/lib/prisma.ts .env.local
git commit -m "feat: database schema with Prisma for Supabase Postgres"
```

---

## Task 3: Supabase Auth + Middleware

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Create: `src/middleware.ts`
- Create: `src/app/actions/authActions.ts`
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create Supabase browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create Supabase server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create auth middleware**

Create `src/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/login";
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");

  // Not logged in → redirect to login (except login page itself)
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in on login page → redirect to app
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/proveedores", request.url));
  }

  // Admin pages → check role via user metadata
  if (isAdminPage && user) {
    const role = user.user_metadata?.role || "USER";
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/proveedores", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|fonts|manifest.json|sw.js).*)",
  ],
};
```

- [ ] **Step 4: Create auth server actions**

Create `src/app/actions/authActions.ts`:

```typescript
"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function activateAndSignUp(
  code: string,
  email: string,
  password: string,
  name: string
) {
  // 1. Verify activation code exists and is unused
  const activationCode = await prisma.activationCode.findUnique({
    where: { code },
  });

  if (!activationCode || activationCode.isUsed) {
    return { error: "Código de activación inválido o ya utilizado" };
  }

  // 2. Sign up with Supabase Auth
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: "USER" },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Error al crear cuenta" };
  }

  // 3. Create user profile
  await prisma.userProfile.create({
    data: {
      id: data.user.id,
      email,
      name,
      activationCode: code,
      activatedAt: new Date(),
    },
  });

  // 4. Mark code as used
  await prisma.activationCode.update({
    where: { code },
    data: {
      isUsed: true,
      usedBy: data.user.id,
      usedAt: new Date(),
    },
  });

  return { success: true };
}

export async function signIn(email: string, password: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos" };
  }

  redirect("/proveedores");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
  });

  return profile;
}
```

- [ ] **Step 5: Create login page (mobile-first)**

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { activateAndSignUp, signIn } from "@/app/actions/authActions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "activate">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await signIn(
      formData.get("email") as string,
      formData.get("password") as string
    );
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleActivate(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await activateAndSignUp(
      formData.get("code") as string,
      formData.get("email") as string,
      formData.get("password") as string,
      formData.get("name") as string
    );
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Auto-login after activation
      await signIn(
        formData.get("email") as string,
        formData.get("password") as string
      );
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Comanda Yazbeck</h1>
          <p className="mt-1 text-sm text-secondary">
            {mode === "login"
              ? "Inicia sesión"
              : "Activa tu cuenta con tu código"}
          </p>
        </div>

        {error && (
          <div className="rounded-[12px] bg-red-50 p-3 text-sm text-error">
            {error}
          </div>
        )}

        {mode === "login" ? (
          <form action={handleLogin} className="space-y-4">
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              required
              className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[12px] bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form action={handleActivate} className="space-y-4">
            <input
              name="code"
              type="text"
              placeholder="Código de activación"
              required
              className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-center text-lg font-bold tracking-widest text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              name="name"
              type="text"
              placeholder="Tu nombre"
              required
              className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              required
              minLength={6}
              className="w-full rounded-[12px] border border-border bg-input px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[12px] bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Activando..." : "Activar cuenta"}
            </button>
          </form>
        )}

        <button
          onClick={() => {
            setMode(mode === "login" ? "activate" : "login");
            setError("");
          }}
          className="w-full text-center text-sm text-secondary underline"
        >
          {mode === "login"
            ? "¿Tienes un código? Activa tu cuenta"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Update root page to redirect**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/proveedores");
  } else {
    redirect("/login");
  }
}
```

- [ ] **Step 7: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/lib/supabase/ src/middleware.ts src/app/actions/authActions.ts src/app/login/ src/app/page.tsx
git commit -m "feat: Supabase auth with activation codes, login page, middleware guard"
```

---

## Task 4: Mobile Navigation + Provider Selection

**Files:**
- Create: `src/components/MobileNav.tsx`
- Create: `src/app/proveedores/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create bottom tab navigation**

Create `src/components/MobileNav.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Store, ShoppingBag, ClipboardList, Settings } from "lucide-react";

const tabs = [
  { href: "/proveedores", label: "Inicio", icon: Store },
  { href: "/catalogo", label: "Catálogo", icon: ShoppingBag },
  { href: "/pedido", label: "Pedidos", icon: ClipboardList },
  { href: "/bitacora", label: "Bitácora", icon: ClipboardList },
];

export default function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const allTabs = isAdmin
    ? [...tabs, { href: "/admin", label: "Admin", icon: Settings }]
    : tabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {allTabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive
                  ? "text-primary font-bold"
                  : "text-secondary"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create app shell layout with nav**

Create `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/authActions";
import MobileNav from "@/components/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh pb-16">
      {children}
      <MobileNav isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
```

Move app pages under `(app)` route group so they share this layout.

- [ ] **Step 3: Create provider selection page**

Create `src/app/(app)/proveedores/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ProveedoresPage() {
  const providers = await prisma.provider.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <main className="p-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-primary">
        Selecciona proveedor
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {providers.map((provider) => (
          <Link
            key={provider.id}
            href={`/catalogo?proveedor=${provider.id}`}
            className="flex flex-col items-center gap-3 rounded-[12px] border border-border bg-card p-6 shadow-sm transition-shadow active:shadow-lg"
          >
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt={provider.name}
                className="h-16 w-16 object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {provider.name[0]}
              </div>
            )}
            <span className="text-sm font-bold text-foreground">
              {provider.name}
            </span>
          </Link>
        ))}

        {providers.length === 0 && (
          <p className="col-span-2 text-center text-secondary">
            No hay proveedores configurados
          </p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/components/MobileNav.tsx "src/app/(app)/"
git commit -m "feat: mobile bottom nav + provider selection screen"
```

---

## Task 5: Copy Business Logic from Ekipu

**Files:**
- Create: `src/lib/yazbeckComanda.ts` (copy)
- Create: `src/lib/yazbeckPdfParser.ts` (copy)
- Create: `src/lib/comandaXlsx.ts` (adapt)
- Create: `src/lib/imageUtils.ts` (copy)

- [ ] **Step 1: Copy yazbeckComanda.ts from Ekipu**

```bash
cp "/c/Users/figok/OneDrive/Escritorio/kuzamil inventario/app-inventario/src/lib/yazbeckComanda.ts" "/c/Users/figok/Documents/comanda-yazbeck/src/lib/yazbeckComanda.ts"
```

No changes needed — this is pure parsing logic with no UI or DB dependencies.

- [ ] **Step 2: Copy yazbeckPdfParser.ts from Ekipu**

```bash
cp "/c/Users/figok/OneDrive/Escritorio/kuzamil inventario/app-inventario/src/lib/yazbeckPdfParser.ts" "/c/Users/figok/Documents/comanda-yazbeck/src/lib/yazbeckPdfParser.ts"
```

No changes needed — pure PDF parsing logic.

- [ ] **Step 3: Copy and adapt comandaXlsx.ts**

```bash
cp "/c/Users/figok/OneDrive/Escritorio/kuzamil inventario/app-inventario/src/lib/comandaXlsx.ts" "/c/Users/figok/Documents/comanda-yazbeck/src/lib/comandaXlsx.ts"
```

Adapt: Change the file storage from local filesystem (`data/comanda/`) to work with Buffer-based operations. The comanda template will be stored as a Supabase Storage file or passed as a Buffer from the API route. Remove `fs` references and make functions accept/return Buffers instead of reading from disk.

Key changes:
- Remove `comandaExists()` and `getComandaInfo()` (no local file storage)
- Keep `readComandaSheet(buffer: Buffer)` — accept buffer instead of reading from disk
- Keep `fillComanda(buffer: Buffer, quantityRanges, cellWrites)` — accept buffer, return buffer
- Keep `letterToColNumber()` as-is

- [ ] **Step 4: Copy imageUtils.ts from Ekipu**

```bash
cp "/c/Users/figok/OneDrive/Escritorio/kuzamil inventario/app-inventario/src/lib/imageUtils.ts" "/c/Users/figok/Documents/comanda-yazbeck/src/lib/imageUtils.ts"
```

No changes needed — client-side image utilities.

- [ ] **Step 5: Verify no import errors**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
npx tsc --noEmit --pretty 2>&1 | head -30
```

Fix any import path issues (e.g., Ekipu-specific imports that don't exist in the new project).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/lib/yazbeckComanda.ts src/lib/yazbeckPdfParser.ts src/lib/comandaXlsx.ts src/lib/imageUtils.ts
git commit -m "feat: copy Yazbeck business logic from Ekipu (parser, PDF, Excel, images)"
```

---

## Task 6: Catalog Server Actions + Data Fetching

**Files:**
- Create: `src/app/actions/catalogActions.ts`

- [ ] **Step 1: Create catalog server actions**

Create `src/app/actions/catalogActions.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";

export async function getProducts(providerId: number, filters?: {
  search?: string;
  colorIds?: number[];
  materialIds?: number[];
  genderIds?: number[];
  cutIds?: number[];
  sizes?: string[];
}) {
  const where: any = {
    providerId,
    type: "CLOTHING",
  };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { color: { name: { contains: filters.search, mode: "insensitive" } } },
      { gender: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  if (filters?.colorIds?.length) {
    where.colorId = { in: filters.colorIds };
  }

  if (filters?.materialIds?.length) {
    where.materialId = { in: filters.materialIds };
  }

  if (filters?.genderIds?.length) {
    where.genderId = { in: filters.genderIds };
  }

  if (filters?.cutIds?.length) {
    where.cutId = { in: filters.cutIds };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      material: true,
      color: true,
      brand: true,
      gender: true,
      cut: true,
      variants: {
        include: { weight: true },
        orderBy: [{ weight: { order: "asc" } }, { size: "asc" }],
      },
    },
    orderBy: [{ color: { order: "asc" } }, { name: "asc" }],
  });

  // Filter by size (post-query since it's on variants)
  if (filters?.sizes?.length) {
    return products.filter((p) =>
      p.variants.some((v) => filters.sizes!.includes(v.size))
    );
  }

  return products;
}

export async function getFilterOptions(providerId: number) {
  const [materials, colors, genders, cuts, sizeGroups, weights] =
    await Promise.all([
      prisma.material.findMany({ orderBy: { order: "asc" } }),
      prisma.color.findMany({ orderBy: { order: "asc" } }),
      prisma.gender.findMany({ orderBy: { order: "asc" } }),
      prisma.cut.findMany({ orderBy: { order: "asc" } }),
      prisma.sizeGroup.findMany({
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      }),
      prisma.weight.findMany({ orderBy: { order: "asc" } }),
    ]);

  return { materials, colors, genders, cuts, sizeGroups, weights };
}

export async function getUserPrices(userId: string) {
  const prices = await prisma.userPrice.findMany({
    where: { userId },
  });

  return new Map(prices.map((p) => [p.variantId, p.customPrice]));
}

export async function saveUserPrice(
  userId: string,
  variantId: number,
  customPrice: number
) {
  await prisma.userPrice.upsert({
    where: { userId_variantId: { userId, variantId } },
    update: { customPrice },
    create: { userId, variantId, customPrice },
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/app/actions/catalogActions.ts
git commit -m "feat: catalog server actions with filters and user prices"
```

---

## Task 7: Product Card Component (Mobile-First)

**Files:**
- Create: `src/components/ProductCard.tsx`
- Create: `src/components/SizeWeightGrid.tsx`

- [ ] **Step 1: Create SizeWeightGrid component**

This is the tallas × pesos table adapted for mobile touch interaction.

Create `src/components/SizeWeightGrid.tsx`:

```tsx
"use client";

type Variant = {
  id: number;
  size: string;
  weightId: number | null;
  weight: { id: number; name: string } | null;
  basePrice: number;
};

type OrderQty = {
  variantId: number;
  quantity: number;
};

interface SizeWeightGridProps {
  variants: Variant[];
  orderQuantities: Map<number, number>;
  onIncrement: (variantId: number) => void;
  onDecrement: (variantId: number) => void;
  onSetQuantity: (variantId: number, qty: number) => void;
}

export default function SizeWeightGrid({
  variants,
  orderQuantities,
  onIncrement,
  onDecrement,
  onSetQuantity,
}: SizeWeightGridProps) {
  // Group variants: sizes as rows, weights as columns
  const weights = [
    ...new Map(
      variants
        .filter((v) => v.weight)
        .map((v) => [v.weight!.id, v.weight!])
    ).values(),
  ];
  const sizes = [...new Set(variants.map((v) => v.size))];

  const hasWeights = weights.length > 0;

  // Build lookup: `${size}-${weightId}` → variant
  const variantMap = new Map(
    variants.map((v) => [`${v.size}-${v.weightId ?? "null"}`, v])
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="px-2 py-1 text-left font-bold text-foreground">
              Talla
            </th>
            {hasWeights ? (
              weights.map((w) => (
                <th
                  key={w.id}
                  className="px-2 py-1 text-center font-bold text-foreground"
                >
                  {w.name}
                </th>
              ))
            ) : (
              <th className="px-2 py-1 text-center font-bold text-foreground">
                Cant.
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size} className="border-b border-border/50">
              <td className="px-2 py-1 font-bold text-foreground">{size}</td>
              {hasWeights ? (
                weights.map((w) => {
                  const variant = variantMap.get(`${size}-${w.id}`);
                  if (!variant) return <td key={w.id} />;
                  const qty = orderQuantities.get(variant.id) || 0;
                  return (
                    <td key={w.id} className="px-1 py-1 text-center">
                      <QuantityCell
                        qty={qty}
                        onIncrement={() => onIncrement(variant.id)}
                        onDecrement={() => onDecrement(variant.id)}
                        onSet={(q) => onSetQuantity(variant.id, q)}
                      />
                    </td>
                  );
                })
              ) : (
                (() => {
                  const variant = variantMap.get(`${size}-null`);
                  if (!variant) return <td />;
                  const qty = orderQuantities.get(variant.id) || 0;
                  return (
                    <td className="px-1 py-1 text-center">
                      <QuantityCell
                        qty={qty}
                        onIncrement={() => onIncrement(variant.id)}
                        onDecrement={() => onDecrement(variant.id)}
                        onSet={(q) => onSetQuantity(variant.id, q)}
                      />
                    </td>
                  );
                })()
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuantityCell({
  qty,
  onIncrement,
  onDecrement,
  onSet,
}: {
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (q: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        type="number"
        min={0}
        defaultValue={qty}
        autoFocus
        className="w-12 rounded border border-primary bg-input px-1 py-0.5 text-center text-xs outline-none"
        onBlur={(e) => {
          const val = parseInt(e.target.value) || 0;
          onSet(val);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    );
  }

  return (
    <button
      onClick={onIncrement}
      onContextMenu={(e) => {
        e.preventDefault();
        if (qty > 0) onDecrement();
      }}
      onDoubleClick={() => setEditing(true)}
      className={`min-w-[2rem] rounded px-2 py-1 text-xs font-bold transition-colors ${
        qty > 0
          ? "bg-primary text-white"
          : "bg-border/30 text-secondary"
      }`}
    >
      {qty || "·"}
    </button>
  );
}

import { useState } from "react";
```

- [ ] **Step 2: Create ProductCard component**

Create `src/components/ProductCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import SizeWeightGrid from "./SizeWeightGrid";

type Product = {
  id: number;
  name: string;
  imageUrl: string | null;
  catalogCode: string | null;
  material: { id: number; name: string; iconUrl: string | null } | null;
  color: { id: number; name: string; hex: string | null; imageUrl: string | null } | null;
  gender: { id: number; name: string; iconUrl: string | null } | null;
  brand: { id: number; name: string } | null;
  cut: { id: number; name: string } | null;
  variants: {
    id: number;
    size: string;
    basePrice: number;
    weightId: number | null;
    weight: { id: number; name: string } | null;
  }[];
};

interface ProductCardProps {
  product: Product;
  orderQuantities: Map<number, number>;
  onIncrement: (variantId: number) => void;
  onDecrement: (variantId: number) => void;
  onSetQuantity: (variantId: number, qty: number) => void;
}

export default function ProductCard({
  product,
  orderQuantities,
  onIncrement,
  onDecrement,
  onSetQuantity,
}: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colorHex = product.color?.hex || "#cccccc";

  // Count total pieces in this card
  const totalPieces = product.variants.reduce(
    (sum, v) => sum + (orderQuantities.get(v.id) || 0),
    0
  );

  // Calculate total cost for this card
  const totalCost = product.variants.reduce(
    (sum, v) => sum + (orderQuantities.get(v.id) || 0) * v.basePrice,
    0
  );

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-sm">
      {/* Header: Image + Info */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        {/* Color/Image */}
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
          {product.imageUrl || product.color?.imageUrl ? (
            <img
              src={product.imageUrl || product.color?.imageUrl || ""}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: colorHex }}
            >
              <svg viewBox="0 0 40 40" className="h-8 w-8 opacity-50">
                <path
                  d="M10 8 L16 4 L24 4 L30 8 L32 16 L28 36 L12 36 L8 16 Z"
                  fill="white"
                  fillOpacity="0.3"
                  stroke="white"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border border-border/50"
              style={{ backgroundColor: colorHex }}
            />
            <span className="text-sm font-bold text-foreground truncate">
              {product.color?.name || "Sin color"}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-secondary">
            {product.material && <span>{product.material.name}</span>}
            {product.cut && <span>· {product.cut.name}</span>}
            {product.gender && <span>· {product.gender.name}</span>}
          </div>
          {product.catalogCode && (
            <span className="text-[10px] text-secondary/70">
              {product.catalogCode}
            </span>
          )}
        </div>

        {/* Pieces badge */}
        {totalPieces > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-primary">
              {totalPieces}
            </span>
            <span className="text-[10px] text-secondary">pzs</span>
          </div>
        )}
      </button>

      {/* Expanded: Size/Weight grid */}
      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <SizeWeightGrid
            variants={product.variants}
            orderQuantities={orderQuantities}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onSetQuantity={onSetQuantity}
          />

          {totalPieces > 0 && (
            <div
              className="mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: colorHex,
                color: isLightColor(colorHex) ? "#221B16" : "#FFFFFF",
              }}
            >
              <span className="font-bold">{totalPieces} piezas</span>
              <span className="font-bold">
                ${totalCost.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/components/ProductCard.tsx src/components/SizeWeightGrid.tsx
git commit -m "feat: mobile-first ProductCard and SizeWeightGrid components"
```

---

## Task 8: Filter Bar Component (Mobile-First)

**Files:**
- Create: `src/components/FilterBar.tsx`

- [ ] **Step 1: Create collapsible mobile filter bar**

Create `src/components/FilterBar.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

type FilterOptions = {
  materials: { id: number; name: string }[];
  colors: { id: number; name: string; hex: string | null }[];
  genders: { id: number; name: string }[];
  cuts: { id: number; name: string }[];
  sizeGroups: {
    id: number;
    name: string;
    options: { id: number; name: string }[];
  }[];
};

interface FilterBarProps {
  options: FilterOptions;
  filters: {
    search: string;
    colorIds: number[];
    materialIds: number[];
    genderIds: number[];
    cutIds: number[];
    sizes: string[];
  };
  onFiltersChange: (filters: FilterBarProps["filters"]) => void;
}

export default function FilterBar({
  options,
  filters,
  onFiltersChange,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    filters.colorIds.length +
    filters.materialIds.length +
    filters.genderIds.length +
    filters.cutIds.length +
    filters.sizes.length;

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function clearAll() {
    onFiltersChange({
      search: "",
      colorIds: [],
      materialIds: [],
      genderIds: [],
      cutIds: [],
      sizes: [],
    });
  }

  return (
    <div className="sticky top-0 z-40 bg-background">
      {/* Search + Filter toggle */}
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full rounded-[12px] border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={() => setOpen(!open)}
          className={`relative rounded-[12px] border p-2 transition-colors ${
            open || activeCount > 0
              ? "border-primary bg-primary text-white"
              : "border-border bg-card text-secondary"
          }`}
        >
          <SlidersHorizontal size={18} />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {open && (
        <div className="space-y-4 border-b border-border px-4 pb-4">
          {/* Colors */}
          {options.colors.length > 0 && (
            <FilterSection title="Color">
              <div className="flex flex-wrap gap-2">
                {options.colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        colorIds: toggle(filters.colorIds, c.id),
                      })
                    }
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      filters.colorIds.includes(c.id)
                        ? "scale-110 border-primary"
                        : "border-border/50"
                    }`}
                    style={{ backgroundColor: c.hex || "#ccc" }}
                    title={c.name}
                  />
                ))}
              </div>
            </FilterSection>
          )}

          {/* Material */}
          {options.materials.length > 0 && (
            <FilterSection title="Material">
              <div className="flex flex-wrap gap-2">
                {options.materials.map((m) => (
                  <BadgeFilter
                    key={m.id}
                    label={m.name}
                    active={filters.materialIds.includes(m.id)}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        materialIds: toggle(filters.materialIds, m.id),
                      })
                    }
                  />
                ))}
              </div>
            </FilterSection>
          )}

          {/* Gender */}
          {options.genders.length > 0 && (
            <FilterSection title="Género">
              <div className="flex flex-wrap gap-2">
                {options.genders.map((g) => (
                  <BadgeFilter
                    key={g.id}
                    label={g.name}
                    active={filters.genderIds.includes(g.id)}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        genderIds: toggle(filters.genderIds, g.id),
                      })
                    }
                  />
                ))}
              </div>
            </FilterSection>
          )}

          {/* Cut */}
          {options.cuts.length > 0 && (
            <FilterSection title="Corte">
              <div className="flex flex-wrap gap-2">
                {options.cuts.map((c) => (
                  <BadgeFilter
                    key={c.id}
                    label={c.name}
                    active={filters.cutIds.includes(c.id)}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        cutIds: toggle(filters.cutIds, c.id),
                      })
                    }
                  />
                ))}
              </div>
            </FilterSection>
          )}

          {/* Sizes */}
          {options.sizeGroups.length > 0 && (
            <FilterSection title="Tallas">
              {options.sizeGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  <span className="text-[10px] font-bold uppercase text-secondary">
                    {group.name}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {group.options.map((size) => (
                      <BadgeFilter
                        key={size.id}
                        label={size.name}
                        active={filters.sizes.includes(size.name)}
                        onClick={() =>
                          onFiltersChange({
                            ...filters,
                            sizes: toggle(filters.sizes, size.name),
                          })
                        }
                        small
                      />
                    ))}
                  </div>
                </div>
              ))}
            </FilterSection>
          )}

          {/* Clear all */}
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-error"
            >
              <X size={12} />
              Limpiar filtros ({activeCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-bold text-foreground">
        {title}
      </span>
      {children}
    </div>
  );
}

function BadgeFilter({
  label,
  active,
  onClick,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 transition-colors ${
        small ? "py-0.5 text-[10px]" : "py-1 text-xs"
      } ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/components/FilterBar.tsx
git commit -m "feat: mobile-first collapsible filter bar with color swatches and badges"
```

---

## Task 9: Order Context (Cart State)

**Files:**
- Create: `src/components/OrderContext.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create order context adapted from Ekipu's CartContext**

Create `src/components/OrderContext.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface OrderItem {
  variantId: number;
  productId: number;
  productName: string;
  colorName: string;
  colorHex: string;
  materialName: string;
  genderName: string;
  cutName: string;
  size: string;
  weightName: string;
  quantity: number;
  unitCost: number;
  imageUrl: string;
  catalogCode: string;
}

interface OrderContextValue {
  items: Map<number, OrderItem>; // variantId → OrderItem
  totalPieces: number;
  totalCost: number;

  increment: (variantId: number, productInfo: Omit<OrderItem, "quantity">) => void;
  decrement: (variantId: number) => void;
  setQuantity: (variantId: number, qty: number, productInfo: Omit<OrderItem, "quantity">) => void;
  clearAll: () => void;
  getItems: () => OrderItem[];
}

const OrderContext = createContext<OrderContextValue | null>(null);

const STORAGE_KEY = "comanda_yazbeck_order";

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Map<number, OrderItem>>(new Map());

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: OrderItem[] = JSON.parse(saved);
        setItems(new Map(parsed.map((item) => [item.variantId, item])));
      }
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    const arr = Array.from(items.values()).filter((i) => i.quantity > 0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }, [items]);

  const increment = useCallback(
    (variantId: number, productInfo: Omit<OrderItem, "quantity">) => {
      setItems((prev) => {
        const next = new Map(prev);
        const existing = next.get(variantId);
        if (existing) {
          next.set(variantId, { ...existing, quantity: existing.quantity + 1 });
        } else {
          next.set(variantId, { ...productInfo, quantity: 1 });
        }
        return next;
      });
    },
    []
  );

  const decrement = useCallback((variantId: number) => {
    setItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(variantId);
      if (existing && existing.quantity > 1) {
        next.set(variantId, { ...existing, quantity: existing.quantity - 1 });
      } else {
        next.delete(variantId);
      }
      return next;
    });
  }, []);

  const setQuantity = useCallback(
    (variantId: number, qty: number, productInfo: Omit<OrderItem, "quantity">) => {
      setItems((prev) => {
        const next = new Map(prev);
        if (qty <= 0) {
          next.delete(variantId);
        } else {
          next.set(variantId, { ...productInfo, quantity: qty });
        }
        return next;
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    setItems(new Map());
  }, []);

  const getItems = useCallback(() => {
    return Array.from(items.values()).filter((i) => i.quantity > 0);
  }, [items]);

  const totalPieces = Array.from(items.values()).reduce(
    (sum, i) => sum + i.quantity,
    0
  );

  const totalCost = Array.from(items.values()).reduce(
    (sum, i) => sum + i.quantity * i.unitCost,
    0
  );

  return (
    <OrderContext.Provider
      value={{
        items,
        totalPieces,
        totalCost,
        increment,
        decrement,
        setQuantity,
        clearAll,
        getItems,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
```

- [ ] **Step 2: Wrap app layout with OrderProvider**

Update `src/app/(app)/layout.tsx` to wrap children with `<OrderProvider>`:

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/authActions";
import MobileNav from "@/components/MobileNav";
import { OrderProvider } from "@/components/OrderContext";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <OrderProvider>
      <div className="min-h-dvh pb-16">
        {children}
        <MobileNav isAdmin={user.role === "ADMIN"} />
      </div>
    </OrderProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/components/OrderContext.tsx "src/app/(app)/layout.tsx"
git commit -m "feat: order context with localStorage persistence for quantity tracking"
```

---

## Task 10: Catalog Page (Wiring It All Together)

**Files:**
- Create: `src/app/(app)/catalogo/page.tsx`
- Create: `src/app/(app)/catalogo/CatalogoClient.tsx`

- [ ] **Step 1: Create catalog server page**

Create `src/app/(app)/catalogo/page.tsx`:

```tsx
import { getProducts, getFilterOptions } from "@/app/actions/catalogActions";
import { getCurrentUser } from "@/app/actions/authActions";
import CatalogoClient from "./CatalogoClient";
import { redirect } from "next/navigation";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ proveedor?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const providerId = parseInt(params.proveedor || "1");

  const [products, filterOptions] = await Promise.all([
    getProducts(providerId),
    getFilterOptions(providerId),
  ]);

  return (
    <CatalogoClient
      initialProducts={products}
      filterOptions={filterOptions}
      providerId={providerId}
      userId={user.id}
    />
  );
}
```

- [ ] **Step 2: Create catalog client component**

Create `src/app/(app)/catalogo/CatalogoClient.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import { useOrder } from "@/components/OrderContext";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  imageUrl: string | null;
  catalogCode: string | null;
  material: { id: number; name: string; iconUrl: string | null } | null;
  color: { id: number; name: string; hex: string | null; imageUrl: string | null } | null;
  brand: { id: number; name: string } | null;
  gender: { id: number; name: string; iconUrl: string | null } | null;
  cut: { id: number; name: string } | null;
  variants: {
    id: number;
    size: string;
    basePrice: number;
    weightId: number | null;
    weight: { id: number; name: string } | null;
  }[];
};

type FilterOptions = {
  materials: { id: number; name: string }[];
  colors: { id: number; name: string; hex: string | null }[];
  genders: { id: number; name: string }[];
  cuts: { id: number; name: string }[];
  sizeGroups: {
    id: number;
    name: string;
    options: { id: number; name: string }[];
  }[];
};

interface CatalogoClientProps {
  initialProducts: Product[];
  filterOptions: FilterOptions;
  providerId: number;
  userId: string;
}

export default function CatalogoClient({
  initialProducts,
  filterOptions,
  providerId,
  userId,
}: CatalogoClientProps) {
  const { items, totalPieces, totalCost, increment, decrement, setQuantity } =
    useOrder();

  const [filters, setFilters] = useState({
    search: "",
    colorIds: [] as number[],
    materialIds: [] as number[],
    genderIds: [] as number[],
    cutIds: [] as number[],
    sizes: [] as string[],
  });

  const [visibleCount, setVisibleCount] = useState(30);

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    let result = initialProducts;

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.color?.name.toLowerCase().includes(s) ||
          p.gender?.name.toLowerCase().includes(s)
      );
    }

    if (filters.colorIds.length) {
      result = result.filter((p) =>
        p.color ? filters.colorIds.includes(p.color.id) : false
      );
    }

    if (filters.materialIds.length) {
      result = result.filter((p) =>
        p.material ? filters.materialIds.includes(p.material.id) : false
      );
    }

    if (filters.genderIds.length) {
      result = result.filter((p) =>
        p.gender ? filters.genderIds.includes(p.gender.id) : false
      );
    }

    if (filters.cutIds.length) {
      result = result.filter((p) =>
        p.cut ? filters.cutIds.includes(p.cut.id) : false
      );
    }

    if (filters.sizes.length) {
      result = result.filter((p) =>
        p.variants.some((v) => filters.sizes.includes(v.size))
      );
    }

    return result;
  }, [initialProducts, filters]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  function makeProductInfo(product: Product, variant: Product["variants"][0]) {
    return {
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      colorName: product.color?.name || "",
      colorHex: product.color?.hex || "#ccc",
      materialName: product.material?.name || "",
      genderName: product.gender?.name || "",
      cutName: product.cut?.name || "",
      size: variant.size,
      weightName: variant.weight?.name || "",
      unitCost: variant.basePrice,
      imageUrl: product.imageUrl || product.color?.imageUrl || "",
      catalogCode: product.catalogCode || "",
    };
  }

  return (
    <div className="relative">
      <FilterBar
        options={filterOptions}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Product list */}
      <div className="space-y-3 px-4 py-3">
        <p className="text-xs text-secondary">
          {filteredProducts.length} productos
        </p>

        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            orderQuantities={items}
            onIncrement={(variantId) => {
              const variant = product.variants.find((v) => v.id === variantId)!;
              increment(variantId, makeProductInfo(product, variant));
            }}
            onDecrement={(variantId) => decrement(variantId)}
            onSetQuantity={(variantId, qty) => {
              const variant = product.variants.find((v) => v.id === variantId)!;
              setQuantity(variantId, qty, makeProductInfo(product, variant));
            }}
          />
        ))}

        {visibleCount < filteredProducts.length && (
          <button
            onClick={() => setVisibleCount((c) => c + 30)}
            className="w-full rounded-[12px] border border-border py-3 text-sm text-secondary"
          >
            Ver más ({filteredProducts.length - visibleCount} restantes)
          </button>
        )}
      </div>

      {/* Floating order summary */}
      {totalPieces > 0 && (
        <Link
          href="/pedido"
          className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between rounded-[12px] bg-primary px-4 py-3 text-white shadow-lg"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <span className="font-bold">{totalPieces} piezas</span>
          </div>
          <span className="font-bold">
            ${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add "src/app/(app)/catalogo/"
git commit -m "feat: catalog page with product cards, filters, and floating order summary"
```

---

## Task 11: Purchase Sessions

**Files:**
- Create: `src/app/actions/sessionActions.ts`
- Create: `src/app/(app)/pedido/page.tsx`
- Create: `src/app/(app)/pedido/[id]/page.tsx`
- Create: `src/components/SessionSummary.tsx`

- [ ] **Step 1: Create session server actions**

Create `src/app/actions/sessionActions.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./authActions";
import { revalidatePath } from "next/cache";

export async function createSession(name: string, items: { variantId: number; quantity: number; unitCost: number }[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const session = await prisma.purchaseSession.create({
    data: {
      name,
      userId: user.id,
      items: {
        create: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
    },
  });

  revalidatePath("/pedido");
  return session;
}

export async function getSessions() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  return prisma.purchaseSession.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { color: true, material: true, gender: true, cut: true },
              },
              weight: true,
            },
          },
        },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSession(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  return prisma.purchaseSession.findFirst({
    where: { id, userId: user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { color: true, material: true, gender: true, cut: true, brand: true },
              },
              weight: true,
            },
          },
        },
      },
      verificationResults: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function confirmSession(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.purchaseSession.update({
    where: { id },
    data: { status: "CONFIRMADO", confirmedAt: new Date() },
  });

  revalidatePath("/pedido");
  revalidatePath(`/pedido/${id}`);
}

export async function markReceived(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.purchaseSession.update({
    where: { id },
    data: { status: "RECIBIDO", receivedAt: new Date() },
  });

  revalidatePath("/pedido");
  revalidatePath(`/pedido/${id}`);
  revalidatePath("/bitacora");
}

export async function deleteSession(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.purchaseSession.delete({
    where: { id },
  });

  revalidatePath("/pedido");
}
```

- [ ] **Step 2: Create sessions list page**

Create `src/app/(app)/pedido/page.tsx`:

```tsx
import { getSessions } from "@/app/actions/sessionActions";
import Link from "next/link";
import { Plus, Package, Clock, CheckCircle } from "lucide-react";

const statusConfig = {
  BORRADOR: { label: "Borrador", color: "text-warning", icon: Clock },
  CONFIRMADO: { label: "En camino", color: "text-primary", icon: Package },
  RECIBIDO: { label: "Recibido", color: "text-success", icon: CheckCircle },
};

export default async function PedidoPage() {
  const sessions = await getSessions();

  return (
    <main className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Mis Pedidos</h1>
        <Link
          href="/pedido/nuevo"
          className="flex items-center gap-1 rounded-[12px] bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} />
          Nuevo
        </Link>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const config = statusConfig[session.status as keyof typeof statusConfig];
          const Icon = config.icon;
          const totalCost = session.items.reduce(
            (sum, item) => sum + item.quantity * item.unitCost,
            0
          );
          const totalPieces = session.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return (
            <Link
              key={session.id}
              href={`/pedido/${session.id}`}
              className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-4 shadow-sm"
            >
              <Icon size={24} className={config.color} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">
                  {session.name}
                </p>
                <p className="text-xs text-secondary">
                  {totalPieces} pzs · ${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className={`text-xs font-bold ${config.color}`}>
                {config.label}
              </span>
            </Link>
          );
        })}

        {sessions.length === 0 && (
          <p className="py-8 text-center text-secondary">
            No tienes pedidos aún
          </p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create session detail page**

Create `src/app/(app)/pedido/[id]/page.tsx`:

```tsx
import { getSession, confirmSession, markReceived } from "@/app/actions/sessionActions";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, FileCheck, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(parseInt(id));
  if (!session) redirect("/pedido");

  const totalCost = session.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );
  const totalPieces = session.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <main className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/pedido" className="text-secondary">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-primary">{session.name}</h1>
          <p className="text-xs text-secondary">
            {new Date(session.createdAt).toLocaleDateString("es-MX")}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-[12px] bg-card border border-border p-3 text-center">
          <p className="text-2xl font-bold text-primary">{totalPieces}</p>
          <p className="text-xs text-secondary">Piezas</p>
        </div>
        <div className="flex-1 rounded-[12px] bg-card border border-border p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            ${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-secondary">Total</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 space-y-2">
        {session.status === "BORRADOR" && (
          <>
            <a
              href={`/api/fill-comanda?sessionId=${session.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-primary py-3 font-bold text-white"
            >
              <Download size={18} />
              Generar Comanda Excel
            </a>
            <form action={async () => { "use server"; await confirmSession(session.id); }}>
              <button
                type="submit"
                className="w-full rounded-[12px] border border-primary py-3 text-sm font-bold text-primary"
              >
                Marcar como enviada
              </button>
            </form>
          </>
        )}

        {session.status === "CONFIRMADO" && (
          <>
            <Link
              href={`/pedido/${session.id}/verificar`}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-success py-3 font-bold text-white"
            >
              <FileCheck size={18} />
              Verificar PDF de confirmación
            </Link>
            <form action={async () => { "use server"; await markReceived(session.id); }}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-success py-3 text-sm font-bold text-success"
              >
                <CheckCircle size={18} />
                Confirmar que llegó todo
              </button>
            </form>
          </>
        )}
      </div>

      {/* Items list */}
      <h2 className="mb-2 text-sm font-bold text-foreground">
        Productos ({session.items.length})
      </h2>
      <div className="space-y-2">
        {session.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3"
          >
            <div
              className="h-8 w-8 rounded-full"
              style={{
                backgroundColor: item.variant.product.color?.hex || "#ccc",
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {item.variant.product.color?.name} — {item.variant.size}
                {item.variant.weight ? ` · ${item.variant.weight.name}` : ""}
              </p>
              <p className="text-xs text-secondary">
                {item.variant.product.material?.name} · {item.variant.product.gender?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">
                ×{item.quantity}
              </p>
              <p className="text-xs text-secondary">
                ${(item.quantity * item.unitCost).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/app/actions/sessionActions.ts "src/app/(app)/pedido/"
git commit -m "feat: purchase sessions with list, detail, confirm, and receive"
```

---

## Task 12: Excel Generation API Route

**Files:**
- Create: `src/app/api/fill-comanda/route.ts`
- Create: `src/app/actions/yazbeckActions.ts`

- [ ] **Step 1: Create Yazbeck server actions**

Create `src/app/actions/yazbeckActions.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";

export async function getYazbeckMappings(productIds: number[]) {
  return prisma.yazbeckMapping.findMany({
    where: { productId: { in: productIds } },
  });
}

export async function saveYazbeckMapping(data: {
  productId: number;
  sheetName: string;
  estilo: string;
  yazbeckColor: string;
}) {
  return prisma.yazbeckMapping.upsert({
    where: { productId: data.productId },
    update: data,
    create: data,
  });
}
```

- [ ] **Step 2: Create fill-comanda API route**

Create `src/app/api/fill-comanda/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";
import { resolveCell, getQuantityRanges, parseSheetStructure } from "@/lib/yazbeckComanda";
import { readComandaSheet, fillComanda } from "@/lib/comandaXlsx";

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sessionId = parseInt(request.nextUrl.searchParams.get("sessionId") || "0");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Get session with items and mappings
  const session = await prisma.purchaseSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { yazbeckMapping: true, color: true, material: true, gender: true },
              },
              weight: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // TODO: Read comanda template from Supabase Storage or bundled file
  // For now, return error explaining setup needed
  // const templateBuffer = await getComandaTemplate();
  // const structure = await parseComandaStructure(templateBuffer);
  // const cellWrites = buildCellWrites(session.items, structure);
  // const filledBuffer = await fillComanda(templateBuffer, quantityRanges, cellWrites);

  // Return filled Excel
  // return new NextResponse(filledBuffer, {
  //   headers: {
  //     "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //     "Content-Disposition": `attachment; filename="comanda-${session.name}.xlsx"`,
  //   },
  // });

  return NextResponse.json(
    { error: "Comanda template not configured yet. Upload template in admin." },
    { status: 501 }
  );
}
```

Note: The full Excel generation logic will be wired up in Task 14 (Admin panel) after the template upload is implemented.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/app/actions/yazbeckActions.ts src/app/api/fill-comanda/
git commit -m "feat: Yazbeck actions and fill-comanda API route scaffold"
```

---

## Task 13: PDF Verification

**Files:**
- Create: `src/app/api/verify-pdf/route.ts`
- Create: `src/components/PdfVerifier.tsx`
- Create: `src/app/(app)/pedido/[id]/verificar/page.tsx`

- [ ] **Step 1: Create PDF verification API route**

Create `src/app/api/verify-pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseProviderPdf } from "@/lib/yazbeckPdfParser";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("pdf") as File;
  const sessionId = parseInt(formData.get("sessionId") as string);

  if (!file || !sessionId) {
    return NextResponse.json({ error: "Missing pdf or sessionId" }, { status: 400 });
  }

  // Parse PDF
  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfData = await parseProviderPdf(buffer);

  // Get session items for comparison
  const session = await prisma.purchaseSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { yazbeckMapping: true, color: true, gender: true },
              },
              weight: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Compare: build expected vs actual
  const differences: {
    type: "missing" | "extra" | "quantity_mismatch";
    estilo: string;
    color: string;
    size: string;
    expected: number;
    actual: number;
  }[] = [];

  let totalMatches = 0;

  // Build expected map from session items
  const expectedMap = new Map<string, { quantity: number; estilo: string; color: string; size: string }>();
  for (const item of session.items) {
    const mapping = item.variant.product.yazbeckMapping;
    if (!mapping) continue;
    const key = `${mapping.estilo}-${mapping.yazbeckColor}-${item.variant.size}`;
    expectedMap.set(key, {
      quantity: item.quantity,
      estilo: mapping.estilo,
      color: mapping.yazbeckColor,
      size: item.variant.size,
    });
  }

  // Compare with PDF items
  const pdfMatched = new Set<string>();
  for (const pdfItem of pdfData.items) {
    const key = `${pdfItem.estilo}-${pdfItem.colorCode}-${pdfItem.size}`;
    pdfMatched.add(key);

    const expected = expectedMap.get(key);
    if (!expected) {
      differences.push({
        type: "extra",
        estilo: pdfItem.estilo,
        color: pdfItem.colorCode,
        size: pdfItem.size,
        expected: 0,
        actual: pdfItem.quantity,
      });
    } else if (expected.quantity !== pdfItem.quantity) {
      differences.push({
        type: "quantity_mismatch",
        estilo: pdfItem.estilo,
        color: pdfItem.colorCode,
        size: pdfItem.size,
        expected: expected.quantity,
        actual: pdfItem.quantity,
      });
    } else {
      totalMatches++;
    }
  }

  // Check for items we expected but weren't in PDF
  for (const [key, expected] of expectedMap) {
    if (!pdfMatched.has(key)) {
      differences.push({
        type: "missing",
        estilo: expected.estilo,
        color: expected.color,
        size: expected.size,
        expected: expected.quantity,
        actual: 0,
      });
    }
  }

  // Save verification result
  const result = await prisma.verificationResult.create({
    data: {
      sessionId,
      pdfFileName: file.name,
      totalMatches,
      totalDifferences: differences.length,
      details: differences,
    },
  });

  return NextResponse.json({
    id: result.id,
    pdfInfo: {
      orderNumber: pdfData.orderNumber,
      date: pdfData.date,
      totalPieces: pdfData.totalPieces,
      totalAmount: pdfData.totalAmount,
    },
    totalMatches,
    totalDifferences: differences.length,
    differences,
  });
}
```

- [ ] **Step 2: Create PdfVerifier component**

Create `src/components/PdfVerifier.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Upload, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type Difference = {
  type: "missing" | "extra" | "quantity_mismatch";
  estilo: string;
  color: string;
  size: string;
  expected: number;
  actual: number;
};

type VerificationResult = {
  pdfInfo: {
    orderNumber: string;
    date: string;
    totalPieces: number;
    totalAmount: number;
  };
  totalMatches: number;
  totalDifferences: number;
  differences: Difference[];
};

export default function PdfVerifier({ sessionId }: { sessionId: number }) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("sessionId", sessionId.toString());

    try {
      const res = await fetch("/api/verify-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al verificar");
      }

      setResult(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!result) {
    return (
      <div className="space-y-4">
        <label className="flex flex-col items-center gap-3 rounded-[12px] border-2 border-dashed border-border p-8 text-center">
          <Upload size={32} className="text-secondary" />
          <span className="text-sm text-secondary">
            {loading ? "Verificando..." : "Sube el PDF de confirmación de Yazbeck"}
          </span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={loading}
            className="hidden"
          />
        </label>
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-[12px] border border-border bg-card p-4">
        <p className="text-xs text-secondary">
          Pedido #{result.pdfInfo.orderNumber} · {result.pdfInfo.date}
        </p>
        <div className="mt-2 flex gap-3">
          <div className="flex items-center gap-1 text-success">
            <CheckCircle size={16} />
            <span className="text-sm font-bold">{result.totalMatches} correctos</span>
          </div>
          {result.totalDifferences > 0 && (
            <div className="flex items-center gap-1 text-error">
              <AlertTriangle size={16} />
              <span className="text-sm font-bold">
                {result.totalDifferences} diferencias
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Differences */}
      {result.differences.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Diferencias encontradas</h3>
          {result.differences.map((diff, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-[12px] border p-3 ${
                diff.type === "missing"
                  ? "border-error/30 bg-red-50"
                  : diff.type === "extra"
                  ? "border-warning/30 bg-yellow-50"
                  : "border-warning/30 bg-yellow-50"
              }`}
            >
              {diff.type === "missing" ? (
                <XCircle size={18} className="text-error" />
              ) : (
                <AlertTriangle size={18} className="text-warning" />
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">
                  {diff.estilo} · {diff.color} · {diff.size}
                </p>
                <p className="text-xs text-secondary">
                  {diff.type === "missing" && `Falta: pediste ${diff.expected}, no aparece en PDF`}
                  {diff.type === "extra" && `Extra: ${diff.actual} pzs en PDF, no en tu pedido`}
                  {diff.type === "quantity_mismatch" &&
                    `Cantidad: pediste ${diff.expected}, PDF dice ${diff.actual}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.totalDifferences === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-success">
          <CheckCircle size={48} />
          <p className="text-lg font-bold">Todo coincide</p>
          <p className="text-sm text-secondary">Tu pedido y la confirmación son iguales</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create verification page**

Create `src/app/(app)/pedido/[id]/verificar/page.tsx`:

```tsx
import { getSession } from "@/app/actions/sessionActions";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PdfVerifier from "@/components/PdfVerifier";

export default async function VerificarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(parseInt(id));
  if (!session) redirect("/pedido");

  return (
    <main className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href={`/pedido/${id}`} className="text-secondary">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-primary">Verificar PDF</h1>
          <p className="text-xs text-secondary">{session.name}</p>
        </div>
      </div>

      <PdfVerifier sessionId={session.id} />
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/app/api/verify-pdf/ src/components/PdfVerifier.tsx "src/app/(app)/pedido/[id]/verificar/"
git commit -m "feat: PDF verification with comparison against purchase session"
```

---

## Task 14: Bitácora (Purchase History)

**Files:**
- Create: `src/app/(app)/bitacora/page.tsx`

- [ ] **Step 1: Create bitácora page**

Create `src/app/(app)/bitacora/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/authActions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, Package } from "lucide-react";

export default async function BitacoraPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await prisma.purchaseSession.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusConfig = {
    BORRADOR: { label: "Borrador", color: "text-warning", bg: "bg-yellow-50", icon: Clock },
    CONFIRMADO: { label: "En camino", color: "text-primary", bg: "bg-purple-50", icon: Package },
    RECIBIDO: { label: "Recibido", color: "text-success", bg: "bg-green-50", icon: CheckCircle },
  };

  return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-bold text-primary">Bitácora de Pedidos</h1>

      {/* Summary cards */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {(["BORRADOR", "CONFIRMADO", "RECIBIDO"] as const).map((status) => {
          const config = statusConfig[status];
          const count = sessions.filter((s) => s.status === status).length;
          return (
            <div
              key={status}
              className={`rounded-[12px] ${config.bg} p-3 text-center`}
            >
              <p className={`text-lg font-bold ${config.color}`}>{count}</p>
              <p className="text-[10px] text-secondary">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="space-y-2">
        {sessions.map((session) => {
          const config = statusConfig[session.status as keyof typeof statusConfig];
          const Icon = config.icon;
          const totalCost = session.items.reduce(
            (sum, item) => sum + item.quantity * item.unitCost,
            0
          );
          const totalPieces = session.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return (
            <Link
              key={session.id}
              href={`/pedido/${session.id}`}
              className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3"
            >
              <Icon size={20} className={config.color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {session.name}
                </p>
                <p className="text-[10px] text-secondary">
                  {new Date(session.createdAt).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {session.receivedAt &&
                    ` · Recibido ${new Date(session.receivedAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  ${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-secondary">{totalPieces} pzs</p>
              </div>
            </Link>
          );
        })}

        {sessions.length === 0 && (
          <p className="py-8 text-center text-secondary">
            No hay pedidos en la bitácora
          </p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add "src/app/(app)/bitacora/"
git commit -m "feat: bitácora page with purchase history and summary cards"
```

---

## Task 15: Admin Panel

**Files:**
- Create: `src/app/actions/adminActions.ts`
- Create: `src/app/(app)/admin/page.tsx`
- Create: `src/app/(app)/admin/codigos/page.tsx`
- Create: `src/app/(app)/admin/usuarios/page.tsx`
- Create: `src/app/(app)/admin/catalogo/page.tsx`

- [ ] **Step 1: Create admin server actions**

Create `src/app/actions/adminActions.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./authActions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorized");
  return user;
}

// === ACTIVATION CODES ===

export async function generateCodes(count: number) {
  await requireAdmin();

  const codes = Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  await prisma.activationCode.createMany({
    data: codes.map((code) => ({ code })),
  });

  revalidatePath("/admin/codigos");
  return codes;
}

export async function getCodes() {
  await requireAdmin();
  return prisma.activationCode.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// === USERS ===

export async function getUsers() {
  await requireAdmin();
  return prisma.userProfile.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.userProfile.update({
    where: { id: userId },
    data: { isActive },
  });
  revalidatePath("/admin/usuarios");
}

// === CATALOG MANAGEMENT ===

export async function createProduct(data: {
  name: string;
  providerId: number;
  materialId?: number;
  colorId?: number;
  brandId?: number;
  genderId?: number;
  cutId?: number;
  imageUrl?: string;
  catalogCode?: string;
  variants: { size: string; weightId?: number; basePrice: number }[];
}) {
  await requireAdmin();

  const product = await prisma.product.create({
    data: {
      name: data.name,
      providerId: data.providerId,
      materialId: data.materialId,
      colorId: data.colorId,
      brandId: data.brandId,
      genderId: data.genderId,
      cutId: data.cutId,
      imageUrl: data.imageUrl,
      catalogCode: data.catalogCode,
      variants: {
        create: data.variants.map((v) => ({
          size: v.size,
          weightId: v.weightId,
          basePrice: v.basePrice,
        })),
      },
    },
  });

  revalidatePath("/admin/catalogo");
  return product;
}

export async function updateProduct(
  id: number,
  data: {
    name?: string;
    imageUrl?: string;
    catalogCode?: string;
    materialId?: number;
    colorId?: number;
    brandId?: number;
    genderId?: number;
    cutId?: number;
  }
) {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data });
  revalidatePath("/admin/catalogo");
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/catalogo");
}

export async function getAdminStats() {
  await requireAdmin();

  const [totalUsers, activeUsers, totalCodes, usedCodes, totalProducts] =
    await Promise.all([
      prisma.userProfile.count(),
      prisma.userProfile.count({ where: { isActive: true } }),
      prisma.activationCode.count(),
      prisma.activationCode.count({ where: { isUsed: true } }),
      prisma.product.count(),
    ]);

  return { totalUsers, activeUsers, totalCodes, usedCodes, totalProducts };
}

// === CATALOG ITEMS (Materials, Colors, etc.) ===

export async function upsertCatalogItem(
  type: "material" | "color" | "brand" | "gender" | "cut" | "weight",
  data: { id?: number; name: string; hex?: string; iconUrl?: string; imageUrl?: string; order?: number }
) {
  await requireAdmin();

  const model = {
    material: prisma.material,
    color: prisma.color,
    brand: prisma.brand,
    gender: prisma.gender,
    cut: prisma.cut,
    weight: prisma.weight,
  }[type] as any;

  if (data.id) {
    return model.update({ where: { id: data.id }, data });
  } else {
    return model.create({ data });
  }
}
```

- [ ] **Step 2: Create admin dashboard page**

Create `src/app/(app)/admin/page.tsx`:

```tsx
import { getAdminStats } from "@/app/actions/adminActions";
import Link from "next/link";
import { Key, Users, Package } from "lucide-react";

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-bold text-primary">Admin</h1>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Usuarios activos" value={stats.activeUsers} total={stats.totalUsers} />
        <StatCard label="Códigos usados" value={stats.usedCodes} total={stats.totalCodes} />
        <StatCard label="Productos" value={stats.totalProducts} />
        <StatCard label="Códigos disponibles" value={stats.totalCodes - stats.usedCodes} />
      </div>

      {/* Quick links */}
      <div className="space-y-3">
        <AdminLink href="/admin/codigos" icon={Key} label="Códigos de activación" desc="Generar y gestionar códigos" />
        <AdminLink href="/admin/usuarios" icon={Users} label="Usuarios" desc="Gestionar cuentas" />
        <AdminLink href="/admin/catalogo" icon={Package} label="Catálogo" desc="Productos y precios" />
      </div>
    </main>
  );
}

function StatCard({ label, value, total }: { label: string; value: number; total?: number }) {
  return (
    <div className="rounded-[12px] border border-border bg-card p-3">
      <p className="text-2xl font-bold text-primary">
        {value}
        {total !== undefined && <span className="text-sm text-secondary">/{total}</span>}
      </p>
      <p className="text-xs text-secondary">{label}</p>
    </div>
  );
}

function AdminLink({ href, icon: Icon, label, desc }: { href: string; icon: any; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-4 shadow-sm"
    >
      <Icon size={24} className="text-primary" />
      <div>
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-xs text-secondary">{desc}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create activation codes page**

Create `src/app/(app)/admin/codigos/page.tsx`:

```tsx
import { getCodes, generateCodes } from "@/app/actions/adminActions";
import { ArrowLeft, Plus, Check, Clock } from "lucide-react";
import Link from "next/link";

export default async function CodigosPage() {
  const codes = await getCodes();

  return (
    <main className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin" className="text-secondary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-lg font-bold text-primary">Códigos</h1>
        <form action={async () => { "use server"; await generateCodes(5); }}>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-[12px] bg-primary px-3 py-2 text-xs font-bold text-white"
          >
            <Plus size={14} />
            Generar 5
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {codes.map((code) => (
          <div
            key={code.id}
            className={`flex items-center gap-3 rounded-[12px] border p-3 ${
              code.isUsed ? "border-border/50 bg-card/50" : "border-border bg-card"
            }`}
          >
            {code.isUsed ? (
              <Check size={16} className="text-success" />
            ) : (
              <Clock size={16} className="text-warning" />
            )}
            <span className="flex-1 font-mono text-sm font-bold tracking-wider">
              {code.code}
            </span>
            <span className="text-xs text-secondary">
              {code.isUsed
                ? `Usado ${new Date(code.usedAt!).toLocaleDateString("es-MX")}`
                : "Disponible"}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Create users management page**

Create `src/app/(app)/admin/usuarios/page.tsx`:

```tsx
import { getUsers, toggleUserActive } from "@/app/actions/adminActions";
import { ArrowLeft, User, ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";

export default async function UsuariosPage() {
  const users = await getUsers();

  return (
    <main className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin" className="text-secondary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-primary">Usuarios</h1>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3"
          >
            <User size={20} className={user.isActive ? "text-success" : "text-secondary"} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {user.name || user.email}
              </p>
              <p className="text-[10px] text-secondary">
                {user.email} · {user.activatedAt
                  ? `Desde ${new Date(user.activatedAt).toLocaleDateString("es-MX")}`
                  : "Sin activar"}
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await toggleUserActive(user.id, !user.isActive);
              }}
            >
              <button type="submit" title={user.isActive ? "Desactivar" : "Activar"}>
                {user.isActive ? (
                  <ShieldCheck size={20} className="text-success" />
                ) : (
                  <ShieldOff size={20} className="text-error" />
                )}
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Create catalog management page (scaffold)**

Create `src/app/(app)/admin/catalogo/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminCatalogoPage() {
  const products = await prisma.product.findMany({
    include: {
      color: true,
      material: true,
      gender: true,
      cut: true,
      brand: true,
      _count: { select: { variants: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin" className="text-secondary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-lg font-bold text-primary">Catálogo</h1>
        <Link
          href="/admin/catalogo/nuevo"
          className="rounded-[12px] bg-primary px-3 py-2 text-xs font-bold text-white"
        >
          + Producto
        </Link>
      </div>

      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-3"
          >
            <div
              className="h-8 w-8 rounded-full"
              style={{ backgroundColor: product.color?.hex || "#ccc" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {product.color?.name || product.name}
              </p>
              <p className="text-[10px] text-secondary">
                {product.material?.name} · {product.gender?.name} · {product._count.variants} variantes
              </p>
            </div>
            {product.catalogCode && (
              <span className="text-xs text-secondary">{product.catalogCode}</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add src/app/actions/adminActions.ts "src/app/(app)/admin/"
git commit -m "feat: admin panel with dashboard, activation codes, users, and catalog management"
```

---

## Task 16: PWA Service Worker + Final Polish

**Files:**
- Create: `public/sw.js`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create service worker**

Create `public/sw.js`:

```javascript
const CACHE_NAME = "comanda-yazbeck-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network-first for API calls
  if (event.request.url.includes("/api/") || event.request.url.includes("/actions/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

- [ ] **Step 2: Register service worker in layout**

Add to `src/app/layout.tsx`, inside the `<body>` tag before `{children}`:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    `,
  }}
/>
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git add public/sw.js src/app/layout.tsx
git commit -m "feat: PWA service worker with cache-first for static, network-first for API"
```

---

## Task 17: Push to GitHub

- [ ] **Step 1: Create .gitignore**

Verify `.gitignore` includes:

```
node_modules/
.next/
.env
.env.local
*.db
```

- [ ] **Step 2: Push all commits**

```bash
cd /c/Users/figok/Documents/comanda-yazbeck
git push origin master
```

Expected: All commits pushed to https://github.com/tuindigc/comanda-yazbeck

---

## Post-Implementation: Supabase Setup

After all code is committed, these manual steps are needed:

1. **Create Supabase project** at https://supabase.com
2. **Copy credentials** to `.env.local` (URL, anon key, service role key, database URL)
3. **Run `prisma db push`** to create tables
4. **Create admin user** manually in Supabase Auth dashboard
5. **Insert admin UserProfile** with `role: "ADMIN"`
6. **Seed Provider** — insert Yazbeck into `Provider` table
7. **Seed catalog data** — materials, colors, cuts, genders, weights, size groups, products with variants
