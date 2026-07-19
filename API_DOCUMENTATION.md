# API Documentation

Base URL: `http://localhost:5000`
All routes are prefixed as shown in the route path examples.

---

**Authentication**

- POST /api/auth/signup
  - Authentication: No
  - Request body (application/json):
    - `full_name` (string, required)
    - `email` (string, required)
    - `password` (string, required)
  - Response 201:
    - `{ success: true, data: { user: { id, full_name, email, role }, token } }`
  - Errors: 400 (validation), 409 (email exists)
  - Business rules: Creates user, hashes password, returns JWT. Also creates wallets later via service.

- POST /api/auth/login
  - Authentication: No
  - Request body:
    - `email` (string, required)
    - `password` (string, required)
  - Response 200: same shape as signup
  - Errors: 400 (validation), 401 (invalid credentials)

- GET /api/auth/profile
  - Authentication: Bearer token required
  - Response 200: `{ success: true, data: user }`

---

**Wallet**

- GET /api/wallet
  - Authentication: Bearer token required
  - Response 200: `{ success: true, data: [ wallets ] }`
  - Each wallet: `{ id, user_id, currency_id, current_balance, currency: { id, name, code, module, price_per_credit_paise } }`

- GET /api/wallet/ledger?currencyId={currencyId}
  - Authentication: Bearer token required
  - Query params: `currencyId` optional
  - Response 200: `{ success: true, data: [ ledger entries ] }`
  - Ledger entry: `{ id, wallet_id, currency_id, type, amount, balance_after, reference_type, reference_id, description, createdAt }`

- POST /api/wallet/purchase
  - Authentication: Bearer token required
  - Request body:
    - `currencyId` (integer, required)
    - `quantity` (integer, required)
    - `description` (string, optional)
  - Response 200: `{ success: true, data: { wallet, currency } }`
  - Business rules: Uses transactions; creates ledger entry; quantity must be > 0.

---

**Stripe (Checkout & Webhook)**

- POST /api/stripe/checkout
  - Authentication: Bearer token required
  - Request body:
    - `currencyId` (integer, required)
    - `quantity` (integer, required)
  - Response 200: `{ success: true, data: { checkoutUrl, paymentId } }`
  - Business rules: Creates a `Payment` record with status `pending` and creates a Stripe Checkout session. Do NOT grant credits until webhook verifies payment.

- POST /api/stripe/webhook
  - Authentication: None (Stripe signs requests)
  - Body: raw JSON (express.raw used on route)
  - Headers: `Stripe-Signature` header required
  - Behavior: verifies signature with `STRIPE_WEBHOOK_SECRET`, stores incoming event in `stripe_events` (idempotency), and for `checkout.session.completed` grants credits inside a DB transaction: updates wallet balance, creates ledger entry, updates payment status to `succeeded`.
  - Response 200 on success: `{ success: true, message: 'Credits granted' }` or `{ success: true, message: 'Webhook processed' }`
  - Idempotency: `stripe_events.event_id` is unique — duplicate events are ignored.

---

**Campaigns**

- POST /api/campaigns
  - Authentication: Bearer token required
  - Request body:
    - `title` (string, required)
    - `targetAmount` (integer, required) — amount in credits (not paise)
    - `currencyId` (integer, required)
    - `description` (string, optional)
  - Response 201: `{ success: true, data: campaign }`
  - Business rules: currency must exist; campaign created in `active` state.

- POST /api/campaigns/:id/fund
  - Authentication: Bearer token required
  - Request body:
    - `currencyId` (integer, required)
    - `amount` (integer, required) — credits to fund
  - Response 200: `{ success: true, data: updatedCampaign }`
  - Business rules:
    - Only currencies where `module === 'campaign'` allowed
    - Wallet must have sufficient balance; balance cannot be negative
    - Campaign can only be funded once; status updated to `funded`
    - Uses DB transactions for consistency

---

**Errors & Validation**
- Responses follow `{ success: boolean, data?: any, error?: { message, details } }` format
- Validation failures return 400 with details array
- Authentication failures return 401

---

**Notes & Next Steps**
- Add OpenAPI / Swagger documentation and serve it via an `api-docs` endpoint
- Add automated tests: Jest + supertest
- Harden webhook processing with retry/backoff and a dead-letter mechanism

---

Commit message suggestion:
```
docs: add API documentation file
```
