# Wearism Marketplace (E-commerce) — Implementation State (Backend + Frontend)

Last updated: 2026-04-07

This document is a **comprehensive snapshot** of what is currently implemented vs missing/broken for the Wearism Marketplace system (Vendor + Products + Cart + Orders) across:

- **Backend**: `/Users/oooo/Dev/fyp/Wearism-Backend/backend`
- **Frontend (React Native / Expo)**: `/Users/oooo/Dev/fyp/Mobile-Wearism-Frontend`

It also includes ready-to-run **Test Module 8/9/10** checklists (Vendor, Products, Cart & Orders) with the **exact API endpoints** that should be exercised.

---

## 1) High-level summary (what exists vs what’s not)

### What exists (backend)
- **Vendor registration + vendor profile** (`vendor_profiles`):
  - Register as vendor (creates `vendor_profiles` row with `status='pending'`)
  - Get own vendor profile
  - Update own vendor profile (requires `requireVendor`)
  - Vendor dashboard stats endpoint (requires `requireVendor`)
  - Public vendor storefront endpoint (approved vendors only)
- **Products**
  - Vendor-only create/update/delete products
  - Browse catalog for buyers (filters/search/sort, `status='active'` only)
  - Product details endpoint
  - Product images (add up to 6, delete)
  - Draft → active publishing via `PATCH /products/:id/activate`
  - Resale listing endpoint: `POST /products/resale` (but note it also requires vendor status)
- **Cart**
  - Add to cart (upsert by `user_id,product_id`)
  - Update quantity
  - Remove item / clear cart
  - Get cart summary (filters out inactive/out-of-stock products)
  - Guard: users cannot add their **own** products to cart
- **Orders**
  - Place COD order(s) from cart, **splits by vendor**
  - Buyer order list
  - Vendor incoming order list (requires vendor approval)
  - Order status lifecycle endpoints (confirm, ship, deliver)
  - Buyer cancel (pending only) + stock restore via RPC

### What exists (frontend)
- **Shop (buyer)** screens exist:
  - `app/shop/catalog.tsx`
  - `app/shop/product-detail.tsx`
  - `app/shop/cart.tsx`
  - `app/shop/checkout.tsx`
  - Buyer orders: `app/orders/buyer.tsx`
- **Vendor** screens exist:
  - Registration: `app/vendor-registration.tsx`
  - Pending screen: `app/vendor-pending.tsx`
  - Dashboard: `app/vendor/dashboard.tsx`
  - Inventory: `app/vendor/inventory.tsx`
  - Vendor orders: `app/vendor/orders.tsx` (+ `app/screens/vendor/orders.tsx` exists too)
  - Product create: `app/vendor/product-create.tsx`

### What’s missing or not production-ready (critical)
There are **major contract mismatches** between frontend and backend for:

- **Vendor registration payload + vendor profile fields**
- **Product shapes (images/vendor fields)**
- **ID types (UUID vs number)**
- **Cart response shape**
- **Order status values and response mapping**

These mismatches mean: **the marketplace UX may exist in the app, but several flows will fail at runtime unless the contracts are aligned**.

Details are in section **4) Contract mismatches & known breaks**.

---

## 2) Backend implementation map (authoritative)

### Vendor module (backend)
Files:
- `backend/src/modules/marketplace/vendors/vendors.routes.js`
- `backend/src/modules/marketplace/vendors/vendors.controller.js`
- `backend/src/modules/marketplace/vendors/vendors.service.js`
- `backend/src/modules/marketplace/vendors/vendors.schema.js`
- `backend/src/middleware/requireVendor.js`

Endpoints:
- `POST /vendors/register`
  - Requires auth
  - Body schema requires:
    - `shop_name` (required)
    - `contact_email` (required)
    - `shop_description`, `contact_phone`, `business_address` (optional)
  - Creates `vendor_profiles` with `status='pending'`
- `GET /vendors/me`
  - Requires auth
  - Returns vendor row for current user (any status)
- `PATCH /vendors/me`
  - Requires auth + `requireVendor`
  - `requireVendor` blocks: non-vendors, `pending`, `suspended`
