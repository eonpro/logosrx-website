# LogosRx Clinic Ordering API (v1)

Submit prescription orders to Logos Pharmacy programmatically. Orders are
validated, priced against your clinic's catalog, and forwarded to the pharmacy
in real time.

- **Base URL:** `https://logosrx.com/api/clinic/v1`
- **Format:** JSON in, JSON out. All responses carry a `requestId` (also in
  the `X-Request-Id` header) — cite it in support requests.

## Authentication

Every request needs an API key, issued by the LogosRx team and scoped to your
clinic. Send it either way:

```http
Authorization: Bearer lxck_<your-key>
# or
X-Api-Key: lxck_<your-key>
```

Keys are shown once at creation; only a hash is stored. Ask us to rotate or
revoke a key at any time. Requests are limited to 60/minute per key — on
`429 RATE_LIMITED`, back off and retry.

## Response envelope

The top-level `success` boolean is the discriminator:

```json
{ "success": true,  "...": "...", "requestId": "req_…" }
{ "success": false, "error": { "type": "invalid_request", "code": "VALIDATION_FAILED", "message": "…" }, "requestId": "req_…" }
```

`error.type` is one of `invalid_request`, `permission_error`,
`pharmacy_error`, `api_error`. Switch on `error.code` (stable), not `message`.

## GET /products

Your clinic's medication catalog: names, strengths, your prices, and whether
each product can be ordered through the API right now.

```bash
curl -H "X-Api-Key: lxck_<key>" https://logosrx.com/api/clinic/v1/products
```

```json
{
  "success": true,
  "products": [
    {
      "productId": "semaglutide-glycine-2.5mg-1ml",
      "name": "Semaglutide / Glycine 2.5mg/1mL",
      "strength": "2.5 mg/mL",
      "form": "Injectable",
      "unit": "Each",
      "priceCents": 12000,
      "orderable": true,
      "controlled": false,
      "defaultQuantity": "1",
      "quantityUnits": "each"
    }
  ],
  "requestId": "req_…"
}
```

`productId` is what you send when ordering. `orderable: false` means the
product must be prescribed through the LifeFile portal instead (controlled
substances, or not yet enabled for API ordering).

## POST /orders

Submit one prescription order (one patient, one prescriber, one shipping
destination, one or more medications).

```bash
curl -X POST https://logosrx.com/api/clinic/v1/orders \
  -H "X-Api-Key: lxck_<key>" \
  -H "Content-Type: application/json" \
  -d @order.json
```

```json
{
  "referenceId": "your-order-8842",
  "prescriberNpi": "1003802901",
  "patient": {
    "firstName": "Pat",
    "lastName": "Example",
    "gender": "f",
    "dateOfBirth": "1990-01-02",
    "address1": "100 Test Blvd",
    "city": "Orlando",
    "state": "FL",
    "zip": "32801",
    "phoneMobile": "(212) 867-5309",
    "email": "pat@example.com",
    "allergies": ["penicillin"],
    "conditions": []
  },
  "shipping": {
    "recipientType": "patient",
    "recipientFirstName": "Pat",
    "recipientLastName": "Example",
    "recipientPhone": "(212) 867-5309",
    "addressLine1": "100 Test Blvd",
    "city": "Orlando",
    "state": "FL",
    "zipCode": "32801",
    "serviceId": 8097
  },
  "payorType": "doc",
  "memo": "Optional note for the pharmacy (max 120 chars)",
  "rxs": [
    {
      "productId": "semaglutide-glycine-2.5mg-1ml",
      "directions": "Inject 10 units (0.10 mL) subcutaneously once weekly.",
      "quantity": "1",
      "daysSupply": 28,
      "refills": 0
    }
  ]
}
```

Field notes:

- **`referenceId`** (required) — your order id: 8-64 chars, letters, digits,
  `_`, `-`. This is the **idempotency key**: retrying with the same value
  returns the stored outcome (`"deduped": true`) instead of creating a second
  order. Use a new value for each new order.
- **`prescriberNpi`** — must match a provider registered on your clinic's
  LogosRx profile.
