import { createClient, requireApiKey, compactList } from '../lib/simplefunctions.js'
import { arrayField, intelligence } from '../lib/intelligence.js'
import { runIfMain } from '../lib/run.js'

export async function run() {
  requireApiKey()
  const sf = createClient()

  const [world, index, regime, calendar] = await Promise.all([
    sf.world.get(),
    intelligence.index(),
    intelligence.regime({ label: 'toxic', limit: 8 }),
    intelligence.calendar({ days: 14, category: 'Economic Data' }),
  ])

  return {
    useCase: 'macro-regime-monitor',
    asOf: world.asOf,
    regime: world.regime?.label || world.regimeSummary || null,
    sfIndex: {
      disagreement: index.disagreement,
      breadth: index.breadth,
      geoRisk: index.geoRisk,
      activity: index.activity,
    },
    toxicRegimeMarkets: compactList(arrayField(regime.markets || regime.results), 8),
    upcomingCatalysts: compactList(arrayField(calendar.events), 8),
    nextStep: 'Send this payload to your internal PM/risk model and route exceptions to Slack, PagerDuty, or an internal dashboard.',
  }
}

void runIfMain(import.meta.url, run)
