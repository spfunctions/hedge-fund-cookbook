import http from 'node:http'
import { run as macro } from './cookbooks/macro-regime-monitor.js'
import { run as crossVenue } from './cookbooks/cross-venue-arb-scanner.js'
import { run as electionDesk } from './cookbooks/election-policy-desk.js'
import { run as portfolioRisk } from './cookbooks/portfolio-risk-sentinel.js'
import { run as thesisReplay } from './cookbooks/thesis-replay-monitor.js'

const routes: Record<string, () => Promise<unknown>> = {
  '/cookbooks/macro': macro,
  '/cookbooks/cross-venue': crossVenue,
  '/cookbooks/election-desk': electionDesk,
  '/cookbooks/portfolio-risk': portfolioRisk,
  '/cookbooks/thesis-replay': thesisReplay,
}

const server = http.createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json')

  if (request.url === '/health') {
    response.end(JSON.stringify({ ok: true, service: 'spfunctions-hedge-fund-cookbook' }))
    return
  }

  const run = routes[request.url || '']
  if (!run) {
    response.statusCode = 404
    response.end(JSON.stringify({ error: 'not_found', routes: Object.keys(routes) }))
    return
  }

  try {
    response.end(JSON.stringify(await run(), null, 2))
  } catch (error) {
    response.statusCode = 500
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
  }
})

const port = Number(process.env.PORT || 8787)
server.listen(port, () => {
  console.log(`SimpleFunctions cookbook server listening on http://localhost:${port}`)
})
