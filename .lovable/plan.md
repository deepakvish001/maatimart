# Maati — Next Feature Set

The MVP covers browse → cart → checkout → farmer dashboard. To make it a complete, trust-worthy marketplace, the next round focuses on **payments, trust signals, discoverability, post-order experience, and farmer growth tools.**

---

## 1. Payments (Stripe via Lovable)

- Replace the current "Place Order" stub with real Stripe Checkout (INR).
- Webhook → mark order `paid`, decrement product stock atomically.
- Order statuses: `pending_payment → paid → packed → out_for_delivery → delivered → cancelled`.
- Refund / cancel flow for farmer + consumer (within 1 hour of placing).

## 2. Reviews & Ratings

- New tables: `product_reviews` (rating 1–5, comment, photo), `farm_reviews`.
- Only consumers with a `delivered` order for that product/farm can review (RLS enforced).
- Aggregate rating shown on `ProductCard`, product detail page, and farm page.

## 3. Farm Profile Pages (public)

- New route `/farm/$id` — farmer story, gallery, all active products, reviews, region map pin.
- Link from every `ProductCard` and product detail.
- Strengthens the "know your farmer" editorial angle.

## 4. Search & Smart Filters

- Full-text search on product name + description (Postgres `tsvector` + GIN index).
- Marketplace filters: category, region/state, organic, price range, in-stock, sort (newest, price, rating).
- URL-synced filters (shareable links).

## 5. Delivery & Logistics

- Farmer sets delivery zones (pincodes served) and delivery fee per zone in profile.
- Checkout validates pincode against farm zones; shows fee + ETA.
- Order tracking timeline on `/orders/$id` with status updates pushed by farmer.

## 6. Notifications

- Email (Lovable Email): order placed, paid, packed, out for delivery, delivered (consumer); new order, low stock (farmer).
- In-app toast + bell dropdown using Supabase Realtime on `orders` and `notifications` table.

## 7. Farmer Growth Tools

- **Analytics dashboard**: revenue (7/30/90d), units sold, top products, repeat-customer %.
- **Inventory alerts**: auto low-stock badge when `stock < threshold`.
- **Bulk image upload** for product gallery (multi-image per product).
- **Coupons**: farmer-issued promo codes (% or flat off, expiry, usage cap).

## 8. Consumer Experience

- Wishlist / favorites (per user table).
- Reorder button on past orders.
- Address book in profile (multiple saved addresses).
- Subscription/recurring orders (weekly veggie box) — schema only this round, UI optional.

## 9. Admin / Trust

- `admin` role in `app_role` enum.
- `/admin` route: verify farms (KYC doc upload + approve), moderate reviews, view all orders.
- Verified badge on farm cards once approved.

## 10. SEO & Polish

- Per-route `head()` with og:image from product/farm hero.
- JSON-LD `Product` and `LocalBusiness` schema.
- Sitemap route `/sitemap.xml`.
- Loading skeletons everywhere, empty states, 404 illustrations.

---

## Suggested build order (ship in slices)

1. **Slice A — Money & Trust**: Stripe payments + reviews + farm public pages.
2. **Slice B — Discovery**: search, filters, wishlist.
3. **Slice C — Fulfillment**: delivery zones, order tracking, email notifications.
4. **Slice D — Farmer growth**: analytics, coupons, bulk images, low-stock alerts.
5. **Slice E — Admin & SEO polish**: admin role, KYC verification, JSON-LD, sitemap.

---

## Technical notes

- **DB migrations needed**: `product_reviews`, `farm_reviews`, `delivery_zones`, `notifications`, `coupons`, `wishlists`, `addresses`, `order_status_events`; add `rating_avg`, `rating_count`, `low_stock_threshold`, `search_tsv` columns; extend `app_role` with `admin`.
- **RLS**: reviews gated by delivered orders; admin policies via `has_role(auth.uid(),'admin')`.
- **Server fns**: `lib/payments.functions.ts` (create checkout session), `lib/reviews.functions.ts`, `lib/search.functions.ts`, `lib/analytics.functions.ts`. Webhooks under `src/routes/api/public/stripe-webhook.ts`.
- **Realtime**: enable on `orders` and `notifications`.
- **Storage**: new buckets `farm-kyc` (private), `review-photos` (public).

Tell me which slice to start with (A is recommended) or if you want to reorder.
