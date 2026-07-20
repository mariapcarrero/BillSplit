# Bill Split Pro

Split a bill, settle up with the minimum number of transfers, and share the
result via a link — no account, no database.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling, **lucide-react** for icons
- **Zod** for schema validation at every API boundary
- **Vitest** + **React Testing Library** for tests
- **OpenAI** (`gpt-4o-mini`, structured outputs) to parse a natural-language
  bill description into line items

## How it works

- Bill state lives entirely on the client (`useReducer`), no server session.
- `POST /api/settle` computes balances and a minimized set of transfers
  (greedy debt simplification) from a Zod-validated bill payload — pure,
  unit-tested logic in [`lib/settle.ts`](lib/settle.ts).
- `POST /api/ai-parse` turns free text like *"Ana paid $40 for pizza, split
  with Leo"* into structured items using OpenAI structured outputs, validated
  against the same Zod schema as manual input.
- "Copy share link" encodes the whole bill as a base64url token in the URL
  (`lib/share.ts`) — `/s/[token]` decodes and renders it server-side, with
  zero backend storage.

```
app/
  page.tsx              editor entry point
  s/[token]/page.tsx     read-only shared view (server component)
  api/settle/route.ts    settle-up Route Handler
  api/ai-parse/route.ts  AI parsing Route Handler
components/               BillEditor, PersonList, BillForm, Results, ShareButton
lib/
  types.ts / schema.ts    domain types + Zod schemas
  settle.ts               pure settle-up algorithm
  share.ts                URL token encode/decode
  billReducer.ts          client-side bill state machine
tests/settle.test.ts       unit tests for the settle-up logic
```

## Getting started

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY to enable AI parsing
npm run dev
```

The app works fully without `OPENAI_API_KEY` — only the "Parse with AI" input
is disabled server-side; manual bill entry is unaffected.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run lint     # eslint
npm run test     # vitest (single run)
npm run format   # prettier --write
```
