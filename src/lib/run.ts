import { pathToFileURL } from 'node:url'

export function isMain(metaUrl: string): boolean {
  return Boolean(process.argv[1]) && metaUrl === pathToFileURL(process.argv[1]).href
}

export async function runIfMain(metaUrl: string, run: () => Promise<unknown>): Promise<void> {
  if (!isMain(metaUrl)) return
  try {
    const result = await run()
    if (result !== undefined) {
      console.log(JSON.stringify(result, null, 2))
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
