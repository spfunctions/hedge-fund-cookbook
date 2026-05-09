import { createClient, requireApiKey, compactList } from '../lib/simplefunctions.js'
import { arrayField, intelligence } from '../lib/intelligence.js'
import { asRecord, decisionQueue, marketLabel, pickString } from '../lib/analysis.js'
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

  const searchRows = arrayField(markets.markets || markets.results || markets.items).map(asRecord)
  const screenedRows = arrayField(screen.markets || screen.results).map(asRecord)

  return {
    useCase: 'election-policy-desk',
    audience: 'policy research desk, election office, legislative monitoring team, or macro PM',
    objective: 'Turn public political catalysts into a disciplined briefing queue with market and policy context.',
    briefingQueue: decisionQueue([...screenedRows, ...searchRows], 12),
    calendar: compactList(arrayField(calendar.events), 12).map(asRecord).map(event => ({
      label: marketLabel(event),
      date: pickString(event, ['date', 'start', 'time']),
      category: pickString(event, ['category', 'type']),
    })),
    policyContext,
    reviewProtocol: [
      'Separate market-implied repricing from internal legal or policy judgment.',
      'Escalate only when a catalyst touches a live book, client exposure, or public-communications plan.',
      'Keep a copy of the policyContext response with source timestamp for auditability.',
    ],
  }
}

void runIfMain(import.meta.url, run)
