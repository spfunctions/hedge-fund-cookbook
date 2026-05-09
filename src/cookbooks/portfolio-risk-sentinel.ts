import { createClient, requireApiKey, compactList } from '../lib/simplefunctions.js'
import { runIfMain } from '../lib/run.js'

function pageItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
    return (value as { data: unknown[] }).data
  }
  return []
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

  return {
    useCase: 'portfolio-risk-sentinel',
    portfolio,
    recentTicks: compactList(pageItems(ticks), 10),
    recentTrades: compactList(pageItems(trades), 10),
    watchlists,
    alerts,
    nextStep: 'Join this output with your internal limits and send only policy-approved alerts to downstream systems.',
  }
}

void runIfMain(import.meta.url, run)
