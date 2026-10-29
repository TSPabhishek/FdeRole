# Stockwise Order Allocation Workbench

A local React + Vite proof of concept for a B2B electrical-products distributor reviewing stock against competing customer orders. The fictional sample catalog includes miniature circuit breakers, copper cable, LED downlights, and isolators, with both surplus stock and genuine shortages.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Run the allocation-engine unit tests with:

```bash
npm test
```

Create a production build with `npm run build`.

## Build and deploy with Docker

Build the production image from this directory:

```bash
docker build -t stockwise-workbench .
```

Run it locally on port 8080:

```bash
docker run --rm -p 8080:8080 stockwise-workbench
```

Open `http://localhost:8080`. The image builds the Vite app in a Node stage and serves its static output with Nginx. The container listens on port `8080`, supports SPA route fallback, and exposes `/healthz` for container health checks.

## Allocation policy

Orders are ranked deterministically by:

1. Priority: critical, high, then standard.
2. Customer tier: strategic, growth, then standard.
3. Earlier due date.
4. Order ID, alphabetically, as the final tie-breaker.

The engine allocates in that order, never exceeding stock or an order's requested quantity. It can partially fulfill the first order that does not fit in the remaining stock. User-edited quantities are pinned first; the remaining stock is reallocated to other orders using the ranking above. Reset clears manual edits and restores the sample priorities.

This greedy policy is transparent but does not optimize order value, distribute shortages proportionally, model replenishment, or replace review of customer agreements. Manual allocation edits are compared with the original recommendation and the explanation identifies other orders whose quantities changed. All customer and inventory information is fictional sample data.

## Project layout

- `src/components/` — header, product selector, summary cards, orders table, and allocation explanation.
- `src/data/sampleData.js` — fictional electrical-product and customer order records.
- `src/utils/allocationEngine.js` — deterministic and validated allocation logic.
- `src/utils/allocationEngine.test.js` — unit tests using Node's built-in test runner.
