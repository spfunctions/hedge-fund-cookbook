import { SimpleFunctions } from '@spfunctions/sdk'
import { FileTraceStore, SimpleFunctionsAgent } from '@spfunctions/agent'

export function getApiKey(): string | undefined {
  return process.env.SF_API_KEY || process.env.SIMPLEFUNCTIONS_API_KEY
}

export function getBaseUrl(): string {
  return process.env.SF_API_URL || 'https://simplefunctions.dev'
}

export function createClient(): SimpleFunctions {
  return new SimpleFunctions({
    baseUrl: getBaseUrl(),
    apiKey: getApiKey(),
  })
}

export function requireApiKey(): string {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('SF_API_KEY is required for this cookbook. Copy .env.example and export the key in your shell.')
  }
  return apiKey
}

export function createReadOnlyAgent(options: { tracePath?: string } = {}): SimpleFunctionsAgent {
  requireApiKey()
  return new SimpleFunctionsAgent({
    client: createClient(),
    policy: {
      maxSideEffect: 'none',
      maxCostEffect: 'venue_request_cost',
    },
    ...(options.tracePath ? { trace: new FileTraceStore(options.tracePath) } : {}),
  })
}

export function compactList<T>(items: T[] | undefined, limit = 5): T[] {
  return Array.isArray(items) ? items.slice(0, limit) : []
}
