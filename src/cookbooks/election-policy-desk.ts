import { createClient, requireApiKey, compactList } from '../lib/simplefunctions.js'
import { arrayField, intelligence } from '../lib/intelligence.js'
import { runIfMain } from '../lib/run.js'

export async function run() {
  requireApiKey()
  const sf = createClient()

  const [calendar, markets, screen, policyContext] = await Promise.all([
    intelligence.calendar({ days: 30 }),
    sf.markets.search({ query: 'election policy tariff shutdown', limit: 10 }),
    intelligence.screen({ category: 'Politics', limit: 10, nextActions: 'off' }),
    sf.gov.query({ q: 'What policy catalysts could move US election and tariff prediction markets this month?', mode: 'raw' }),
  ])

  return {
    useCase: 'election-policy-desk',
    upcomingEvents: compactList(arrayField(calendar.events), 10),
    searchedMarkets: markets.markets || markets.results || markets.items || [],
    screenedPolitics: compactList(arrayField(screen.markets), 10),
    policyContext,
    nextStep: 'Use this as a morning briefing payload for an election office, policy desk, or legislative-monitoring agent.',
  }
}

void runIfMain(import.meta.url, run)
