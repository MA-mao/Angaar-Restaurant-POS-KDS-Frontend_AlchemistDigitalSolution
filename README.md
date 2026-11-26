# 🔥 ANGAAR: Restaurant POS & Live Kitchen Display (Frontend)

> **Ate & Left No Crumbs.**

A fast, responsive Point-of-Sale terminal with a real-time Kitchen Display System (KDS), floor map, printable receipts and a manager dashboard. Built with **React + Vite + Tailwind CSS (JavaScript)**. All data access lives in a dedicated `src/services/` layer (async functions backed by `localStorage`) so the Backend team can plug in REST endpoints with minimal refactoring.

- **Live demo:** `https://angaar-psi.vercel.app/`
- **Repository:** `https://github.com/MA-mao/Angaar-Restaurant-POS-KDS-Frontend_AlchemistDigitalSolution.git`

## Demo login

| Role | Username | Password | Lands on |
|------|----------|----------|----------|
| Cashier / Order Counter | `cashier` | `cashier123` | `/pos` |
| Kitchen Staff (KDS) | `kitchen` | `kitchen123` | `/kds` |
| Restaurant Manager | `manager` | `manager123` | `/manager` |

The login screen has tap-to-fill demo buttons. After login use **Switch role** (top bar) to hop between views. The manager can open every screen. **Tip:** to see live sync, open two browser tabs, log in as manager, put one on POS and one on Kitchen.

Promo codes: `ANGAAR10` (10%), `STUDENT15` (15%, min Rs. 500), `CRUMBS100` (Rs. 100 off, min Rs. 1000).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in /dist
```

## Features

1. **Auth + role switcher**: login with validation, route guards per role, role switcher screen.
2. **POS terminal**: category tabs (Burgers, Pizzas, Drinks, Desserts, Deals), instant search, customization modal (variants, add-ons, kitchen notes), order type (Dine-In with visual table grid, Takeaway, Delivery with validated customer details), live cart with quantity controls, promo code, tax, delivery fee and grand total. Mobile cart drawer.
3. **Live KDS**: 3-column board (New → Preparing → Ready for Pickup). Each ticket shows order ID, table/type badge, items with notes and a running `mm:ss` timer computed from `createdAt` (survives refresh). Cards turn **amber** and **red** past configurable thresholds (default 10 / 15 min, editable on the KDS and by the manager). Sound on new order.
4. **Instant cross-view sync**: marking Ready in the KDS updates POS (toast), Orders and Tables immediately, across tabs too.
5. **Floor map**: tables with capacity and status (Available / Occupied / Billing Pending). Tap an occupied table to load its order, settle the bill and free the table.
6. **Printable thermal receipt** (80mm, `@media print`): header, order number, itemized list with add-ons/notes, discount, tax, delivery fee, total, payment method and change.
7. **Manager**: sales summary cards (revenue, orders, average order, tax, discounts, by payment method/order type, top items, date picker), menu management (add / edit / delete / availability toggle with variants and add-ons), settings (tax %, delivery fee, receipt header, KDS thresholds), "add sample sales" and "reset demo data".

## Folder structure

```
src/
  main.jsx, App.jsx          entry + routes + role guard
  index.css                  Tailwind + print styles
  pages/                     LoginPage, SwitchPage, PosPage, OrdersPage,
                             TablesPage, KdsPage, ManagerPage
  components/
    layout/AppShell.jsx      top bar, role-based nav, READY notifications
    pos/                     Cart, CustomizeModal
    kds/                     TicketCard
    tables/                  TableGrid
    orders/                  OrderPanel, PaymentModal
    receipt/                 Receipt (printable)
    manager/                 SalesCards, MenuManager, ItemFormModal, SettingsForm
    ui/                      Modal, Toast, Badges
  context/AuthContext.jsx    session state
  lib/                       pricing.js (pure maths), format.js, hooks.js (useLive, useNow), demo.js
  services/                  ← ALL data access. UI never touches localStorage.
    index.js, errors.js, storage.js (only file using localStorage)
    authService.js, menuService.js, orderService.js, tableService.js, settingsService.js
  data/seed.js               menu, tables, demo users, default settings
