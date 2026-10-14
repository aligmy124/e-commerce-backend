# BACKEND_CONTRACT.md

> **Status: DRAFT v1, derived from route files only.**
> Source of truth for this version: the 7 route files (`auth`, `cart`, `category`, `order`, `payment`, `product`, `review`).
> Controllers, Zod schemas, Mongoose models, middlewares and `app.ts` have **not** been inspected yet.
> Anything not provable from the routes is marked **⚠️ VERIFY** and must be confirmed before the frontend relies on it. Nothing here is guessed.

**Legend:** ✅ Confirmed from route code · ⚠️ VERIFY = unknown, inspect the listed file · 🔓 public · 🔐 authenticated · 👑 admin only

---

## 1. Global facts

| Item | Value | Status |
|---|---|---|
| Framework | Express + TypeScript | ✅ |
| Dev server port | `5000` (from the Stripe CLI forward command) | ✅ |
| Route mount prefixes | Payment is `/payment` (from webhook comment). Others (`/auth`, `/cart`, `/categories`, `/orders`, `/products`, `/reviews`) are **assumed** from module names | ⚠️ VERIFY in `app.ts` |
| API version prefix (e.g. `/api/v1`) | Unknown | ⚠️ VERIFY in `app.ts` |
| Auth middleware | `authenticate` (populates `req.user`) | ✅ |
| Role middleware | `authorize([...roles])`, only `"admin"` is used | ✅ |
| Roles actually used in routes | `admin` (plus implicit regular user). **No `driver` role exists in this backend.** | ✅ |
| Validation | `validateBody(zodSchema)`, `validateObjectId(param)` | ✅ |
| File upload | `upload.array("images", 10)` (Multer) on product create/update | ✅ |
| Rate limiting on auth | **Commented out** (`loginLimiter`, `registerLimiter`) | ✅ |

---

## 2. Authentication mechanism

| Question | Answer | Status |
|---|---|---|
| How is the token transported (cookie vs `Authorization` header)? | Unknown | ⚠️ VERIFY `authenticate.ts`, `auth.controller.ts` |
| Cookie flags (`httpOnly`, `secure`, `sameSite`, `domain`, `path`, `maxAge`) | Unknown | ⚠️ VERIFY `auth.controller.ts` |
| Access/refresh token pair? | Unknown from routes (project notes mention access/refresh + httpOnly cookies) | ⚠️ VERIFY |
| Refresh endpoint | **None in the auth router** | ✅ (absent) |
| Logout endpoint | **None in the auth router** | ✅ (absent) |
| Current-user endpoint | No `/me`. `GET /auth/protected` returns `{ success: true, user }` and can serve as the current-user probe | ✅ |
| Admin check endpoint | `GET /auth/dashboard` 👑 returns only a welcome message (usable as an admin-guard probe, not as dashboard data) | ✅ |
| CORS (`origin`, `credentials`) | Unknown | ⚠️ VERIFY `app.ts` |

### Auth endpoints

| Method | Path | Access | Body schema | Success response | Status |
|---|---|---|---|---|---|
| POST | `/auth/register` | 🔓 | `registerSchema` | ⚠️ | fields/response ⚠️ VERIFY `schema/register.schema.ts`, controller |
| POST | `/auth/login` | 🔓 | `loginSchema` | ⚠️ | fields/response ⚠️ VERIFY `schema/login.schema.ts`, controller |
| GET | `/auth/protected` | 🔐 | none | `{ success: true, user: req.user }` | ✅ shape of `user` ⚠️ |
| GET | `/auth/dashboard` | 👑 | none | `{ success: true, message: "Welcome to the admin page!" }` | ✅ |

---

## 3. Endpoint inventory

### 3.1 Categories (`category.routes`)

| Method | Path | Access | Params | Body | Notes |
|---|---|---|---|---|---|
| GET | `/categories` | 🔓 | none | none | List. Pagination/filters ⚠️ |
| GET | `/categories/:categoryId` | 🔓 | `categoryId` (ObjectId) | none | |
| POST | `/categories` | 👑 | none | `categorySchema` | fields ⚠️ |
| PATCH | `/categories/:categoryId` | 👑 | `categoryId` | `updateCategorySchema` | partial update |
| DELETE | `/categories/:categoryId` | 👑 | `categoryId` | none | behavior when products exist ⚠️ |

### 3.2 Products (`product.routes`)

| Method | Path | Access | Params | Body | Notes |
|---|---|---|---|---|---|
| GET | `/products` | 🔓 | query ⚠️ | none | Search/filter/sort/pagination param names ⚠️ VERIFY `getProductsController` |
| GET | `/products/:productId` | 🔓 | `productId` | none | |
| POST | `/products` | 👑 | none | **`multipart/form-data`**, files field `images` (max 10) + `productSchema` fields | Multipart means every non-file field arrives as a string. How arrays/numbers are coerced ⚠️ VERIFY `product.schema.ts` |
| PATCH | `/products/:productId` | 👑 | `productId` | **`multipart/form-data`**, `images` (max 10) + `updateProductSchema` | Do new images replace or append? How to delete a single image? ⚠️ |
| DELETE | `/products/:productId` | 👑 | `productId` | none | Hard delete or soft delete/deactivate? ⚠️ |

