import { MissingApiKeyError, SimpleFunctions } from '@spfunctions/sdk'
import { SimpleFunctionsAgent } from '@spfunctions/agent'
import { getApiKey, getBaseUrl } from './lib/simplefunctions.js'

const originalSfKey = process.env.SF_API_KEY
const originalSimpleFunctionsKey = process.env.SIMPLEFUNCTIONS_API_KEY
delete process.env.SF_API_KEY
delete process.env.SIMPLEFUNCTIONS_API_KEY

const noKey = new SimpleFunctions({ baseUrl: getBaseUrl() })
const inspectOnly = new SimpleFunctionsAgent({ client: noKey, mode: 'inspectOnly' })
const worldContract = await inspectOnly.describe('world.read')

if (!worldContract) {
  throw new Error('world.read contract missing')
}

try {
  new SimpleFunctionsAgent({ client: noKey })
  throw new Error('live no-key Agent constructor unexpectedly succeeded')
} catch (error) {
  if (!(error instanceof MissingApiKeyError)) throw error
}

if (originalSfKey) process.env.SF_API_KEY = originalSfKey
if (originalSimpleFunctionsKey) process.env.SIMPLEFUNCTIONS_API_KEY = originalSimpleFunctionsKey

if (!getApiKey()) {
  console.log(JSON.stringify({ ok: true, live: 'skipped', reason: 'SF_API_KEY not set' }, null, 2))
  process.exit(0)
}

const keyed = new SimpleFunctions({ baseUrl: getBaseUrl(), apiKey: getApiKey() })
const world = await keyed.world.get()

console.log(JSON.stringify({
  ok: true,
  live: 'world.read',
  asOf: world.asOf,
  salientCount: world.salient?.length ?? 0,
}, null, 2))
