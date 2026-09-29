# API Contracts

Generated shared source contract between the server and mobile app.

The server owns the C# DTOs and exposes `openapi.json`. This package uses
`openapi-typescript` to generate TypeScript contract types from that document.

Edit `src/index.ts` when DailyNagger needs friendlier type aliases. Do not edit
`src/schema.ts` by hand.

When server contracts change, refresh `openapi.json` from the server's
Development `/openapi/v1.json` endpoint, then run `npm run contracts:generate`
from the repo root. The CI API-contracts job compares the committed OpenAPI with
the current server response and verifies that regenerating `src/schema.ts`
produces no changes.
