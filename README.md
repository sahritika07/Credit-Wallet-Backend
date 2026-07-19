# Multi-Currency Wallet & Campaign Backend

Production-ready Node + TypeScript backend for a multi-currency wallet and campaign funding platform.

**Contents**
- Quick start
- Environment
- Database (migrations & seeders)
- Running the app
- Stripe (test mode) steps
- Testing
- Files of interest
- API Documentation (see API_DOCUMENTATION.md)

**Quick start**
1. Install dependencies:
```bash
npm install
```
2. Copy `.env.example` to `.env` and set your values (DB and Stripe keys)
3. Create MySQL database (example):
```sql
CREATE DATABASE IF NOT EXISTS credit_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
4. Run migrations and seeders:
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```
5. Start in development:
```bash
npm run dev
```
6. Build / run production:
```bash
npm run build
npm start
```

**Environment variables** (`.env`)
- `PORT` - server port (default 5000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - MySQL connection
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - token expiry (e.g. `1h`)
- `STRIPE_SECRET_KEY` - Stripe test secret key (`sk_test_...`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (`whsec_...`)
- `CORS_ORIGIN` - front-end origin

**Database**
- Sequelize migrations are used (no `sequelize.sync()`)
- Migrations located in `src/migrations`
- Seeders located in `src/seeders` (initial currencies seeded)

**Stripe (Test Mode)**
- Use Stripe Checkout + Webhooks
- For local testing use the Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to http://localhost:5000/api/stripe/webhook
```
- Copy the printed `Webhook signing secret: whsec_...` into `.env` as `STRIPE_WEBHOOK_SECRET` and restart the server.
- Use Stripe test cards such as `4242 4242 4242 4242` for test payments.

**Testing**
- No test harness added yet. Recommended next steps:
  - Add Jest + supertest for integration tests
  - Add tests for auth, wallet, ledger, webhook idempotency, and concurrent funding

**Files of interest**
- `src/app.ts` - Express app configuration
- `src/server.ts` - server bootstrap (connects DB)
- `src/config` - DB and CLI configs
- `src/models` - Sequelize models
- `src/migrations` - Sequelize migrations
- `src/seeders` - Sequelize seeders
- `src/controllers` - MVC controllers
- `src/services` - business logic (wallet, campaign, stripe)
- `src/routes` - express routes
- `src/middleware` - auth, validators, error handler
- `src/utils/response.ts` - consistent response helpers

See `API_DOCUMENTATION.md` for endpoints, request/response formats and validation rules.

---

Commit message suggestion for this addition:
```
docs: add README.md and API documentation
```
