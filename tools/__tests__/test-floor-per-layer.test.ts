// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const SCRIPT = path.resolve(__dirname, '../test-floor-per-layer.sh')
const HOOK_UTILS = path.resolve(__dirname, '../hook-utils.sh')

let tmpDir: string

function run() {
  const toolsDir = path.join(tmpDir, 'tools')
  fs.mkdirSync(toolsDir, { recursive: true })
  fs.copyFileSync(HOOK_UTILS, path.join(toolsDir, 'hook-utils.sh'))
  fs.copyFileSync(SCRIPT, path.join(toolsDir, 'test-floor-per-layer.sh'))

  const result = spawnSync('bash', [path.join(toolsDir, 'test-floor-per-layer.sh')], {
    cwd: tmpDir,
    timeout: 10_000,
    encoding: 'utf-8',
  })
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

function writeJunitXml(suites: { name: string; tests: number }[]) {
  const total = suites.reduce((sum, s) => sum + s.tests, 0)
  const lines = [
    '<?xml version="1.0" encoding="UTF-8" ?>',
    `<testsuites name="vitest tests" tests="${total}">`,
  ]
  for (const s of suites) {
    lines.push(`  <testsuite name="${s.name}" tests="${s.tests}" failures="0" errors="0">`)
    lines.push('  </testsuite>')
  }
  lines.push('</testsuites>')
  fs.mkdirSync(path.join(tmpDir, 'reports'), { recursive: true })
  fs.writeFileSync(path.join(tmpDir, 'reports/unit.xml'), lines.join('\n'))
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-floor-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('test-floor-per-layer.sh', () => {
  it('passes when all layers meet their floors', () => {
    writeJunitXml([
      { name: 'src/api/client.test.ts', tests: 20 },
      { name: 'src/hooks/useSession.test.ts', tests: 10 },
      { name: 'src/features/flow-mapper/FlowMapper.test.tsx', tests: 50 },
      { name: 'src/components/Header.test.tsx', tests: 20 },
      { name: 'tools/__tests__/hooks.test.ts', tests: 100 },
    ])

    const result = run()
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toContain('all layer floors met')
  })

  it('fails when a layer is below its floor', () => {
    writeJunitXml([
      { name: 'src/api/client.test.ts', tests: 5 },
      { name: 'src/hooks/useSession.test.ts', tests: 10 },
      { name: 'src/features/flow-mapper/FlowMapper.test.tsx', tests: 50 },
      { name: 'src/components/Header.test.tsx', tests: 20 },
      { name: 'tools/__tests__/hooks.test.ts', tests: 100 },
    ])

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('src/api')
    expect(result.stderr).toContain('below floor')
  })

  it('fails when multiple layers are below their floors', () => {
    writeJunitXml([
      { name: 'src/api/client.test.ts', tests: 5 },
      { name: 'src/hooks/useSession.test.ts', tests: 2 },
      { name: 'src/features/flow-mapper/FlowMapper.test.tsx', tests: 10 },
      { name: 'src/components/Header.test.tsx', tests: 3 },
      { name: 'tools/__tests__/hooks.test.ts', tests: 20 },
    ])

    const result = run()
    expect(result.exitCode).toBe(1)
    // Should report all failing layers, not just the first
    expect(result.stderr).toContain('src/api')
    expect(result.stderr).toContain('src/hooks')
    expect(result.stderr).toContain('src/features')
    expect(result.stderr).toContain('src/components')
    expect(result.stderr).toContain('tools')
  })

  it('fails when JUnit XML is missing', () => {
    // Don't write any XML
    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('not found')
  })

  it('treats missing layers as zero tests', () => {
    // Only tools tests, no src/ layers at all
    writeJunitXml([{ name: 'tools/__tests__/hooks.test.ts', tests: 100 }])

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('src/api')
  })
})