- `GET /vendors/me/stats`
  - Requires auth + `requireVendor`
  - Returns:
    - `summary`: `{ id, total_sales, total_revenue, products_count, avg_rating }`
    - `orders_by_status`: counts aggregated from `orders`
    - `recent_orders`: last 5 orders
- `GET /vendors/:vendorId`
  - Public
  - Only returns **approved** vendors (`status='approved'`)
- `GET /vendors/:vendorId/products`
  - Public
  - Delegates to `productsService.browseProducts({ vendor_id })`

### Vendor approval (backend)
There is **no admin approval endpoint** implemented.

Approval must be done by **manual DB update** (Supabase SQL editor) during testing:

```sql
UPDATE public.vendor_profiles
SET status='approved', approved_at=NOW()
WHERE user_id='YOUR_VENDOR_USER_ID';
```

### `requireVendor` middleware behavior
`requireVendor`:
- Loads `vendor_profiles` for current user
- Rejects with `403` if:
  - no vendor profile exists
  - status is `pending`
  - status is `suspended`
- Attaches `request.vendor = { id, status }` when allowed

This means: **unapproved vendors cannot access vendor-only endpoints** (`/vendors/me/stats`, `/products` create/update, `/orders/vendor`, etc.).

---

### Products module (backend)
Files:
- `backend/src/modules/marketplace/products/products.routes.js`
- `backend/src/modules/marketplace/products/products.controller.js`
- `backend/src/modules/marketplace/products/products.service.js`
- `backend/src/modules/marketplace/products/products.schema.js`

Endpoints:
- `POST /products` (vendor-only, requires `requireVendor`)
  - Creates product with `status='draft'`
- `PATCH /products/:id` (vendor-only)
  - Updates allowed fields, including `status` to `active|draft|archived`
- `PATCH /products/:id/activate` (vendor-only)
  - Convenience publish endpoint (sets `status='active'`)
- `DELETE /products/:id` (vendor-only)
  - Soft delete (sets `deleted_at`, status `archived`)
- `GET /products` (public)
  - Returns only:
    - `status='active'`
    - `deleted_at IS NULL`
    - `stock_quantity > 0`
  - Supports filters: `category`, `condition`, `vendor_id`, `is_resale`, price range, `search` (FTS), `sort`
- `GET /products/:id` (public)
  - Product detail with vendor + images
- `POST /products/:id/images` (vendor-only, max 6)
- `DELETE /products/:id/images/:imageId` (vendor-only via RLS)
- `POST /products/resale` (vendor-only)
  - Creates a product backed by a `wardrobe_item_id`, sets `is_resale=true`, and marks wardrobe item listed
  - **Important**: because it uses `requireVendor`, resale listing currently requires the user to be an **approved vendor** too (not “any user can resell”).

---

### Cart module (backend)
Files:
- `backend/src/modules/marketplace/cart/cart.routes.js`
- `backend/src/modules/marketplace/cart/cart.controller.js`
- `backend/src/modules/marketplace/cart/cart.service.js`
- `backend/src/modules/marketplace/cart/cart.schema.js`

Endpoints:
- `GET /cart` (auth)
  - Returns `{ success: true, items, subtotal, item_count, unavailable_count }`
  - Items are filtered to only include products that are active + in stock
- `POST /cart/items` (auth)
  - Upsert by `(user_id, product_id)`
  - Rejects if:
    - product not active / not found
    - insufficient stock
    - **self-purchase guard** (vendor owns product)
- `PATCH /cart/items/:id` (auth)
- `DELETE /cart/items/:id` (auth)
- `DELETE /cart` (auth)

---

### Orders module (backend)
Files:
- `backend/src/modules/marketplace/orders/orders.routes.js`
- `backend/src/modules/marketplace/orders/orders.controller.js`
- `backend/src/modules/marketplace/orders/orders.service.js`
- `backend/src/modules/marketplace/orders/orders.schema.js`

Endpoints:
- `POST /orders` (auth)
  - Places order(s) from cart
  - Splits cart by `vendor_id` into multiple orders
  - Clears cart
  - Decrements stock
  - Sends vendor notification
  - Creates initial status: `pending_confirmation`