- **`patient`** — sent inline. We match it to your clinic's existing patient
  records by first/last name + date of birth (case-insensitive) and refresh
  contact details, or create a new record. `gender` is `m`, `f`, or `u`;
  dates are `yyyy-mm-dd`. Alternatively, send `patientId` if you track our
  patient ids.
- **`shipping.recipientType`** — `patient` or `clinic`. `serviceId` is
  optional (your account default applies); available codes come from your
  onboarding sheet (e.g. 8097 UPS Next Day Florida, 8200 UPS 2nd Day Air).
- **`payorType`** — `doc` (bill clinic, default) or `pat` (bill patient).
- **`rxs[]`** — one entry per prescription. `quantity` counts packs/vials
  (defaults to the product's `defaultQuantity`). Phone numbers anywhere accept
  common US formats and are normalized to `(XXX) XXX-XXXX`.

### Success

```json
{
  "success": true,
  "orderId": 214,
  "lfOrderId": "24201108",
  "referenceId": "your-order-8842",
  "status": "accepted",
  "deduped": false,
  "requestId": "req_…"
}
```

`lfOrderId` is the pharmacy-side order number. Store `orderId` (or your
`referenceId`) for status lookups.

### Error codes

| HTTP | `code` | Meaning |
| --- | --- | --- |
| 400 | `INVALID_JSON` | Body is not parseable JSON. |
| 401 | `UNAUTHORIZED` | Missing/invalid API key. |
| 403 | `CLINIC_NOT_VERIFIED` | Clinic account not approved yet. |
| 403 | `ORDERING_NOT_ENABLED` | API/dashboard ordering not enabled for the clinic. |
| 422 | `VALIDATION_FAILED` | A field is missing or malformed (see `message`). |
| 422 | `PATIENT_NOT_FOUND` | `patientId` doesn't belong to your clinic. |
| 422 | `PRESCRIBER_NOT_FOUND` | NPI not on your clinic profile. |
| 422 | `PRODUCT_NOT_AVAILABLE` | Unknown/inactive `productId`. |
| 422 | `PRODUCT_NOT_ORDERABLE` | Product not enabled for API ordering. |
| 422 | `CONTROLLED_SUBSTANCE` | Schedule 2-5 — use the LifeFile portal. |
| 429 | `RATE_LIMITED` | Slow down; retry shortly. |
| 502 | `PHARMACY_REJECTED` | Pharmacy refused the order (see `message`); our team is alerted. |
| 503 | `PHARMACY_UNREACHABLE` | Order saved but not yet delivered to the pharmacy; our team is alerted. Do NOT blind-retry with a new referenceId. |
| 500 | `INTERNAL_ERROR` | Something broke on our side. |

## GET /orders/{orderId} and GET /orders?referenceId=…

Order snapshot, scoped to your clinic (another clinic's order returns 404).

```bash
curl -H "X-Api-Key: lxck_<key>" https://logosrx.com/api/clinic/v1/orders/214
curl -H "X-Api-Key: lxck_<key>" "https://logosrx.com/api/clinic/v1/orders?referenceId=your-order-8842"
```

```json
{
  "success": true,
  "order": {
    "orderId": 214,
    "referenceId": "your-order-8842",
    "lfOrderId": "24201108",
    "status": "accepted",
    "errorMessage": null,
    "rxs": [
      {
        "drugName": "Semaglutide / Cyanocobalamin",
        "drugStrength": "2.5mg/0.5mg per mL",
        "quantity": "1",
        "daysSupply": 28,
        "refills": 0
      }
    ],
    "createdAt": "2026-07-23T14:00:00.000Z",
    "updatedAt": "2026-07-23T14:00:05.000Z"
  },
  "requestId": "req_…"
}
```

Statuses: `submitted` (being transmitted), `accepted` (pharmacy has it),
`pharmacy_rejected` / `failed` (needs attention — our team is alerted and
`errorMessage` carries a short reason). Fulfillment/tracking statuses will be
added once pharmacy status sync ships; poll `GET /orders/{id}` or ask us
about webhooks.
