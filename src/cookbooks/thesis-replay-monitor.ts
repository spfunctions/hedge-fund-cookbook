import { FileTraceStore, ReplayMissError, SimpleFunctionsAgent } from '@spfunctions/agent'
import { createClient, requireApiKey } from '../lib/simplefunctions.js'
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
  const tracePath = './thesis-monitor.trace.jsonl'
  const trace = new FileTraceStore(tracePath)

  const theses = await sf.theses.list({ limit: 5 })

  const live = new SimpleFunctionsAgent({
    client: sf,
    policy: { maxSideEffect: 'none', maxCostEffect: 'api_cost' },
    trace,
  })

  const liveWorld = await live.tools.world.read({})

  const replay = new SimpleFunctionsAgent({
    client: createClient(),
    mode: 'replayOnly',
    trace: new FileTraceStore(tracePath),
  })

  const replayWorld = await replay.tools.world.read({})
  let replayMiss = 'not_checked'
  try {
    await replay.tools.world.delta({ since: '1h' })
  } catch (error) {
    replayMiss = error instanceof ReplayMissError ? 'ReplayMissError' : String(error)
  }

  return {
    useCase: 'thesis-replay-monitor',
    tracePath,
    thesisCount: pageItems(theses).length,
    liveTool: liveWorld.tool,
    replayTool: replayWorld.tool,
    replayMiss,
    note: 'Trace files are local JSONL artifacts. Do not commit them.',
  }
}

void runIfMain(import.meta.url, run)