### 3.3 Cart (`cart.routes`), all routes 🔐 (`router.use(authenticate)`)

| Method | Path | Params | Body | Notes |
|---|---|---|---|---|
| GET | `/cart` | none | none | Get user's cart |
| GET | `/cart/summary` | none | none | Totals/summary (computed by backend, so the UI must display, not recalculate) |
| POST | `/cart/:productId` | `productId` | `cartSchema` | Add product (likely `quantity`, ⚠️ VERIFY) |
| PATCH | `/cart/:productId` | `productId` | `updateCartSchema` | Update quantity |
| DELETE | `/cart/:productId` | `productId` | none | Remove item |
| DELETE | `/cart` | none | none | Clear cart |

No guest cart: every cart endpoint requires authentication.

### 3.4 Orders (`order.routes`)

| Method | Path | Access | Params | Body | Notes |
|---|---|---|---|---|---|
| POST | `/orders` | 🔐 | none | `createOrderSchema` (includes `addressSchema`) | Does it build from the server cart or from a payload? ⚠️ |
| GET | `/orders/me` | 🔐 | query ⚠️ | none | Current user's orders. Pagination ⚠️ |
| GET | `/orders/me/:orderId` | 🔐 | `orderId` | none | Own order details |
| PATCH | `/orders/cancel/:orderId` | 🔐 | `orderId` | none | Cancel own order. Allowed statuses and ownership check ⚠️ |
| GET | `/orders` | 👑 | query ⚠️ | none | All orders (admin). Filters/pagination ⚠️ |
| PATCH | `/orders/:orderId` | 👑 | `orderId` | `updateOrderStatusSchema` | Update status. Valid transitions ⚠️ |

### 3.5 Payments / Stripe (`payment.routes`)

| Method | Path | Access | Params | Body | Notes |
|---|---|---|---|---|---|
| POST | `/payment/:orderId` | 🔐 | `orderId` | none | `checkoutController` creates the Stripe Checkout Session. Response shape (URL field name) ⚠️ |
| POST | `/payment/:orderId/refund` | 🔐 (**no `authorize`**) | `orderId` | none | See risk R1 |
| POST | `/payment/webhook` | Stripe only | none | raw body + signature | **Not in this router.** Mentioned in the Stripe CLI comment, mounted elsewhere (likely before `express.json()`) ⚠️ VERIFY `app.ts` |

Stripe events the backend listens to (from the CLI command): `checkout.session.completed`, `payment_intent.payment_failed`, `checkout.session.async_payment_failed`, `refund.updated`.

Stripe flow (what is certain vs not):
- ✅ Order is created first, then checkout is requested per `orderId`.
- ⚠️ Success/cancel URLs configured in the controller (frontend routes must match them).
- ⚠️ Order/payment status is updated by **webhook**, so it can lag behind the browser redirect. The frontend success page must read real state from the backend.

### 3.6 Reviews (`review.routes`)

| Method | Path | Access | Params | Body | Notes |
|---|---|---|---|---|---|
| POST | `/reviews/:productId` | 🔐 | `productId` | `reviewSchema` | Rules: one review per user/product? verified purchase? ⚠️ |
| GET | `/reviews/product/:productId` | 🔓 | `productId` | none | Product reviews. Pagination ⚠️ |
| GET | `/reviews` | 🔓 | query ⚠️ | none | All reviews. **Public**, no admin guard (see R3) |
| DELETE | `/reviews/:reviewId` | 🔐 | `reviewId` | none | Owner/admin rule ⚠️ VERIFY `deleteReviewController` |

No update-review endpoint exists.

---

## 4. Authorization matrix (from routes)

| Capability | Public | User | Admin |
|---|:-:|:-:|:-:|
| Browse categories / products / product reviews / all reviews | ✅ | ✅ | ✅ |
| Register / login | ✅ | ✅ | ✅ |
| Cart operations | ❌ | ✅ | ✅ |
| Create order, view/cancel own orders | ❌ | ✅ | ✅ |
| Start checkout / request refund for an order | ❌ | ✅ (ownership ⚠️) | ✅ |
| Add review | ❌ | ✅ | ✅ |
| Delete review | ❌ | owner? ⚠️ | ✅? ⚠️ |
| Manage categories / products | ❌ | ❌ | ✅ |
| List all orders, update order status | ❌ | ❌ | ✅ |

Frontend rule: route guards are for UX only. The backend decides.

---

## 5. Response envelope and error format

| Item | Known | Status |
|---|---|---|
| Success shape | At least in `/auth/protected` and `/auth/dashboard`: `{ success: true, ... }` (`user` or `message`). Whether other endpoints wrap in `data` ⚠️ | ⚠️ VERIFY controllers |
| Error shape (`success: false`, `message`, `errors`, status code, stack in dev) | Unknown | ⚠️ VERIFY central error handler middleware |
| Validation error structure (per-field format) | Unknown | ⚠️ VERIFY `validateBody.ts`, `validateObjectId.ts` |
| Pagination metadata (`page`, `limit`, `total`, `totalPages`) | Unknown | ⚠️ VERIFY list controllers/services |