- `GET /orders` (auth)
  - Buyer orders (paginated)
- `GET /orders/vendor` (auth + requireVendor)
  - Vendor incoming orders (paginated)
- `GET /orders/:id` (auth)
  - Buyer or vendor owner only
- `PATCH /orders/:id/cancel` (auth)
  - Only for buyer, only when status is `pending_confirmation`
  - Restores stock via RPC `increment_stock`
- `PATCH /orders/:id/confirm` (auth + requireVendor)
- `PATCH /orders/:id/ship` (auth + requireVendor)
- `PATCH /orders/:id/deliver` (auth + requireVendor)
  - Backend maps `delivered` action to final status `completed` (and sets timestamps)

Statuses (backend, canonical):
- `pending_confirmation`
- `confirmed`
- `shipped`
- `completed`
- `cancelled`

---

## 3) Frontend implementation map (what screens exist)

### Buyer/shop screens
- `app/shop/catalog.tsx`
  - Uses `useInfiniteQuery` to fetch `GET /products?page=N&limit=20&...`
  - Has search debounce (500ms), category chips, sort/filter sheet
- `app/shop/product-detail.tsx`
  - Fetches `GET /products/:id`
  - Calls `POST /cart/items` on “Add to Cart”
- `app/shop/cart.tsx`
  - Fetches `GET /cart`
  - Updates quantities and deletes items
  - Navigates to checkout
- `app/shop/checkout.tsx`
  - Fetches cart, posts `POST /orders`
  - Shows multi-vendor notice
- `app/orders/buyer.tsx`
  - Fetches `GET /orders`
  - Cancels via `PATCH /orders/:id/cancel`

### Vendor screens
- `app/vendor-registration.tsx` → `POST /vendors/register` (intended)
- `app/vendor-pending.tsx`
- `app/vendor/dashboard.tsx` → `GET /vendors/me/stats`
- `app/vendor/inventory.tsx` → `GET /vendors/me/products` (note: backend route is `GET /vendors/:vendorId/products` and `GET /vendors/:vendorId/products` public; there is no `GET /vendors/me/products` route in the backend vendor routes file shown earlier)
- `app/vendor/product-create.tsx` → `POST /products` and image upload endpoints
- `app/vendor/orders.tsx` → `GET /orders/vendor` and status transition endpoints

---

## 4) Contract mismatches & known breaks (must fix before “production-ready”)

These are not theoretical—based on the current code, they will cause runtime failures or incorrect UI.

### 4.1 Vendor registration payload mismatch (CRITICAL)
Backend expects:
- `shop_name`, `shop_description`, `contact_email`, `contact_phone`, `business_address`

Frontend `app/vendor-registration.tsx` sends:
- `brand_name`, `brand_type`, `categories`, `description`, `contact_email`, `instagram`, `website`

Result:
- `POST /vendors/register` will fail schema validation (missing required `shop_name`)
- VendorContext (`app/contexts/VendorContext.tsx`) also expects `vendor.brand_name`, etc., but backend vendor row contains `shop_name` fields.

### 4.2 Product ID type mismatch (UUID vs number) (CRITICAL)
Backend product IDs are **UUID** (per schema and migrations).

Frontend `app/shop/product-detail.tsx` uses:
- `product_id: parseInt(id as string, 10)` when adding to cart

Backend `POST /cart/items` schema expects:
- `product_id` to be a **UUID string**

Result:
- Add-to-cart will fail for UUID IDs.

### 4.3 Product shape mismatch (images + vendor fields) (CRITICAL)
Backend browse returns fields like:
- `primary_image_url`
- `vendor_profiles!vendor_id(id, shop_name, shop_logo_url)`

Frontend catalog expects:
- `item.images?.[0]`
- `item.vendor?.brand_name`

Backend product detail returns:
- `vendor_profiles` and `product_images` (based on backend select)

Frontend product detail expects:
- `product.images` array
- `product.vendor.brand_name`, `product.vendor.logo_url`, `product.vendor.user_id`

