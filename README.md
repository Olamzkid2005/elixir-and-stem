# Elixir & Stem — Cannabis Marketplace (US Market)

Cross-platform mobile app (iOS + Android) connecting licensed US cannabis dispensaries with
customers for browsing, ordering, and pay-on-delivery fulfillment. Built with Expo (React Native +
TypeScript), NativeWind (Tailwind for RN) with a shadcn-style component system, Zustand, and an
Express + PostgreSQL + Prisma backend.

## Repository layout

```
elixir-and-stem/
├── app/        # Expo mobile app (customer + merchant modes, one codebase)
└── server/     # Express + Prisma API (auth, merchants, products, orders, admin)
```

## Design system

All screens follow the provided Elixir & Stem design reference:

- **Colors** — Material-style tokens mapped 1:1 into `app/tailwind.config.js`
  (deep green `primary #061b0e`, warm off-white `background #fbf9f4`, sage `secondary #4d644b`,
  amber `tertiary-fixed-dim #e9c176`).
- **Typography** — Playfair Display (headlines) + Inter (body/labels), loaded via
  `@expo-google-fonts/*` in `App.tsx`.
- **Components** — shadcn-style primitives in `app/src/components/ui/`
  (`Button`, `Card`, `Input`, `Badge`, `Chip`, `QuantityStepper`, …) with a shared `cn()` utility
  (`clsx` + `tailwind-merge`). shadcn/ui is web-only, so this is its React Native equivalent
  (NativeWind + reusable ui components) — same API shape and design-token-driven styling.
- **Icons** — Material Symbols names from the design are mapped to `@expo/vector-icons` in
  `app/src/components/ui/Icon.tsx`.

## Quick start — mobile app

```bash
cd app
npm install
npx expo start        # then scan the QR code with Expo Go, or press i / a for a simulator
```

The app runs **standalone out of the box** on bundled seed data (merchants, products, orders,
rewards) — no backend required to click through every screen. To connect the real API, copy
`app/.env.example` → `app/.env` and set `EXPO_PUBLIC_API_URL` (see below), then restart Expo.

Demo paths in mock mode:

- Any email + an 8+ character password signs you in.
- **Customer flow**: Age gate → Continue as Customer → sign in → browse / search / product detail →
  cart → checkout (pay on delivery) → live order tracking timeline.
- **Merchant flow**: Age gate → Continue as Merchant → Create Account → onboarding wizard
  (business → license upload → payout) → merchant dashboard, inventory, order queue, analytics.
  New merchant applications always land in **pending** review.

## Quick start — backend

```bash
cd server
npm install
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npx prisma migrate dev        # creates tables in PostgreSQL
npm run seed                  # admin, approved+pending merchants, menu, customer
npm run dev                   # API on http://localhost:4000
```

Seeded credentials (password for all: `password123`):

| Account                  | Role                |
| ------------------------ | ------------------- |
| `admin@elixirandstem.com`    | admin               |
| `shop@elixirandstem.com`     | merchant (approved) |
| `newshop@example.com`        | merchant (pending)  |
| `customer@example.com`       | customer            |

API surface:

- `POST /auth/signup` · `POST /auth/signin` — JWT auth (bcrypt password hashes)
- `GET /merchants` (approved only) · `GET /merchants/me` · `POST /merchants` (always `pending`)
- `GET /products` · `POST /products` · `PATCH /products/:id` · `DELETE /products/:id`
- `GET /orders` · `POST /orders` (server-side totals) · `PATCH /orders/:id/status` (validated transitions)
- `GET /admin/merchants` · `PATCH /admin/merchants/:id` (approve/reject — the **only** place
  merchant status changes) · `GET /admin/users` · `PATCH /admin/users/:id/suspend`

## Compliance guardrails (built in from the start)

- 21+ age gate before any content; `users.age_verified` persisted for audit.
- Merchant license number + document upload; accounts stay `pending` until an admin approves —
  there is intentionally **no auto-approval logic** anywhere.
- `merchants.state_code` column + a marked hook in `POST /orders` so per-state tax/delivery rules
  can be added per merchant later without a rewrite.
- Order totals are recomputed server-side; clients never set prices.

## Out of scope this phase (per spec)

- Real payment processing (pay-on-delivery only)
- SMS/push notification delivery (Expo Notifications wired, send hooks marked with `TODO`)
- Multi-language support

## Notes

- Product art is a styled placeholder tile (`ProductImage`); swap in `expo-image` once product
  photos land in S3 (`products.image_url`).
- The Browse screen map placeholder becomes a real `react-native-maps` view in a dev build
  (Expo Go doesn't include native map modules).
