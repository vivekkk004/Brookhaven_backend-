# Brookhaven API

Express 5 and MongoDB API for the Brookhaven secondhand-book marketplace.

## Run locally

1. Install Node.js 20+ and run MongoDB locally.
2. Copy `.env.example` to `.env.development` and set the required development values.
3. Run `npm ci` and `npm run dev`.
4. Open `http://localhost:8000/health` or Swagger UI at `http://localhost:8000/api-docs`.

Never commit `.env.development`, `.env.production`, database credentials, or signing secrets. Production startup now requires MongoDB, JWT, admin, and frontend origin configuration; signing secrets and the admin password must be at least 32 characters.

## Test

Run `npm test` with a local MongoDB service. The Node test runner starts a separate API process against a uniquely named local database, exercises authentication, roles, book CRUD, orders, stock races, wishlists, reviews, chat, profiles, dashboards, and admin routes, then drops only that test database.

## API groups

Base path: `/api/v1`

| Group | Main routes | Access |
| --- | --- | --- |
| Auth | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me` | Public or signed in |
| Books | `/books`, `/books/:id`, `/books/my/listings` | Public catalog; sellers manage their listings |
| Orders | `/orders`, `/orders/customer`, `/orders/seller`, `/orders/:id/*` | Customer and seller roles |
| Wishlist | `/wishlist`, `/wishlist/:bookId` | Customers |
| Reviews | `/reviews/book/:bookId`, `/reviews/:id` | Public read; customer write |
| Chat | `/chat/conversations/*` | Authenticated participants |
| Customer | `/customer/profile`, `/customer/dashboard` | Customers |
| Seller | `/user/profile`, `/user/dashboard`, `/user/earnings` | Sellers |
| Admin | `/admin/stats`, `/admin/users`, `/admin/books`, `/admin/orders` | Admins |

## Current product boundaries

- Checkout is cash on delivery. Payment configuration exists in the environment template, but online payment capture is not implemented.
- Uploaded images are stored on the API server's local disk; production deployments should use managed object storage.
- The API uses bearer access tokens and secure HTTP-only cookies for browser sessions.
- Orders store a price snapshot and reserve inventory atomically. State changes are guarded to avoid overselling and repeated restocks.

See the workspace-level README for architecture, user flows, and resume-ready project framing.
