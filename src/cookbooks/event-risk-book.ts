import { createClient, requireApiKey, compactList } from '../lib/simplefunctions.js'
import { arrayField, intelligence } from '../lib/intelligence.js'
import { asRecord, compactInspection, decisionQueue, marketLabel, pickString } from '../lib/analysis.js'
import { runIfMain } from '../lib/run.js'

const DEFAULT_THEMES = [
  'oil geopolitics energy shipping',
  'central bank rates inflation recession',
  'election policy tariff shutdown',
]

async function inspectFirstCandidate(sf: ReturnType<typeof createClient>, candidates: Record<string, unknown>[]) {
  const ticker = candidates
    .map(candidate => pickString(candidate, ['ticker', 'kalshiTicker', 'marketTicker']))
    .find(Boolean)

  if (!ticker) return null
  return sf.markets.get(ticker).catch(error => ({
    error: error instanceof Error ? error.message : String(error),
    ticker,
  }))
}

export async function run() {
  requireApiKey()
  const sf = createClient()

  const [screen, regime, calendar, contagion, thematicSearches] = await Promise.all([
    intelligence.screen({ category: 'Economics', limit: 20, nextActions: 'off' }),
    intelligence.regime({ limit: 12 }),
    intelligence.calendar({ days: 21, category: 'Economic Data' }),
    intelligence.contagion({ limit: 12, depth: 'false' }),
    Promise.all(DEFAULT_THEMES.map(query => sf.markets.search({ query, limit: 8 }).catch(error => ({ error, query })))),
  ])

  const screenRows = arrayField(screen.markets || screen.results).map(asRecord)
  const regimeRows = arrayField(regime.markets || regime.results).map(asRecord)
  const candidates = decisionQueue([...screenRows, ...regimeRows], 12)
  const firstCandidateInspection = await inspectFirstCandidate(sf, candidates)

  return {
    useCase: 'event-risk-book',
    audience: 'multi-strategy research desk, event-risk pod, or portfolio risk group',
    objective: 'Build a daily event-risk queue from public market repricing, regime labels, catalysts, and contagion signals.',
    watchlist: {
      candidateCount: candidates.length,
      candidates,
      firstCandidateInspection: compactInspection(firstCandidateInspection),
    },
    catalystMap: compactList(arrayField(calendar.events), 12).map(asRecord).map(event => ({
      label: marketLabel(event),
      date: pickString(event, ['date', 'start', 'time']),
      category: pickString(event, ['category', 'type']),
    })),
    contagion: compactList(arrayField(contagion.highlights || contagion.markets || contagion.results), 8),
    thematicSearches: DEFAULT_THEMES.map((theme, index) => ({
      theme,
      results: compactList(arrayField(asRecord(thematicSearches[index]).markets || asRecord(thematicSearches[index]).results), 5),
    })),
    operatingModel: [
      'Use this as a queue, not an execution signal.',
      'Require a human or internal policy engine before sizing, hedging, or alert escalation.',
      'Persist the payload so later thesis reviews can compare what was visible at decision time.',
    ],
  }
}

void runIfMain(import.meta.url, run)