Result:
- Catalog and product detail screens will render placeholders or crash unless an adapter/mapping layer exists in `apiClient` (none observed in these files).

### 4.4 Cart response shape mismatch (CRITICAL)
Backend `GET /cart` returns:
- `{ success: true, items, subtotal, item_count, unavailable_count }`
and item rows contain nested `products!product_id(...)`

Frontend `app/shop/cart.tsx` expects:
- `cartData?.cart`
- item fields: `item.product`, `item.is_available`, `item.product.images`, `item.product.vendor.brand_name`

Result:
- Cart UI likely breaks unless a backend controller transforms the shape (it currently does not), or the frontend maps the response (it currently does not).

### 4.5 Order status mismatch (CRITICAL)
Backend uses: `pending_confirmation`
Frontend buyer orders checks:
- `if (item.status === 'pending')` to show Cancel button

Result:
- Cancel button won’t appear (even when cancellable) until frontend checks `pending_confirmation`.

### 4.6 Vendor “me products” endpoint mismatch (LIKELY)
Frontend inventory calls:
- `GET /vendors/me/products`

Backend vendor routes shown implement:
- `GET /vendors/:vendorId/products`
and `GET /vendors/me` and `GET /vendors/me/stats`

Result:
- Vendor inventory API call may 404 unless there’s another route file wiring `me/products` elsewhere.

---

## 5) Vendor approval & admin interface state

### Current state
- **No admin app / admin endpoints** for vendor approval were found in the marketplace module.
- Approval is expected to be **manual via Supabase SQL editor** for QA.

### Implication for testing
- Module 8 must include a **manual approval step**.

---

## 6) Resale vs “brand vendor” (how it works today)

### Brand vendor (intended)
- Register vendor → status pending → manual approval → vendor-only endpoints unlocked.

### Resale listing (current backend)
- Endpoint exists: `POST /products/resale`
- But it is protected by `requireVendor`, meaning:
  - A regular user **cannot** resell unless they are an approved vendor.

If the product vision is “users can resell without becoming a vendor”, the backend auth gate must change (e.g., allow any authenticated user, and create a separate “resale seller profile” concept or use profiles directly).

---

## 7) TEST MODULE 8 — Marketplace: Vendor

Vendor flow: Register → Pending → Manual Approval → Dashboard/Stats

> **Watch For**
>
> Vendor approval requires manual DB update for testing. After registering: run in Supabase SQL Editor:
>
> ```sql
> UPDATE public.vendor_profiles
> SET status='approved', approved_at=NOW()
> WHERE user_id='YOUR_VENDOR_USER_ID';
> ```

| # | Steps | Expected Result | Pass/Fail | Notes |
|---|-------|-----------------|----------|------|
| T8.01 | Login as Vendor account. Go to Vendor Registration. Fill: Shop Name=Test Boutique, Description=Test shop for QA, Contact Email=vendor@wearism.test, Phone=+92300000000, Address=123 Test St Lahore. Tap Register. | Pending screen shown with status=PENDING badge. | P / F | `POST /vendors/register` |
| T8.02 | Run the SQL approval command above in Supabase. | Status updated to approved in DB. | P / F | Manual step for testing |
| T8.03 | Re-open app as Vendor. Navigate to Vendor Dashboard. | Dashboard shows real stats: Revenue=0, Sales=0, Products=0. | P / F | `GET /vendors/me/stats` |
| T8.04 | Try to register as vendor AGAIN with same account. | Error: `Already registered as vendor. Status: approved` | P / F | Duplicate prevention |
| T8.05 | Login as User A (no vendor registration). Try to access vendor inventory screen. | 403 error or redirected. Cannot access vendor screens. | P / F | `requireVendor` middleware |
| T8.06 | As Vendor: edit shop description. Save. | Description updated on vendor profile. | P / F | `PATCH /vendors/me` |
| T8.07 | As User A: go to catalog and tap on vendor name in a product. Or navigate to vendor profile URL. | Vendor public profile shows: shop name, description, logo, total sales, products. | P / F | `GET /vendors/:vendorId` |