The frontend `ApiResponse<T>`, `ApiError` and `Pagination` types must not be written until these are verified.

---

## 6. Domain models

Not inspected. Required before writing frontend types.

⚠️ VERIFY (`models/*.ts`): `User`, `Profile`, `Category`, `Product` (images shape, stock, price, rating fields), `Review`, `Cart`/`CartItem`, `Order`/`OrderItem`, `Payment`, plus which fields are populated in each response. Order status enum and payment status enum are especially important (they drive UI badges).

---

## 7. Gaps and risks found from routes

| # | Type | Finding | Impact / Action |
|---|---|---|---|
| G1 | **Gap** | No **logout** endpoint | If the token is in an httpOnly cookie, the frontend cannot clear it. Backend needs `POST /auth/logout` that clears cookie(s) |
| G2 | **Gap** | No **refresh** endpoint in the auth router | If access tokens are short-lived, sessions will end abruptly. Confirm whether refresh exists elsewhere |
| G3 | **Gap** | No **profile** routes provided | Profile pages need endpoints. Send/inspect the profile router if it exists |
| G4 | **Gap** | No admin **order details** endpoint (`GET /orders/me/:orderId` is own-only) | Admin order detail page has no endpoint. Add `GET /orders/:orderId` (admin), or reuse the list data |
| G5 | **Gap** | No **dashboard statistics** endpoint (`/auth/dashboard` is a text message) | KPIs need new endpoint(s) or must be derived from list endpoints. Do not fake data |
| G6 | **Gap** | No **update review** endpoint | Frontend offers add and delete only |
| G7 | **Gap** | No `GET` for a single review/payment status endpoint seen | Success page needs a way to read payment/order status; `GET /orders/me/:orderId` is the likely candidate ⚠️ |
| R1 | **Risk (security)** | `POST /payment/:orderId/refund` requires only `authenticate`, no `authorize` | Verify the controller enforces admin or strict ownership and refundable state. Otherwise IDOR or abuse |
| R2 | **Risk (security)** | `POST /payment/:orderId` and `PATCH /orders/cancel/:orderId` rely on ownership checks inside controllers | Verify they check `order.user === req.user.id` (IDOR) |
| R3 | **Risk** | `GET /reviews` (all reviews) is public with no pagination guarantee | Admin review management should not depend on a public endpoint; verify pagination and exposed fields (e.g. user emails) |
| R4 | **Risk** | `DELETE /reviews/:reviewId` only `authenticate` | Verify owner or admin check |
| R5 | **Risk** | Auth rate limiters are commented out | Enable before production (login/register brute force) |
| R6 | **Risk** | Webhook route not visible in routers | Verify raw body parsing and Stripe signature verification, and that the route is excluded from JSON parsing and CSRF/auth middlewares |
| R7 | **Risk (integration)** | Product create/update use multipart with `validateBody` | Verify coercion of numeric/array fields from strings, else the admin form fails with confusing errors |

---

## 8. Implications for the frontend (derived only from confirmed facts)

- **Cart totals come from `GET /cart/summary`.** Display backend values; do not recompute prices in the UI.
- **Admin product form must send `multipart/form-data`** (field name `images`, max 10 files). The api-client needs a FormData path that does not force `Content-Type: application/json`.
- **Checkout is 2-step:** `POST /orders` then `POST /payment/:orderId`. The success page must re-fetch order/payment state because the webhook can arrive after the redirect.
- **No guest cart:** unauthenticated "add to cart" must redirect to login with a callback URL.
- **No `driver` role:** roles are `admin` and regular user only.
- **Logout cannot be implemented properly** until G1 is resolved (if cookie-based auth).
- **Review management in admin** relies on public `GET /reviews` plus `DELETE /reviews/:reviewId`; confirm admin permission on delete (R4).

---

## 9. Files to inspect next (to complete this contract)

Priority order:

1. `app.ts` / `server.ts`: route prefixes, CORS, cookie-parser, JSON vs raw-body for webhook, global error handler registration
2. `middlewares/authenticate.ts`, `authorize.ts`, `validateBody.ts`, `validateObjectId.ts`, the error handler and any `AppError` class
3. `auth.controller.ts` + `register.schema.ts` + `login.schema.ts` (token/cookie behavior)
4. All `*.controller.ts` and `*.service.ts` (response shapes, pagination, filters, ownership checks)
5. All `schema/*.ts` (Zod request bodies and constraints to mirror in frontend forms)
6. `models/*.ts` (types, enums for order/payment status)
7. `payment.controller.ts` + webhook handler (success/cancel URLs, session response, status updates, refund rules)
8. Profile routes/controllers if they exist

Once these are provided, this document moves from DRAFT to FINAL and the frontend types (`Product`, `Order`, `ApiError`, `Pagination`, ...) can be written without guessing.
