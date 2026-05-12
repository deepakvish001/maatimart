## Maati — Farmer-to-Consumer Marketplace

A full MVP for a direct farm-to-consumer platform with browsing, cart/checkout, role-based auth (consumer/farmer), and a farmer dashboard. Visual direction: **Editorial Soil** (deep green accent, warm cream background, Playfair Display + Inter + JetBrains Mono).

### Pages & Routes

```
/                       Landing — hero, featured farm, fresh harvest grid, "for kisaan" section
/marketplace            Full produce grid with filters (category, region, organic, price, search)
/product/$id            Product detail — photo, farm story, price/unit, qty selector, add to cart
/cart                   Cart line items, totals, checkout CTA
/checkout               Address + payment (mocked) → places order
/login, /signup         Email + password auth; signup picks role (consumer | farmer)
/orders                 Consumer order history
/farmer                 Farmer dashboard layout (sidebar)
  /farmer               Overview: revenue, active orders, low stock
  /farmer/listings      CRUD produce listings
  /farmer/orders        Incoming orders table with status updates
  /farmer/profile       Farm name, location, story, photo
```

### Backend (Lovable Cloud)

Tables:
- `profiles` (id → auth.users, full_name, phone, address)
- `user_roles` (user_id, role: 'consumer' | 'farmer' | 'admin') — separate table, `has_role()` SECURITY DEFINER
- `farms` (id, owner_id → auth.users, name, region, story, image_url)
- `products` (id, farm_id, name, description, category, price_paise, unit, stock_kg, image_url, is_organic, is_active)
- `orders` (id, consumer_id, total_paise, status, address, created_at)
- `order_items` (id, order_id, product_id, farm_id, qty, unit_price_paise)

RLS:
- Public read on `farms`, `products` (where active), `profiles` basic fields
- Consumers: insert/select own orders/order_items
- Farmers: select/update orders containing their farm's products; full CRUD on own farm + products
- Auto-create profile + default 'consumer' role via signup trigger; signup form upgrades to 'farmer' when chosen

Storage bucket: `produce-images` (public read, authenticated write, owner-only update/delete).

### Design System (src/styles.css)

Replace tokens with Editorial Soil palette:
- background: warm cream `oklch(0.96 0.02 85)`
- foreground: deep ink `oklch(0.22 0.02 165)`
- primary: terracotta `oklch(0.58 0.14 40)`
- accent: deep forest green `oklch(0.32 0.06 155)`
- muted: warm stone
- Fonts: Playfair Display (display), Inter (sans), JetBrains Mono (mono) via Google Fonts in `__root.tsx` head links
- Card grid uses 1px hairline dividers (bg-border between tiles)

### Components

- `SiteHeader` (sticky, blur, nav + cart badge + auth state)
- `SiteFooter`
- `ProductCard`, `FarmCard`
- `CartDrawer` + Zustand cart store (persisted to localStorage)
- `AuthProvider` (Supabase session via onAuthStateChange)
- `ProtectedRoute` wrapper for /farmer/* and /checkout
- `FarmerSidebar` (shadcn sidebar)
- `EmptyState`, `PriceTag`, `OrganicBadge`

### Server Functions

- `lib/products.functions.ts` — listProducts(filters), getProduct(id)
- `lib/orders.functions.ts` — placeOrder(items, address) [auth], listMyOrders(), listFarmerOrders(), updateOrderStatus()
- `lib/farms.functions.ts` — getMyFarm(), upsertFarm(), upsertProduct(), deleteProduct()

All protected ones use `requireSupabaseAuth` middleware. Browser components call via `useServerFn` + react-query.

### Images

Generate produce/farm photos with imagegen for landing hero, 8 seed products, and 3 featured farms. Save under `src/assets/`.

### Build order

1. Enable Lovable Cloud
2. Apply design tokens, fonts, base layout (header/footer)
3. Auth pages + AuthProvider + role signup
4. DB migration: tables, RLS, signup trigger, storage bucket
5. Seed data (farms + products) + generated images
6. Landing + marketplace + product detail
7. Cart store + cart page + checkout + place order server fn
8. Consumer orders page
9. Farmer dashboard (sidebar, overview, listings CRUD, orders)
10. Polish: empty states, loading skeletons, toasts, SEO meta per route
