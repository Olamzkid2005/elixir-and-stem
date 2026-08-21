# Progress — Elixir & Stem

**✅ Codebase scanned & verified** (2026-08-21) — typecheck passes on frontend, backend structure confirmed.

## What this repo is

- `app/` — Expo (React Native + TypeScript) mobile app. Customer + merchant modes, one codebase. NativeWind + shadcn-style UI.
- `server/` — Express + PostgreSQL + Prisma API (auth, merchants, products, orders, admin, favorites, reviews, loyalty).

## Prerequisites

- Node.js 20+ (tested: v24) and npm
- Phone with **Expo Go** (SDK 54 build — the App Store / Play Store version) — iOS: App Store, Android: Play Store
- Optional for backend: PostgreSQL

## Open & run — frontend (no backend needed)

```bash
git clone <repo-url>
cd elixir-and-stem/app
npm install
npx expo start --lan
```

The app runs standalone on bundled seed data (merchants, products, orders, rewards) — no backend required.

### View it on your phone

1. Phone and computer must be on the **same Wi-Fi**
2. Install **Expo Go** (store version = SDK 54, matches this project)
3. `npx expo start --lan` shows a QR code in the terminal — scan it from inside Expo Go
4. First launch bundles for ~30–60s, then the age gate appears

Demo accounts (mock mode): any email + 8+ char password signs you in. Customer flow: age gate → browse → cart → checkout (pay on delivery). Merchant flow: age gate → create account → onboarding → dashboard.

## Open & run — backend (optional)

```bash
cd server
npm install
cp .env.example .env        # set DATABASE_URL + JWT_SECRET
npx prisma migrate dev
npm run seed                # seeded accounts, password for all: password123
npm run dev                 # API on http://localhost:4000
```

Seeded accounts: `admin@elixirandstem.com` (admin), `shop@elixirandstem.com` (merchant approved), `newshop@example.com` (merchant pending), `customer@example.com` (customer).

To point the app at the API: copy `app/.env.example` → `app/.env`, set `EXPO_PUBLIC_API_URL`, restart Expo.

## Running tests

```bash
cd server
npm test                    # runs Jest + Supertest against a test PostgreSQL database
npm run test:verbose        # verbose output
```

Tests require a running PostgreSQL instance. Create a test database:

```bash
/opt/local/lib/postgresql15/bin/createdb -h localhost -U postgres elixir_stem_test
```

Then create `server/.env` with `DATABASE_URL=postgresql://postgres@localhost:5432/elixir_stem_test` and `JWT_SECRET=<any-random-string>`.

## Tier 1 features (implemented 2026-08-21)

### Reorder & Favorites ✅
- **OrdersScreen** — "Reorder" button on delivered orders, re-adds items to cart
- **ProductDetailScreen** — heart/favorite toggle in hero image
- **HomeScreen** — "Your Favorites" horizontal shelf (shown when ≥1 favorite)
- **FavoritesScreen** — grid of favorited products, accessible from Profile
- **Prisma** — `Favorite` model with `@@unique([userId, productId])`
- **API** — `POST /favorites` (toggle), `DELETE /favorites/:productId`, `GET /favorites`

### Reviews & Ratings ✅
- **ProductDetailScreen** — expandable reviews section with star ratings
- **WriteReviewScreen** — star picker (1–5) + optional comment
- Verified-purchase-only enforcement (reviews only on delivered order items)
- Denormalized `Product.rating` + `Product.reviewCount` updated on write
- Denormalized `Merchant.rating` updated on write
- **Prisma** — `Review` model with `orderItemId` unique constraint
- **API** — `POST /reviews`, `GET /reviews/product/:id`, `GET /reviews/merchant/:id`

### Rewards / Loyalty Points ✅
- **ProfileScreen** — live loyalty tier, Favorites link, Rewards link
- **RewardsScreen** — points balance card, tier progress bar, redeemable rewards catalog, transaction history
- **CheckoutScreen** — "Redeem 100 Points for Free Delivery" toggle
- Tier logic: bronze (0+), silver (500+), gold (2000+)
- Points awarded on delivery: 1 point per $1 spent
- **Prisma** — `LoyaltyAccount` + `LoyaltyTransaction` models
- **API** — `GET /loyalty/me`, `POST /loyalty/redeem`, `GET /loyalty/rewards`

### Order Scheduling ✅
- **CheckoutScreen** — "As Soon as Possible" vs "Schedule for Later" with date/time picker
- **OrderQueueScreen** (merchant) — "Today" vs "Scheduled" tabs with badge count
- `scheduledFor` field wired end-to-end (was already in schema)
- `GET /orders?scheduled=true/false` query param for merchant view

## Test coverage (68 tests, 8 suites)

| Suite | Tests | Coverage |
|-------|-------|----------|
| auth.test.ts | 8 | signup, signin, duplicate email, invalid creds, suspended account |
| merchants.test.ts | 7 | list approved, get profile, register, reject duplicate, auth checks |
| products.test.ts | 9 | list/filter, create, update, delete, auth + role checks, validation |
| orders.test.ts | 11 | create (totals, scheduled), list, status transitions, loyalty points |
| favorites.test.ts | 6 | toggle on/off, list, delete, auth checks |
| reviews.test.ts | 7 | submit (verified purchase), duplicate rejection, product/merchant lists |
| loyalty.test.ts | 6 | get account, rewards catalog, redeem, insufficient points |
| admin.test.ts | 7 | list merchants (all/filter), approve/reject, list users, suspend |

## Recent changes / gotchas

- **SDK 51 → 54 upgrade** (Aug 2026): `expo` → `~54.0.0`, `react`/`react-dom` → `19.1.0`, `react-native` → `0.81.5`, packages realigned via Expo's SDK 54 `bundledNativeModules.json`. `react-native-reanimated` pinned to `~4.1.1` (newest 4.5.x wants RN 0.83+, breaks resolution). Typecheck passes.
- **`babel-preset-expo` must be a direct dependency** in `app/package.json` (installed at `54.0.12`) — SDK 54 no longer resolves it transitively; without it you get `Cannot find module 'babel-preset-expo'` and a 500 on bundle.
- After changing dependencies, restart with a clean cache: `npx expo start --lan --clear`
- `npx expo upgrade` no longer exists in the current CLI — for future SDK bumps, edit `package.json` to the target SDK's versions from `https://raw.githubusercontent.com/expo/expo/sdk-54/packages/expo/bundledNativeModules.json` (swap `sdk-54` for the new branch), then `npm install`.
- Phone can't connect? Check macOS firewall on port 8081 and that both devices share a network (LAN IP shown by Expo must match your phone's network).
- **Server refactored**: Express app extracted to `src/app.ts` for testability; `src/index.ts` just starts the server.

## Known gaps

- **Product images** — `ProductImage.tsx` is a styled placeholder. `products.imageUrl` exists in schema but nothing populates or renders real images yet.
- **Maps** — Browse screen has a map placeholder. `react-native-maps` installed but needs a custom dev build (Expo Go can't load native map modules).
- **Push notifications** — `expo-notifications` installed but actual send calls on order-status change are marked `TODO`.
- **Payments** — intentionally out of scope. Pay-on-delivery only.
- **Search** — search UI exists but no backend search endpoint yet.
- **Frontend tests** — no React Native Testing Library tests yet (server-side fully covered).

## Out of scope this phase

Real payments (pay-on-delivery only), SMS/push delivery, multi-language. Product art is a styled placeholder; Browse map placeholder becomes `react-native-maps` in a dev build (Expo Go lacks native map modules).
