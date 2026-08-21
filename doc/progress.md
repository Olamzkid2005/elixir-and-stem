# Progress — Elixir & Stem

**✅ Codebase scanned & verified** (2026-08-21) — typecheck passes on frontend, backend structure confirmed.

## What this repo is

- `app/` — Expo (React Native + TypeScript) mobile app. Customer + merchant modes, one codebase. NativeWind + shadcn-style UI.
- `server/` — Express + PostgreSQL + Prisma API (auth, merchants, products, orders, admin, favorites, reviews, loyalty, push notifications).

## Prerequisites

- Node.js 20+ (tested: v24) and npm
- Phone with **Expo Go** (SDK 54 build — the App Store / Play Store version) — iOS: App Store, Android: Play Store
- PostgreSQL for backend

## Open & run — frontend (no backend needed)

```bash
git clone <repo-url>
cd elixir-and-stem/app
npm install
npx expo start --lan
```

The app runs standalone on bundled seed data (merchants, products, orders, rewards) — no backend required.

## Open & run — frontend + backend (full stack)

```bash
# Terminal 1: backend
cd server
npm install
cp .env.example .env        # set DATABASE_URL + JWT_SECRET
npx prisma migrate dev
npm run seed
npm run dev                  # API on http://localhost:4000

# Terminal 2: frontend
cd app
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:4000
npx expo start --lan --clear
```

Sign in with: `customer@example.com` / `password123` (customer) or `shop@elixirandstem.com` / `password123` (merchant).

## Running tests

```bash
cd server && npm test       # 92 tests across 10 suites
```

## Features implemented

### Tier 1 ✅
- **Reorder & Favorites** — heart toggle, Favorites screen, Home shelf, reorder from past orders
- **Reviews & Ratings** — verified-purchase-only, WriteReviewScreen, merchant analytics aggregates
- **Rewards/Loyalty** — points on delivery, tier progress, redemption in checkout, Rewards screen
- **Order Scheduling** — date/time picker in checkout, Today/Scheduled tabs in merchant queue

### Push Notifications ✅
- Push token registration on app startup
- Notifications on order status transitions (placed → confirmed → out_for_delivery → delivered)
- New order alerts to merchant
- Tap notification → navigates to OrderTracking screen
- "Send Test Notification" button in Profile (Debug section)

### Product Search ✅
- `GET /products/search?q=&category=` — PostgreSQL ilike across name, brand, description, strainType
- Debounced 300ms search in HomeScreen, falls back to mock filtering
- Category filter chips, search results indicator with clear

### Backend polish ✅
- `imageColor` and `effects` fields on Product (in schema, populated by seed)
- `deliveryEtaMin`/`deliveryEtaMax` on Merchant (mapped to `deliveryEtaMins` tuple in API)
- Orders include `merchantName` via merchant relation join
- Prisma migration: `add-display-fields`

### Navigation Drawer ✅
- Slide-in drawer using `@react-navigation/drawer`
- Menu button in AppHeader opens the drawer
- Profile header with user info
- Navigation links: Home, Browse, Cart, Orders, Profile, Favorites, Rewards
- Merchant Dashboard link for merchants
- Admin Dashboard link for admins
- Sign out button

### Merchant License Upload ✅
- Pre-signed S3 upload endpoint (`POST /upload/presigned-url`)
- Frontend `api.uploadFile()` for direct S3 uploads via pre-signed URLs
- Merchant onboarding uploads license document to S3
- Admin dashboard shows license document link for review
- `PATCH /merchants/me` for updating merchant profile

### Admin Dashboard ✅
- Admin dashboard screen (`/admin`) for reviewing merchant applications
- Shows pending merchants with business info and license details
- View license document link
- Approve/reject merchants
- Accessible from drawer for admin users

### Nigerian Localization ✅
- Merchant locations updated to Nigerian cities (Lagos, Abuja)
- Nigerian state tax levies (LA 5%, AB 2%, etc.)
- Federal VAT 7.5% applied nationwide
- Distance-based delivery fee calculation
- Browse screen map placeholder shows Nigerian cities
- Seed data updated with Nigerian addresses and NAFDAC license numbers

### Delivery Lifecycle (Chowdeck/Glovo pattern) ✅
- Full order status lifecycle: placed → confirmed → ready_for_pickup → rider_assigned → picked_up → out_for_delivery → arrived → delivered
- Rider model with location tracking and online status
- Auto-dispatch: nearest idle rider assignment when order is ready for pickup
- Push notifications fire on every status transition
- OrderTrackingScreen shows all 8 steps in timeline
- Merchant can mark order ready_for_pickup when prepared
- Bank account field added to Merchant model for payouts

## Test coverage (127 tests, 13 suites)

| Suite | Tests |
|-------|-------|
| auth.test.ts | 8 |
| merchants.test.ts | 7 |
| products.test.ts | 9 |
| orders.test.ts | 12 |
| favorites.test.ts | 6 |
| reviews.test.ts | 7 |
| loyalty.test.ts | 8 |
| admin.test.ts | 7 |
| pushTokens.test.ts | 14 |
| search.test.ts | 10 |
| riders.test.ts | 12 |
| delivery.test.ts | 11 |
| tax.test.ts | 15 |

## Known gaps

- **Product images** — `imageColor` placeholder used; real photos need S3 integration
- **Maps** — Browse screen placeholder; needs `react-native-maps` dev build
- **Payments** — intentionally out of scope (pay-on-delivery only)
- **Frontend tests** — no React Native Testing Library tests yet

## Recent changes / gotchas

- **SDK 51 → 54 upgrade**: `babel-preset-expo` must be a direct dependency (v54.0.12)
- After dependency changes: `npx expo start --lan --clear`
- `npx expo upgrade` no longer exists — edit package.json manually for SDK bumps
- Server refactored: Express app extracted to `src/app.ts` for testability
- `useRef` in React 19 requires initial value argument

## Out of scope this phase

Real payments (pay-on-delivery only), SMS/push delivery, multi-language. Product art is a styled placeholder; Browse map placeholder becomes `react-native-maps` in a dev build (Expo Go lacks native map modules).