**OK Section Complete — tick all before moving on**
- Done: T8.01–T8.03: Registration and manual approval, dashboard shows real data
- Done: T8.04: Duplicate registration blocked
- Done: T8.05: requireVendor blocks non-vendor access
- Done: T8.06–T8.07: Profile edit and public storefront work

---

## 8) TEST MODULE 9 — Marketplace: Products

Create → Images → Draft/Publish → Catalog → Search → Filter

### 9.1 Create Product (Vendor)

| # | Steps | Expected Result | Pass/Fail | Notes |
|---|-------|-----------------|----------|------|
| T9.01 | Login as Vendor. Inventory > tap '+'. Fill Name=Silk Summer Dress, Category=dresses, Condition=new, Price=2500, Stock=5. Tap Save Draft. | Product created status=draft. Appears in inventory with Draft pill. | P / F | `POST /products` |
| T9.02 | Tap Draft pill on the product. | Pill changes to Active (green). Product now live in catalog. | P / F | Should call `PATCH /products/:id/activate` or `PATCH /products/:id {status:'active'}` |
| T9.03 | Create product with no price. Try to Publish. | Disabled or validation error: price required. | P / F | Price required |
| T9.04 | On product creation: tap image slot. Add 3 photos. First is marked Primary. | 3 images uploaded. First has Primary badge. | P / F | `POST /products/:id/images` |
| T9.05 | Tap X on one uploaded image. | Image removed. | P / F | `DELETE /products/:id/images/:imageId` (frontend currently doesn’t show this API call) |
| T9.06 | Tap Publish Now on a new product. | Product created AND status=active in one step. | P / F | Create + activate |
| T9.07 | Try adding a 7th image. | Error: maximum 6 images per product. | P / F | Backend enforces MAX_IMAGES=6 |

### 9.2 Browse Catalog (Buyer)

| # | Steps | Expected Result | Pass/Fail | Notes |
|---|-------|-----------------|----------|------|
| T9.08 | Login as User A. Navigate to Shop tab. | Product cards visible. Vendor products appear. | P / F | `GET /products` |
| T9.09 | Scroll to bottom. | More products load automatically. | P / F | Infinite scroll |
| T9.10 | Type 'Silk' in search bar. Pause 500ms. | Only products with Silk in name shown. | P / F | Debounced FTS |
| T9.11 | Clear search. Tap 'dresses' category chip. | Only dress products shown. | P / F | Category filter |
| T9.12 | Sort by Price: Low to High. | Products reordered ascending by price. | P / F | `sort=price_asc` |
| T9.13 | Set price range min=1000 max=5000. Apply. | Only products PKR 1000–5000 shown. | P / F | Price range filter |
| T9.14 | Check that Draft products are NOT in catalog. | No draft products visible to buyers. | P / F | Backend `status=active` only |
| T9.15 | Open product. Check images swipeable if multiple. Name, price, vendor, condition, description all visible. | Full product detail correct. | P / F | `GET /products/:id` |
| T9.16 | Set a product stock=0 in Supabase. Try Add to Cart on that product. | Button shows 'Out of Stock' and is disabled. | P / F | `stock_quantity=0` |

**OK Section Complete — tick all before moving on**
- Done: T9.01–T9.07: Product creation, images, draft/publish, limits
- Done: T9.08–T9.14: Catalog browse all filters and sorting working
- Done: T9.15–T9.16: Product detail correct, out-of-stock handled

---

## 9) TEST MODULE 10 — Marketplace: Cart & Orders

Add → Update → Checkout → COD → Order lifecycle → Cancel

### 10.1 Cart

