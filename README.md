# Maati Mart

A farm-direct produce marketplace for India. Consumers buy from growers without
a middleman; farmers list their own harvest, set prices, and fulfil orders from
a dedicated dashboard.

Built with [TanStack Start](https://tanstack.com/start), React and Supabase.

## Stack

| Layer        | Choice                                                     |
| ------------ | ---------------------------------------------------------- |
| Framework    | TanStack Start (SSR) + TanStack Router (file-based routes) |
| Build        | Vite 7, TypeScript (strict)                                |
| Data         | Supabase — Postgres, Auth, Row Level Security              |
| Server state | TanStack Query                                             |
| Client state | Zustand (cart, wishlist, pincode)                          |
| UI           | Tailwind CSS v4, Radix primitives, `lucide-react`          |
| Forms        | React Hook Form + Zod                                      |
| Runtime      | Bun                                                        |

## Getting started

Requires [Bun](https://bun.sh) and a Supabase project.

```bash
bun install
cp .env.example .env    # then fill in your Supabase values
bun run dev             # http://localhost:3000
```

### Environment

`.env` is git-ignored — never commit it. See `.env.example` for the full list.

| Variable                        | Purpose                                             |
| ------------------------------- | --------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Your project URL, e.g. `https://abc123.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The anon / publishable key                          |

Both are read by `src/integrations/supabase/client.ts` and are safe to ship to
the browser — access is governed by Row Level Security, not by key secrecy.

### Database

Migrations live in `supabase/migrations/` (12 of them). Apply with the
[Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

Tables: `profiles`, `user_roles`, `farms`, `products`, `orders`, `order_items`,
`order_status_events`, `product_reviews`, `wishlists`, `farm_wishlists`,
`farm_visits`, `notifications`.

## Scripts

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `bun run dev`       | Dev server with HMR                  |
| `bun run build`     | Production build                     |
| `bun run preview`   | Serve the production build locally   |
| `bun run lint`      | ESLint (includes Prettier as a rule) |
| `bun run format`    | Rewrite files with Prettier          |
| `bunx tsc --noEmit` | Typecheck                            |

CI runs typecheck, lint and build on every pull request
(`.github/workflows/ci.yml`).

## Project layout

```
src/
  routes/              File-based routes; the filename is the URL
    index.tsx          Home
    marketplace.tsx    Browse and filter produce
    product.$id.tsx    Product detail
    farm.$id.tsx       Public farm profile
    cart.tsx           Cart
    checkout.tsx       Address + place order
    orders.tsx         Consumer order history
    wishlist.tsx       Saved products and farms
    login.tsx          Auth
    signup.tsx
    farmer.tsx         Farmer dashboard shell
      farmer.index.tsx      Overview
      farmer.listings.tsx   Create and edit listings
      farmer.orders.tsx     Incoming orders, advance status
      farmer.profile.tsx    Farm profile
  components/          Feature components
    ui/                Radix-based primitives (shadcn conventions)
  lib/                 Stores, formatting, delivery ETA, deal schedule
  integrations/supabase/
    client.ts          Browser client
    types.ts           Generated from the database — do not edit by hand
supabase/migrations/   SQL migrations
```

Routes are generated into `src/routeTree.gen.ts` by the TanStack Router Vite
plugin. That file is checked in but generated — don't edit it.

## Conventions

- **Prices are integers in paise**, never floats. Format with `formatINR()`
  from `src/lib/format.ts`.
- **Commits follow Conventional Commits** (`feat:`, `fix:`, `chore:` …).
- **Run `bun run lint` before pushing.** Prettier runs as an ESLint rule, so
  formatting drift shows up as a lint error.

## Deployment

Configured for Cloudflare Workers via `wrangler.jsonc` and
`@cloudflare/vite-plugin`, with `src/server.ts` as the entrypoint. Preview
deployments are also built on Vercel for each pull request.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment
environment — the build reads them at bundle time.
