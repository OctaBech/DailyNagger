# API Contracts

Generated shared source contract between the server and mobile app.

The server owns the C# DTOs and exposes `openapi.json`. This package uses
`openapi-typescript` to generate TypeScript contract types from that document.

Edit `src/index.ts` when DailyNagger needs friendlier type aliases. Do not edit
`src/schema.ts` by hand.
