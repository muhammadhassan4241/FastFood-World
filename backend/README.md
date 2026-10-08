# FoodWorld Restaurant API

A Node.js, Express, MongoDB/Mongoose REST API for customer ordering, restaurant operations, and platform administration. It uses JWT authentication, bcrypt password hashing, Zod request validation, role-based access control, rate limits, security headers, centralized errors, Cloudinary uploads, soft deletion, and server-calculated checkout totals.

## Run locally

1. Copy `.env.example` to `.env`, set `MONGODB_URI` and a long random `JWT_SECRET`.
2. Start MongoDB as a replica set. Checkout is intentionally transactional and MongoDB transactions require a replica set (including for local development).
3. Install and run:

```bash
npm install
npm run seed
npm run dev
```

The API is served at `http://localhost:5000/api`. `npm start` runs the production entry point and `npm test` runs the smoke/validation tests.

### Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (defaults to `5000`) |
| `MONGODB_URI` | MongoDB connection string (`MONGO_URI` is also accepted for the legacy project setup) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT signing secret and lifetime |
| `CLIENT_URL` | Comma-separated permitted browser origins |
| `CLOUDINARY_*` | Cloudinary credentials for `POST /api/uploads/image` |

Never commit `.env`. The upload endpoint accepts JPG, PNG, or WebP files up to 5MB.

## Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@foodworld.test` | `AdminPassword123!` |
| Restaurant admin | `ayesha@foodworld.test` | `AdminPassword123!` |
| Restaurant admin | `bilal@foodworld.test` | `AdminPassword123!` |
| Customer | `customer1@foodworld.test` | `Customer123!` |

The seed recreates six users, three restaurants, five categories per restaurant, ten menu items per restaurant, and the legacy dashboard products.

## Authentication and permissions

Send `Authorization: Bearer <accessToken>` for protected routes. Registration always creates a `customer`; no request can self-assign an administrative role.

- `customer`: personal profile/cart/orders and public browsing.
- `restaurant_admin`: manages only restaurants where they are the owner and their related categories, menu, and orders.
- `super_admin`: platform-wide data access, user blocking, restaurant/category/menu management, and dashboard data.

Logout increments a per-user token version, invalidating all current tokens for that user. A password change does the same and returns a replacement access token.

## Endpoint reference

All responses use `{ success, message?, data?, pagination? }`; errors use `{ success: false, message, errors }`. Collection endpoints accept `page` and `limit` (`1`–`100`) and return pagination metadata.

| Area | Method and route | Access / notable request fields |
| --- | --- | --- |
| Auth | `POST /auth/register` | Public — `name`, `email`, strong `password`, `phone` |
|  | `POST /auth/login` | Public — `email`, `password` |
|  | `POST /auth/logout` | Authenticated |
| Users | `GET /users/me` | Authenticated |
|  | `PATCH /users/me` | Authenticated — `name`, `phone` |
|  | `PATCH /users/change-password` | Authenticated — `currentPassword`, `newPassword` |
| Restaurants | `GET /restaurants` | Public — `search`, `city`, `isActive`, `isOpen`, pagination |
|  | `GET /restaurants/:restaurantId` | Public — restaurant, active categories, and menu |
|  | `POST /restaurants` | Restaurant admin — name/contact/address/city/time fields |
|  | `PATCH`, `DELETE /restaurants/:restaurantId` | Owner or super admin; delete deactivates |
| Categories | `GET`, `POST /restaurants/:restaurantId/categories` | Public list; owner/super-admin create |
|  | `GET /categories/:categoryId` | Public |
|  | `PATCH`, `DELETE /categories/:categoryId` | Owner or super admin; delete deactivates |
| Menu | `GET`, `POST /restaurants/:restaurantId/menu` | Public list supports `category`, `search`, `minPrice`, `maxPrice`, `isAvailable`; owner/super-admin create |
|  | `GET /menu/:menuItemId` | Public |
|  | `PATCH`, `DELETE /menu/:menuItemId` | Owner or super admin; delete deactivates/unlists |
|  | `PATCH /menu/:menuItemId/availability` | Owner or super admin — `{ "isAvailable": true }` |
| Cart | `GET /cart` | Customer |
|  | `POST /cart/items` | Customer — `{ "menuItemId", "quantity" }` |
|  | `PATCH`, `DELETE /cart/items/:menuItemId`; `DELETE /cart` | Customer |
| Orders | `POST /orders` | Customer — delivery address, phone, `cash`/`card`/`wallet`, notes |
|  | `GET /orders/my-orders`, `GET /orders/:orderId` | Customer owns order; restaurant owner/super admin may retrieve a specific order |
|  | `PATCH /orders/:orderId/cancel` | Customer, only pending/confirmed |
|  | `PATCH /orders/:orderId/status` | Restaurant owner or super admin — `{ "status": "preparing" }` |
| Restaurant orders | `GET /restaurants/:restaurantId/orders` | Owner or super admin — `status`, `from`, `to`, `search`, pagination |
| Admin | `GET /admin/users`, `/admin/restaurants`, `/admin/orders`, `/admin/dashboard` | Super admin |
|  | `PATCH /admin/users/:userId/status` | Super admin — `{ "isActive": false }` |
| Upload | `POST /uploads/image` | Restaurant/super admin multipart field `image` |

Import `postman/FoodWorld-Restaurant-API.postman_collection.json` into Postman for a runnable request collection; set `baseUrl` and role-specific token variables.

## Data integrity and security choices

- The client never supplies or controls stored item price, subtotal, delivery fee, discount, or order total. The cart and checkout re-read current menu records; orders save immutable name/price snapshots.
- A cart belongs to one user and one restaurant. Unavailable/deactivated menu items or restaurants cannot be added or ordered.
- Checkout atomically creates the order and clears the cart in a MongoDB transaction. The current delivery fee is a documented flat `150`; discounts are `0` until a validated coupon module is introduced.
- Passwords are bcrypt-hashed and stored with `select: false`. JWTs are verified against a current active user and token version. Login/register are rate limited.
- Category-to-restaurant membership is checked before a menu item can be created or reassigned. Resources use soft deactivation to preserve historic order references.
- Status transitions are fixed: `pending → confirmed/rejected/cancelled → preparing → ready → out_for_delivery → delivered`; terminal statuses cannot change.

## Architecture

`src/models` owns data shapes/indexes; `validators` parse external input; routes compose middleware; controllers translate requests/responses; services contain authentication, ownership, cart, checkout, and Cloudinary operations; middleware centralizes authentication, roles, uploads, validation, and errors. `server.js` only validates environment, connects MongoDB, and starts HTTP.

The pre-existing `/api/products` endpoint remains temporarily for the current React dashboard. New work should use the restaurant/menu API above.
