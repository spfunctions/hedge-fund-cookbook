# SimpleFunctions Hedge Fund Cookbook

Self-hostable TypeScript examples for building market-intelligence applications with `@spfunctions/sdk` and `@spfunctions/agent`.

These examples are intentionally read-first. They do not place trades, do not expose browser API keys, and do not require SimpleFunctions-hosted runtime state. Run them from your own server, job runner, notebook host, or agent harness with a SimpleFunctions API key.

## Install

```bash
npm install
cp .env.example .env.local
export SF_API_KEY="sf_live_..."
```

The published alpha packages are pinned in `package.json`:

```bash
npm install @spfunctions/sdk@0.1.0-alpha.0 @spfunctions/agent@0.1.0-alpha.0
```

Some examples use `src/lib/intelligence.ts` for newly promoted intelligence endpoints until the next SDK alpha ships `sf.intelligence.*` publicly. The helper is intentionally small: authenticated `fetch`, no state, no browser keys.

## Cookbooks

| Script | Use case | Primary SimpleFunctions surfaces |
| --- | --- | --- |
| `npm run macro` | Macro regime monitor for a PM or risk team | `world.read`, `index.current`, `regime.scan`, `calendar.list` |
| `npm run cross-venue` | Cross-venue arb and divergence queue | `crossvenue.pairs`, `crossvenue.stats`, `market.inspect` |
| `npm run election-desk` | Election or policy-office event desk | `calendar.list`, `markets.search`, `markets.screen`, `gov.query` |
| `npm run portfolio-risk` | Portfolio and watchlist sentinel | `portfolio.*`, `watchlists.list`, `alerts.list` |
| `npm run thesis-replay` | Thesis monitor with trace/replay | `theses.*`, `SimpleFunctionsAgent`, `FileTraceStore` |

## Smoke

```bash
npm run typecheck
npm run smoke
```

Without `SF_API_KEY`, `npm run smoke` verifies package imports and exits cleanly after the no-key checks. With a key, it runs a small production-backed `world.read` call.

## Serve On Your Own Infra

```bash
npm run server
curl http://localhost:8787/health
curl http://localhost:8787/cookbooks/macro
```

The server is intentionally minimal and uses Node's built-in HTTP server. In production, put the same cookbook functions behind your own auth, queue, scheduler, or internal dashboard.

## Boundaries

- No live trading.
- No browser long-lived API key usage.
- No venue order placement.
- No dependency on the `sf` CLI.
- Agent SDK calls use canonical strict tools from `/api/contracts/tools`, not broad `/api/tools` aliases.
- Cross-venue and screening outputs are research signals. They are not investment advice or execution instructions.
