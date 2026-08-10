# Multi-Currency Wallet & Campaign Backend

Node.js + TypeScript backend for a credit wallet system with Stripe checkout, wallet ledger tracking, and campaign funding.

## Architecture

This backend now follows a straightforward MVC structure:

- `src/models` - Sequelize models and associations
- `src/controllers` - request handling plus business logic
- `src/routes` - route registration
- `src/middleware` - auth, validation, error handling
- `src/config` - database and runtime configuration
- `src/migrations` - schema migrations
- `src/seeders` - initial seed data
- `src/utils` - shared helpers such as HTTP error utilities

There is no `services` layer and no DTO layer in the backend.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set your values.

3. Create the database:

```sql
CREATE DATABASE IF NOT EXISTS credit_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Run migrations and seeders:

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

5. Start the backend:

```bash
npm run dev
```

6. Build production output:

```bash
npm run build
npm start
```

## Environment Variables

- `PORT` - backend port, default `5000`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - MySQL connection
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - token expiry such as `1h`
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_MINIMUM_AMOUNT_PAISE` - minimum Stripe checkout amount in paise for your account setup
- `CORS_ORIGIN` - frontend origin

`STRIPE_MINIMUM_AMOUNT_PAISE` matters because the backend creates Stripe Checkout Sessions in INR. If a request falls below your Stripe account's minimum supported amount, the API rejects it before calling Stripe and returns a clear `400` response.

## Business Logic

### Auth flow

`POST /api/auth/signup`
- Validates required fields
- Creates the user with a hashed password
- Generates a JWT
- Pre-creates wallets for every active currency

`POST /api/auth/login`
- Validates email and password
- Verifies the password hash
- Updates `last_login_at`
- Returns a fresh JWT

### Wallet flow

`GET /api/wallet`
- Returns all wallets for the authenticated user
- Includes currency metadata for each wallet

`GET /api/wallet/ledger`
- Returns ledger entries tied to the user's wallets
- Supports optional `currencyId` filtering

`POST /api/wallet/purchase`
- Directly grants credits without Stripe
- Creates or reuses the wallet
- Adds a `purchase` ledger entry
- Updates wallet balance in a DB transaction

### Campaign flow

`POST /api/campaigns`
- Creates an active campaign for a chosen currency
- Stores target amount in credits

`POST /api/campaigns/:id/fund`
- Requires a campaign-module currency
- Checks wallet balance
- Deducts credits from the wallet
- Writes a `spend` ledger entry
- Updates the campaign amount and status inside one transaction

### Stripe checkout flow

`POST /api/stripe/checkout`
- Validates `currencyId` and `quantity`
- Loads the selected currency
- Calculates total amount from `price_per_credit_paise * quantity`
- Creates the Stripe Checkout Session with `currency: 'inr'`
- Rejects requests below `STRIPE_MINIMUM_AMOUNT_PAISE`
- Creates a Stripe Checkout Session
- Creates a local `payments` row with `pending` status

`POST /api/stripe/webhook`
- Uses the raw request body for Stripe signature verification
- Saves each Stripe event for idempotency
- On `checkout.session.completed`:
  - finds the related payment
  - creates or loads the wallet
  - grants credits
  - writes a wallet ledger record
  - marks the payment as `succeeded`

Credits are granted only from the verified webhook, not from checkout session creation.

## Fixes Applied

- Removed `src/services`
- Moved business logic into MVC controllers
- Added shared HTTP error handling for cleaner API responses
- Fixed Stripe webhook raw-body handling
- Added early Stripe minimum-amount validation
- Switched checkout line items to `unit_amount + quantity` instead of sending one combined line item
- Aligned seeded credit pricing with the INR examples from the assignment

## Stripe Local Testing

Run Stripe CLI:

```bash
stripe listen --forward-to http://localhost:5000/api/stripe/webhook
```

Then copy the printed `whsec_...` value into `.env` as `STRIPE_WEBHOOK_SECRET`.

## INR Pricing Notes

Seeded examples now follow the take-home brief:

- Campaign Credits: `₹3` per credit
- Report Credits: `₹10` per credit
- Discovery Credits: `₹5` per credit

If Stripe still rejects a purchase, the most common reason is that the total payable INR amount is below your Stripe account's minimum supported amount. In that case, increase the quantity or raise `STRIPE_MINIMUM_AMOUNT_PAISE` so the backend blocks too-small requests before they reach Stripe.

## Verification

Build check completed successfully on July 22, 2026:

```bash
npm run build
```
