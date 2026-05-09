import { createClient, requireApiKey, compactList } from '../lib/simplefunctions.js'
import { arrayField, intelligence } from '../lib/intelligence.js'
import { runIfMain } from '../lib/run.js'

export async function run() {
  requireApiKey()
  const sf = createClient()

  const [pairs, stats] = await Promise.all([
    intelligence.crossVenuePairs({ preset: 'arb', limit: 12, nextActions: 'off' }),
    intelligence.crossVenueStats({ nextActions: 'off' }),
  ])

  const pairRows = arrayField(pairs.pairs)
  const firstTicker = pairRows[0] && typeof pairRows[0] === 'object'
    ? String((pairRows[0] as Record<string, unknown>).kalshiTicker || '')
    : ''
  const inspection = firstTicker ? await sf.markets.get(firstTicker).catch(error => ({ error: String(error) })) : null

  return {
    useCase: 'cross-venue-arb-scanner',
    generatedAt: pairs.generatedAt,
    totalPairs: pairs.total,
    coverage: {
      totalPairs: stats.totalPairs,
      lastBuiltAt: stats.lastBuiltAt,
    },
    candidatePairs: compactList(pairRows, 12),
    firstCandidateInspection: inspection,
    guardrail: 'This is a research queue only. Add your own execution, compliance, and venue-risk gates before any trading workflow.',
  }
}

void runIfMain(import.meta.url, run)
