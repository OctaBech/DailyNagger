# API Contracts

Generated shared source contract between the server and mobile app.

The server owns the C# DTOs and exposes `openapi.json`. This package uses
`openapi-typescript` to generate TypeScript contract types from that document.

Edit `src/index.ts` when DailyNagger needs friendlier type aliases. Do not edit
`src/schema.ts` by hand.

When server contracts change, run the API locally and then run
`npm run contracts:update` from the repo root. This fetches `/openapi/v1.json`
and regenerates `src/schema.ts`.

Use `npm run contracts:check` to verify that `src/schema.ts` is current. The
check compares the generated file before and after generation by content hash, so
it still works when other contract files are already modified.
