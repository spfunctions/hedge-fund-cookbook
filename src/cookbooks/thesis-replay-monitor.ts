import { FileTraceStore, ReplayMissError, SimpleFunctionsAgent } from '@spfunctions/agent'
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
  const tracePath = './thesis-monitor.trace.jsonl'
  const trace = new FileTraceStore(tracePath)

  const theses = await sf.theses.list({ limit: 5 })

  const live = new SimpleFunctionsAgent({
    client: sf,
    policy: { maxSideEffect: 'none', maxCostEffect: 'api_cost' },
    trace,
  })

  const liveWorld = await live.tools.world.read({})
  const liveManifest = await live.tools.manifest.get({ name: 'world.read' })

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
    audience: 'research operations, compliance review, or model-risk team',
    tracePath,
    thesisCount: pageItems(theses).length,
    liveTool: liveWorld.tool,
    liveManifestTool: liveManifest.tool,
    replayTool: replayWorld.tool,
    replayMiss,
    auditPacket: {
      replayInvariant: replayMiss === 'ReplayMissError' ? 'miss_did_not_call_live' : 'unexpected',
      redactionPolicy: ['apiKey', 'authorization', 'token', 'secret', 'password', 'signingSecret', 'webhookSecret'],
      sampledTheses: compactList(pageItems(theses), 5),
    },
    operatingModel: [
      'Run live under an API-keyed identity.',
      'Replay from local JSONL when reviewing decisions after the fact.',
      'Treat ReplayMissError as a hard stop, not a reason to silently call live.',
      'Never commit trace files unless they have passed your retention and redaction process.',
    ],
  }
}

void runIfMain(import.meta.url, run)
