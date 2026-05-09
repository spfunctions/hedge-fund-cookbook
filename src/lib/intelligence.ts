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
  screenByTickers: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/screen-by-tickers', params),
  regime: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/regime/scan', params),
  calendar: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/calendar', params),
  index: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/index', params),
  indexHistory: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/index/history', params),
  yieldCurves: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/yield-curves', params),
  calibration: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/calibration', params),
  contagion: (params: Record<string, QueryValue> = {}) => readJson<Record<string, unknown>>('/api/public/contagion', params),
}

export function arrayField(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
