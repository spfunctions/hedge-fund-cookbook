# SimpleFunctions Institutional Research Cookbook

Self-hostable TypeScript examples for building market-intelligence applications with `@spfunctions/sdk` and `@spfunctions/agent`.

This repo is intentionally written for institutional research, risk, and policy workflows: morning risk packs, catalyst books, election/policy desks, portfolio sentinels, and auditable thesis replay. It is not a trading bot repo. It does not place orders, does not expose browser API keys, and does not require SimpleFunctions-hosted runtime state. Run the examples from your own server, job runner, notebook host, agent harness, or internal dashboard with a SimpleFunctions API key.

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
| `npm run macro` | Global macro regime pack for a PM/risk meeting | `world.read`, `index.current`, `index.history`, `regime.scan`, `yieldcurves.list`, `calendar.list` |
| `npm run event-risk` | Event-risk book for rates, energy, geopolitics, and policy catalysts | `markets.screen`, `regime.scan`, `calendar.list`, `contagion.scan`, `market.inspect` |
| `npm run election-desk` | Policy/election desk briefing with catalyst, market, and research context | `calendar.list`, `markets.search`, `markets.screen`, `gov.query` |
| `npm run portfolio-risk` | Portfolio and watchlist sentinel with internal handoff payloads | `portfolio.*`, `watchlists.list`, `alerts.list`, `world.read` |
| `npm run thesis-replay` | Auditable thesis monitor with local trace/replay | `theses.*`, `SimpleFunctionsAgent`, `FileTraceStore` |

Each script returns structured JSON intended for downstream systems: a human briefing, a queue, a risk memo, a Slack/PagerDuty payload, or an internal web app response. The examples keep the domain decisions explicit so your own compliance, risk, and execution systems can own the final action.

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
curl http://localhost:8787/cookbooks/event-risk
```

The server is intentionally minimal and uses Node's built-in HTTP server. In production, put the same cookbook functions behind your own auth, queue, scheduler, or internal dashboard.

## Boundaries

- No live trading.
- No browser long-lived API key usage.
- No venue order placement.
- No dependency on the `sf` CLI.
- Agent SDK calls use canonical strict tools from `/api/contracts/tools`, not broad `/api/tools` aliases.
- Outputs are research signals. They are not investment advice or execution instructions.
- Use your own approvals, suitability checks, compliance retention, market-data licenses, and production observability before making any downstream decision.
