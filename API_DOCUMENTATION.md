# API Documentation

Base URL: `http://localhost:5000`

## Authentication

### `POST /api/auth/signup`

- Authentication: not required
- Body:
  - `full_name` - string, required
  - `email` - string, required
  - `password` - string, required
- Success: `201`
- Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "full_name": "Demo User",
      "email": "demo@example.com",
      "role": "user"
    },
    "token": "jwt-token"
  }
}
```

- Business rules:
  - email must be unique
  - password is hashed before storage
  - wallets are pre-created for all active currencies

### `POST /api/auth/login`

- Authentication: not required
- Body:
  - `email` - string, required
  - `password` - string, required
- Success: `200`
- Business rules:
  - validates credentials
  - updates `last_login_at`
  - returns JWT token

### `GET /api/auth/profile`

- Authentication: bearer token required
- Success: `200`

## Wallet

### `GET /api/wallet`

- Authentication: bearer token required
- Success: `200`
- Returns all wallets for the authenticated user with currency details

### `GET /api/wallet/ledger`

- Authentication: bearer token required
- Query params:
  - `currencyId` - integer, optional
- Success: `200`
- Returns ledger entries for the user's wallets

### `POST /api/wallet/purchase`

- Authentication: bearer token required
- Body:
  - `currencyId` - integer, required
  - `quantity` - integer, required
  - `description` - string, optional
- Success: `200`
- Business rules:
  - quantity must be greater than zero
  - creates wallet if missing
  - updates balance and ledger in one transaction

## Stripe

### `POST /api/stripe/checkout`

- Authentication: bearer token required
- Body:
  - `currencyId` - integer, required
  - `quantity` - integer, required
- Success: `200`
- Response:

```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/...",
    "paymentId": 12
  }
}
```

- Business rules:
  - quantity must be greater than zero
  - currency must exist
  - total amount is `price_per_credit_paise * quantity`
  - Stripe Checkout is created in `INR`
  - total amount must be at least `STRIPE_MINIMUM_AMOUNT_PAISE`
  - creates a local pending `payments` row
  - does not grant credits yet

### `POST /api/stripe/webhook`

- Authentication: not required
- Body: raw JSON
- Header: `Stripe-Signature` required
- Success: `200`
- Business rules:
  - verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
  - stores events in `stripe_events` for idempotency
  - on `checkout.session.completed`, grants credits in one transaction
  - updates wallet balance
  - writes wallet ledger
  - marks payment as `succeeded`

## Campaigns

### `POST /api/campaigns`

- Authentication: bearer token required
- Body:
  - `title` - string, required
  - `targetAmount` - integer, required
  - `currencyId` - integer, required
  - `description` - string, optional
- Success: `201`
- Business rules:
  - currency must exist
  - target amount must be greater than zero
  - campaign starts as `active`

### `POST /api/campaigns/:id/fund`

- Authentication: bearer token required
- Body:
  - `currencyId` - integer, required
  - `amount` - integer, required
- Success: `200`
- Business rules:
  - only campaign-module currencies can fund campaigns
  - amount must be greater than zero
  - wallet must have enough balance
  - writes ledger and campaign update in one transaction

## Error Format

All failures follow this shape:

```json
{
  "success": false,
  "error": {
    "message": "Human readable message",
    "details": null
  }
}
```

Common statuses:

- `400` - validation or business rule error
- `401` - authentication failure
- `404` - missing resource
- `409` - conflict such as duplicate email
- `500` - unexpected server error
