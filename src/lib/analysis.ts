export type JsonRecord = Record<string, unknown>

export function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

export function rows(value: unknown, keys: string[] = ['items', 'markets', 'events', 'results', 'data', 'rows']): JsonRecord[] {
  if (Array.isArray(value)) return value.map(asRecord)
  const record = asRecord(value)
  for (const key of keys) {
    const candidate = record[key]
    if (Array.isArray(candidate)) return candidate.map(asRecord)
  }
  return []
}

export function pickString(record: JsonRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return fallback
}

export function pickNumber(record: JsonRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return fallback
}

export function topRows(value: unknown, limit: number, keys?: string[]): JsonRecord[] {
  return rows(value, keys).slice(0, limit)
}

export function severity(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 85) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 35) return 'medium'
  return 'low'
}

export function marketLabel(row: JsonRecord): string {
  return pickString(row, ['title', 'question', 'name', 'ticker', 'kalshiTicker', 'marketTicker'], 'unknown')
}

export function compactMarket(row: JsonRecord): JsonRecord {
  return {
    label: marketLabel(row),
    ticker: pickString(row, ['ticker', 'kalshiTicker', 'marketTicker']),
    probability: pickNumber(row, ['probability', 'prob', 'yesPrice', 'lastPrice'], NaN),
    volume: pickNumber(row, ['volume', 'volume24h', 'liquidity'], NaN),
    regime: pickString(row, ['regime', 'regimeLabel', 'label']),
    catalyst: pickString(row, ['catalyst', 'event', 'date']),
  }
}

export function compactInspection(value: unknown): JsonRecord | null {
  const record = asRecord(value)
  if (!Object.keys(record).length) return null
  const indicators = asRecord(record.indicators)
  const regime = asRecord(record.regime)
  return removeEmpty({
    ticker: pickString(record, ['ticker', 'marketTicker']),
    title: pickString(record, ['title', 'question', 'name']),
    venue: pickString(record, ['venue']),
    price: pickNumber(record, ['price', 'probability', 'yesPrice'], NaN),
    spread: pickNumber(record, ['spread'], NaN),
    volume24h: pickNumber(record, ['volume24h'], NaN),
    openInterest: pickNumber(record, ['openInterest'], NaN),
    status: pickString(record, ['status']),
    closeTime: pickString(record, ['closeTime', 'endTime']),
    liquidityScore: pickString(record, ['liquidityScore']),
    regime: pickString(regime, ['label']),
    hasThesis: indicators.hasThesis,
    hasOrderbook: indicators.hasOrderbook,
    connectedMarkets: rows(record.contagion).length,
  })
}

export function compactCurve(value: unknown): JsonRecord {
  const record = asRecord(value)
  const points = rows(record.points)
  return removeEmpty({
    eventBase: pickString(record, ['eventBase', 'series', 'name']),
    venue: pickString(record, ['venue']),
    pointCount: pickNumber(record, ['pointCount', 'returnedPointCount'], points.length),
    distinctTenorCount: pickNumber(record, ['distinctTenorCount'], NaN),
    totalVolume24h: pickNumber(record, ['totalVolume24h'], NaN),
    firstMarketTitle: pickString(record, ['firstMarketTitle']),
    samplePoints: points.slice(0, 5).map(point => removeEmpty({
      ticker: pickString(point, ['ticker']),
      tenorDays: pickNumber(point, ['tenorDays'], NaN),
      probability: pickNumber(point, ['yesProbability', 'probability'], NaN),
      volume24h: pickNumber(point, ['volume24h'], NaN),
      closeTime: pickString(point, ['closeTime']),
    })),
  })
}

export function compactSignal(value: unknown): JsonRecord {
  const record = asRecord(value)
  const body = asRecord(record.body)
  return removeEmpty({
    id: pickString(record, ['id']),
    rank: pickNumber(record, ['rank'], NaN),
    type: pickString(record, ['type']),
    label: pickString(record, ['label', 'title', 'name']),
    ticker: pickString(body, ['ticker', 'triggerTicker', 'laggingTicker']),
    theme: pickString(body, ['theme', 'driver', 'primaryMover']),
    price: pickNumber(body, ['price', 'impliedProbability'], NaN),
    gap: pickNumber(body, ['gap', 'range', 'dispersion'], NaN),
  })
}

export function removeEmpty(record: JsonRecord): JsonRecord {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === '' || value === null || value === undefined) return false
      if (typeof value === 'number' && Number.isNaN(value)) return false
      return true
    }),
  )
}

export function decisionQueue(items: JsonRecord[], limit = 8): JsonRecord[] {
  return items.slice(0, limit).map((item, index) => {
    const probability = pickNumber(item, ['probability', 'prob', 'yesPrice', 'lastPrice'], 0)
    const volume = pickNumber(item, ['volume', 'volume24h', 'liquidity'], 0)
    const score = Math.min(100, Math.round((100 - Math.abs(50 - probability)) * 0.55 + Math.log10(volume + 10) * 12 + (limit - index)))
    return removeEmpty({
      rank: index + 1,
      severity: severity(score),
      score,
      ...compactMarket(item),
    })
  })
}