| # | Steps | Expected Result | Pass/Fail | Notes |
|---|-------|-----------------|----------|------|
| T10.01 | Login as User A. Open a product. Tap Add to Cart. | Toast: Added to cart. Tab bar cart badge shows 1. | P / F | `POST /cart/items` |
| T10.02 | Add same product again. | Quantity becomes 2. Badge still 1 (same product). | P / F | Upsert |
| T10.03 | Go to Cart screen. Verify product shows: image, name, vendor, price, quantity=2, line total. | Cart shows correctly. | P / F | `GET /cart` |
| T10.04 | Tap minus to reduce quantity to 1. Subtotal updates. | Quantity=1, correct subtotal. | P / F | `PATCH /cart/items/:id` |
| T10.05 | Add products from 2 different vendors. | Warning: 'Cart will create 2 separate orders (one per vendor)'. | P / F | Multi-vendor notice |
| T10.06 | Tap X/delete on one item. | Item removed. Badge decremented. | P / F | `DELETE /cart/items/:id` |
| T10.07 | Login as Vendor. Try to add your own product to cart. | Error: 'Cannot add your own products to cart.' | P / F | Self-purchase guard |

### 10.2 Place Order

| # | Steps | Expected Result | Pass/Fail | Notes |
|---|-------|-----------------|----------|------|
| T10.08 | User A: cart with 2 items same vendor. Tap Checkout. Fill: Address=456 Main St, City=Lahore, Phone=+92300000000. Tap Place Order. | Order placed. Cart empty (badge=0). Navigated to order history. | P / F | `POST /orders` |
| T10.09 | Navigate to Orders. Find placed order. | Status=Pending Confirmation. Shows items, delivery address, total, vendor name. | P / F | `GET /orders` |
| T10.10 | Cart has items from 2 vendors. Place order. | 2 separate orders created. Both in order history. | P / F | Multi-vendor split |
| T10.11 | Try to place order with empty cart. | Error: Cart is empty. | P / F | Empty cart guard |

### 10.3 Order Lifecycle (Vendor)

| # | Steps | Expected Result | Pass/Fail | Notes |
|---|-------|-----------------|----------|------|
| T10.12 | Login as Vendor. Open Orders screen. | Incoming order from User A visible. Status=Pending Confirmation. | P / F | `GET /orders/vendor` |
| T10.13 | Tap Confirm on the order. | Status changes to Confirmed. User A sees Confirmed when they check order. | P / F | `PATCH /orders/:id/confirm` |
| T10.14 | Tap Mark as Shipped. | Status = Shipped. | P / F | `PATCH /orders/:id/ship` |
| T10.15 | Tap Mark as Delivered. | Status = Completed. Check Supabase: vendor total_sales +1, total_revenue += order amount. | P / F | `PATCH /orders/:id/deliver` + `trg_vendor_sales_stats` trigger |

### 10.4 Cancel Order

| # | Steps | Expected Result | Pass/Fail | Notes |
|---|-------|-----------------|----------|------|
| T10.16 | User A: place new order. Before vendor confirms: find Cancel Order button. | Cancel button visible when status=Pending Confirmation. | P / F | Frontend must check `pending_confirmation` |
| T10.17 | Tap Cancel. Confirm. | Order cancelled. Stock restored (verify product stock_quantity back to original in DB). | P / F | Stock restore via RPC `increment_stock` |
| T10.18 | Try to cancel an already Confirmed order. | Cancel button not shown OR error: only pending orders can be cancelled. | P / F | Status guard |

**OK Section Complete — tick all before moving on**
- Done: T10.01–T10.07: Cart add/update/delete, self-purchase blocked, multi-vendor notice
- Done: T10.08–T10.11: Order placement, multi-vendor split, empty cart guard
- Done: T10.12–T10.15: Full vendor order lifecycle + stats trigger
- Done: T10.16–T10.18: Cancel works for pending, stock restored, confirmed cannot cancel

---

## 10) “Buyer options” concern: can a user buy from the marketplace?

### Intended path (screens exist)
Yes—the app has a buyer flow:

- Shop: `app/shop/catalog.tsx` → product grid
- Product detail: `app/shop/product-detail.tsx` → “Add to Cart”
- Cart: `app/shop/cart.tsx` → quantity updates → “Proceed to Checkout”
- Checkout: `app/shop/checkout.tsx` → “Place Order” (COD)
- Buyer orders: `app/orders/buyer.tsx`

### Practical status (today)
Because of the contract mismatches in section 4 (UUID vs number, response shapes), the buyer flow is **present but not reliably functional** until contracts are aligned.