```

## Backend integration guide

Components import **only** from `src/services`. Every function is `async` and throws a `ServiceError` (`code`, `message`, optional `fields` for form errors). To go live, replace the body of each function with a `fetch` call and keep the signature; the UI does not change. `useLive(fetcher, keys)` re-fetches on changes; swap `subscribe()` in `storage.js` for WebSocket/SSE/polling.

Prices are **never trusted from the client**: the cart sends item IDs, and the service recalculates totals (as the backend should).

### Endpoint map

| Service function | Suggested REST endpoint |
|---|---|
| `login(username, password)` | `POST /api/auth/login` |
| `logout()` | `POST /api/auth/logout` |
| `getSession()` | `GET /api/auth/me` |
| `getMenu()` | `GET /api/menu` |
| `createMenuItem(input)` | `POST /api/menu` |
| `updateMenuItem(id, patch)` | `PATCH /api/menu/:id` |
| `setItemAvailability(id, available)` | `PATCH /api/menu/:id/availability` |
| `deleteMenuItem(id)` | `DELETE /api/menu/:id` |
| `getTables()` | `GET /api/tables` |
| `requestBill(tableId)` | `POST /api/tables/:id/request-bill` |
| `getOrders({status, paymentStatus, tableId, date})` | `GET /api/orders?status=new,preparing&date=YYYY-MM-DD` |
| `getOrder(id)` | `GET /api/orders/:id` |
| `createOrder(input)` | `POST /api/orders` |
| `updateOrderStatus(id, status)` | `PATCH /api/orders/:id/status` |
| `settlePayment(id, payment)` | `POST /api/orders/:id/payment` |
| `getSalesSummary(date)` | `GET /api/reports/sales?date=YYYY-MM-DD` |
| `getSettings()` / `updateSettings(patch)` | `GET` / `PATCH /api/settings` |

Error codes: `VALIDATION` (400/422, with `fields`), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `CONFLICT` (409, e.g. table taken / item unavailable), `INVALID_STATE` (409, bad status move), `STORAGE`.

### Status flow

`new → preparing → ready → served` (`cancelled` allowed before served; one step back allowed so a mis-tap can be undone). Payment is separate (`paymentStatus: unpaid | paid`).
Table side effects: dine-in order created → table `occupied`; order `served` → `billing_pending`; `settlePayment` → `available`; cancelled → `available`.

### JSON data models

**MenuItem**
```json
{
  "id": "m_smash",
  "name": "Angaar Smash Burger",
  "category": "Burgers",
  "description": "Double-seared beef patty, cheddar, house angaar sauce.",
  "basePrice": 650,
  "available": true,
  "emoji": "🍔",
  "variants": [{ "id": "double", "name": "Double", "priceDelta": 250 }],
  "addOns": [{ "id": "cheese", "name": "Extra Cheese", "price": 80 }]
}
```
`category` ∈ `Burgers | Pizzas | Drinks | Desserts | Deals`.

**CreateOrder request** (`POST /api/orders`): no prices are sent
```json
{
  "type": "dine-in",
  "tableId": "t_4",
  "customer": null,
  "items": [
    { "menuItemId": "m_smash", "variantId": "double", "addOnIds": ["cheese"], "quantity": 2, "notes": "No onions" }
  ],
  "promoCode": "ANGAAR10"
}
```
`type` ∈ `dine-in | takeaway | delivery`. Dine-in requires `tableId`. Delivery requires `customer: { name, phone, address }`. Takeaway may include an optional `customer`.

**Order** (response)
```json
{
  "id": "ORD-1001",
  "type": "dine-in",
  "tableId": "t_4",
  "tableNumber": 4,
  "customer": null,
  "items": [{
    "lineId": "ln_ab12cd",
    "menuItemId": "m_smash",
    "name": "Angaar Smash Burger",
    "variant": { "id": "double", "name": "Double", "priceDelta": 250 },
    "addOns": [{ "id": "cheese", "name": "Extra Cheese", "price": 80 }],
    "quantity": 2,
    "notes": "No onions",
    "unitPrice": 980,
    "lineTotal": 1960
  }],
  "notes": "",
  "promoCode": "ANGAAR10",
  "subtotal": 2110,
  "discount": 211,
  "taxRate": 0.13,
  "tax": 247,
  "deliveryFee": 0,
  "total": 2146,
  "status": "new",
  "paymentStatus": "unpaid",
  "payment": null,
  "createdBy": "Ayesha (Cashier)",
  "createdAt": "2026-11-25T13:10:00.000Z",
  "preparingAt": null,
  "readyAt": null,
  "servedAt": null,
  "cancelledAt": null
}
```
Total = `(subtotal − discount) + round((subtotal − discount) × taxRate) + deliveryFee`. `status` ∈ `new | preparing | ready | served | cancelled`. The KDS timer is `now − createdAt` (server timestamp).

**Update status** `PATCH /api/orders/:id/status` → `{ "status": "preparing" }` → returns the updated Order.

**Settle payment** `POST /api/orders/:id/payment`
```json
{ "method": "cash", "amountTendered": 2500 }
```
→ Order with `paymentStatus: "paid"` and
```json
"payment": { "method": "cash", "amountTendered": 2500, "change": 354, "paidAt": "2026-11-25T13:40:00.000Z" }
```
`method` ∈ `cash | card | online`. `amountTendered` only matters for cash.

**Table**
```json
{ "id": "t_4", "number": 4, "capacity": 4, "status": "occupied", "currentOrderId": "ORD-1001" }
```
`status` ∈ `available | occupied | billing_pending`.

**Session / User**
```json
{ "user": { "id": "u_cashier", "username": "cashier", "name": "Ayesha (Cashier)", "role": "cashier" }, "loggedInAt": "2026-11-25T12:00:00.000Z" }
```
`role` ∈ `cashier | kitchen | manager`. The real backend should return a token as well.

**Settings**
```json
{
  "restaurantName": "ANGAAR", "tagline": "Ate & Left No Crumbs.",
  "address": "Main Boulevard, Karachi", "phone": "+92 300 0000000",
  "currency": "Rs.", "taxRate": 0.13, "deliveryFee": 150,
  "kdsWarnMinutes": 10, "kdsLateMinutes": 15
}
```

**SalesSummary** (`GET /api/reports/sales?date=YYYY-MM-DD`)
```json
{
  "date": "2026-11-25", "ordersPlaced": 12, "ordersPaid": 9, "activeOrders": 3, "cancelledOrders": 0,
  "revenue": 18450, "avgOrderValue": 2050, "discounts": 640, "tax": 2100,
  "byPaymentMethod": { "cash": 9000, "card": 6000, "online": 3450 },
  "byOrderType": { "dine-in": 11000, "takeaway": 5000, "delivery": 2450 },
  "topItems": [{ "name": "Angaar Smash Burger", "quantity": 14, "revenue": 9100 }]
}
```

## Deploying

**Vercel:** import the GitHub repo, framework preset *Vite* (build `npm run build`, output `dist`). `vercel.json` already rewrites all routes to `index.html`.
**Netlify:** build `npm run build`, publish `dist`. `public/_redirects` handles routing.

## Notes

- Demo auth is client-side only (passwords in `seed.js`). Replace with the real auth API.
- Data is stored in the browser (`localStorage`, keys prefixed `angaar:v1:`). The session is shared across tabs of the same browser.
- Reset everything from Manager → "Reset demo data".
