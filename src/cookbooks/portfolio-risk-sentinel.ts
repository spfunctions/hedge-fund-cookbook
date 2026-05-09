import { createClient, requireApiKey, compactList } from '../lib/simplefunctions.js'
import { asRecord, compactSignal, pickNumber, pickString, removeEmpty, topRows } from '../lib/analysis.js'
import { runIfMain } from '../lib/run.js'

function pageItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
    return (value as { data: unknown[] }).data
  }
  return []
}

function compactPortfolioState(value: unknown) {
  const state = asRecord(value)
  return removeEmpty({
    kalshiBalanceCents: pickNumber(state, ['kalshiBalanceCents'], NaN),
    kalshiPortfolioValueCents: pickNumber(state, ['kalshiPortfolioValueCents'], NaN),
    totalExposureCents: pickNumber(state, ['totalExposureCents'], NaN),
    openPositionCount: pickNumber(state, ['openPositionCount'], NaN),
    dailyRealizedPnlCents: pickNumber(state, ['dailyRealizedPnlCents'], NaN),
    totalUnrealizedPnlCents: pickNumber(state, ['totalUnrealizedPnlCents'], NaN),
    maxDrawdownCents: pickNumber(state, ['maxDrawdownCents'], NaN),
    lastTickAt: pickString(state, ['lastTickAt']),
    lastReconcileAt: pickString(state, ['lastReconcileAt']),
    lastReconcileStatus: pickString(state, ['lastReconcileStatus']),
  })
}

function compactActivity(row: Record<string, unknown>) {
  return removeEmpty({
    id: pickString(row, ['id', 'tradeId', 'tickId']),
    ticker: pickString(row, ['ticker', 'marketTicker', 'symbol']),
    side: pickString(row, ['side', 'direction']),
    status: pickString(row, ['status']),
    quantity: pickNumber(row, ['quantity', 'contracts'], NaN),
    price: pickNumber(row, ['price', 'priceCents', 'avgPriceCents'], NaN),
    exposureCents: pickNumber(row, ['exposureCents', 'notionalCents'], NaN),
    pnlCents: pickNumber(row, ['pnlCents', 'realizedPnlCents', 'unrealizedPnlCents'], NaN),
    capturedAt: pickString(row, ['capturedAt', 'createdAt', 'updatedAt']),
  })
}

export async function run() {
  requireApiKey()
  const sf = createClient()

  const [portfolio, ticks, trades, watchlists, alerts] = await Promise.all([
    sf.portfolio.state(),
    sf.portfolio.ticks.list({ limit: 10, envelope: true }),
    sf.portfolio.trades.list({ limit: 10, envelope: true }),
    sf.watchlists.list(),
    sf.alerts.list(),
  ])

  const world = await sf.world.get()
  const recentTicks = pageItems(ticks).map(asRecord)
  const recentTrades = pageItems(trades).map(asRecord)
  const watchlistsRecord = asRecord(watchlists)
  const alertsRecord = asRecord(alerts)
  const watchlistObjects = watchlistsRecord.objects
  const alertRules = alertsRecord.rules

  return {
    useCase: 'portfolio-risk-sentinel',
    audience: 'portfolio risk, treasury, or internal control room',
    objective: 'Join account-specific state with world context before producing any downstream alert.',
    worldContext: {
      asOf: world.asOf,
      regime: world.regime?.label || world.regimeSummary || null,
      salient: compactList(world.salient, 6).map(compactSignal),
    },
    portfolioState: compactPortfolioState(portfolio),
    recentTicks: compactList(recentTicks, 10).map(compactActivity),
    recentTrades: compactList(recentTrades, 10).map(compactActivity),
    watchlists: {
      count: pageItems(watchlists).length || (Array.isArray(watchlistObjects) ? watchlistObjects.length : 0),
      sample: compactList(pageItems(watchlists).map(asRecord), 5).map(row => removeEmpty({
        id: pickString(row, ['id']),
        name: pickString(row, ['name', 'title']),
        createdAt: pickString(row, ['createdAt']),
      })),
    },
    alerts: {
      count: pageItems(alerts).length || (Array.isArray(alertRules) ? alertRules.length : 0),
      sample: compactList(pageItems(alerts).map(asRecord), 5).map(row => removeEmpty({
        id: pickString(row, ['id']),
        name: pickString(row, ['name', 'title']),
        status: pickString(row, ['status']),
      })),
    },
    escalationCandidates: topRows([...recentTicks, ...recentTrades], 8).map(row => ({
      label: pickString(row, ['ticker', 'marketTicker', 'symbol', 'id'], 'unknown'),
      reason: pickString(row, ['reason', 'event', 'side', 'status'], 'recent portfolio activity'),
      activity: compactActivity(row),
    })),
    controlPlane: [
      'Do not send every tick to humans. Join this payload with internal exposure limits first.',
      'Use the watchlist and alert IDs as routing keys for your own entitlement system.',
      'Archive the raw JSON payload with the alert decision so replay can explain why a notification fired.',
    ],
  }
}

void runIfMain(import.meta.url, run)
