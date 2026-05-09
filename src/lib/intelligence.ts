import { getApiKey, getBaseUrl } from './simplefunctions.js'

type QueryValue = string | number | boolean | undefined | null

function buildUrl(path: string, params: Record<string, QueryValue> = {}): string {
  const url = new URL(path, getBaseUrl())
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

export async function readJson<T>(path: string, params: Record<string, QueryValue> = {}): Promise<T> {
  const apiKey = getApiKey()
  const response = await fetch(buildUrl(path, params), {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`${path} failed with ${response.status}: ${body.slice(0, 200)}`)
  }
  return response.json() as Promise<T>
}

export const intelligence = {
  screen: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/screen', params),
  regime: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/regime/scan', params),
  calendar: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/calendar', params),
  index: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/index', params),
  crossVenuePairs: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/cross-venue/pairs', params),
  crossVenueStats: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/cross-venue/stats', params),
}

export function arrayField(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
