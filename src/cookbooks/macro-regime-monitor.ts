import { createClient, requireApiKey, compactList } from '../lib/simplefunctions.js'
import { arrayField, intelligence } from '../lib/intelligence.js'
import { asRecord, pickNumber, pickString, decisionQueue, compactCurve, compactSignal } from '../lib/analysis.js'
import { runIfMain } from '../lib/run.js'

export async function run() {
  requireApiKey()
  const sf = createClient()

  const [world, index, indexHistory, regime, yieldCurves, calendar] = await Promise.all([
    sf.world.get(),
    intelligence.index(),
    intelligence.indexHistory({ days: 30 }),
    intelligence.regime({ label: 'toxic', limit: 8 }),
    intelligence.yieldCurves({ limit: 12 }),
    intelligence.calendar({ days: 14, category: 'Economic Data' }),
  ])

  const indexRecord = asRecord(index)
  const regimeMarkets = arrayField(regime.markets || regime.results)
  const catalysts = arrayField(calendar.events)
  const stressScore = Math.min(100, Math.round(
    pickNumber(indexRecord, ['geoRisk'], 0) * 0.35
      + pickNumber(indexRecord, ['disagreement'], 0) * 0.3
      + pickNumber(indexRecord, ['breadth'], 0) * 0.2
      + regimeMarkets.length * 2,
  ))

  return {
    useCase: 'macro-regime-monitor',
    audience: 'global macro PM, risk committee, or CIO morning meeting',
    asOf: world.asOf,
    decision: {
      stressScore,
      meetingMode: stressScore >= 65 ? 'risk-review' : 'normal-monitoring',
      primaryQuestion: 'Are prediction markets repricing macro regime, policy, or liquidity risk faster than internal books?',
    },
    globalState: {
      regime: world.regime?.label || world.regimeSummary || null,
      baselineReason: world.baselineReason,
      salient: compactList(world.salient, 8).map(compactSignal),
    },
    sfIndex: {
      disagreement: pickNumber(indexRecord, ['disagreement']),
      breadth: pickNumber(indexRecord, ['breadth']),
      geoRisk: pickNumber(indexRecord, ['geoRisk']),
      activity: pickNumber(indexRecord, ['activity']),
      historySample: compactList(arrayField(indexHistory.history || indexHistory.data || indexHistory.points), 5),
    },
    curveWatch: compactList(arrayField(yieldCurves.curves || yieldCurves.rows || yieldCurves.data), 8).map(compactCurve),
    toxicRegimeQueue: decisionQueue(regimeMarkets.map(asRecord), 8),
    catalystCalendar: compactList(catalysts, 8).map(asRecord).map(event => ({
      label: pickString(event, ['title', 'name', 'event']),
      date: pickString(event, ['date', 'start', 'time']),
      category: pickString(event, ['category', 'type']),
    })),
    handoff: [
      'Route stressScore >= 65 to a PM/risk review queue.',
      'Join toxicRegimeQueue with internal exposure by theme, country, and asset class.',
      'Archive this JSON with the morning risk packet for later replay.',
    ],
  }
}

void runIfMain(import.meta.url, run)
