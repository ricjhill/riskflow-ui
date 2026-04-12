// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const SCRIPT = path.resolve(__dirname, '../validate-docs.sh')
const HOOK_UTILS = path.resolve(__dirname, '../hook-utils.sh')

let tmpDir: string

function run() {
  const toolsDir = path.join(tmpDir, 'tools')
  fs.mkdirSync(toolsDir, { recursive: true })
  fs.copyFileSync(HOOK_UTILS, path.join(toolsDir, 'hook-utils.sh'))
  fs.copyFileSync(SCRIPT, path.join(toolsDir, 'validate-docs.sh'))

  const result = spawnSync('bash', [path.join(toolsDir, 'validate-docs.sh')], {
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

function writeFile(relPath: string, content: string) {
  const full = path.join(tmpDir, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-docs-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ─── Check 1: Architecture tree ────────────────────────────────────────────

describe('architecture tree', () => {
  it('passes when all documented dirs exist', () => {
    writeFile('CLAUDE.md', `# Project\n\`\`\`\nsrc/\n  api/\n  components/\n  hooks/\n\`\`\`\n`)
    fs.mkdirSync(path.join(tmpDir, 'src/api'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'src/components'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'src/hooks'), { recursive: true })
    // Need client.ts and .env.example for other checks to not fail
    writeFile('src/api/client.ts', '')
    writeFile('.env.example', '')

    const result = run()
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toContain('architecture tree: OK')
  })

  it('fails when a documented dir is missing', () => {
    writeFile('CLAUDE.md', `# Project\n\`\`\`\nsrc/\n  api/\n  components/\n  missing/\n\`\`\`\n`)
    fs.mkdirSync(path.join(tmpDir, 'src/api'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'src/components'), { recursive: true })
    writeFile('src/api/client.ts', '')
    writeFile('.env.example', '')

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('missing/')
  })

  it('fails when an actual dir is not documented', () => {
    writeFile('CLAUDE.md', `# Project\n\`\`\`\nsrc/\n  api/\n\`\`\`\n`)
    fs.mkdirSync(path.join(tmpDir, 'src/api'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'src/undocumented'), { recursive: true })
    writeFile('src/api/client.ts', '')
    writeFile('.env.example', '')

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('undocumented/')
  })
})

// ─── Check 2: API endpoints ───────────────────────────────────────────────

describe('API endpoints', () => {
  function setup(clientExports: string[], claudeMdEndpoints: string[]) {
    const clientLines = clientExports.map((name) => `export function ${name}() {}`).join('\n')
    writeFile('src/api/client.ts', clientLines)

    const endpointLines = claudeMdEndpoints.map((e) => `  - \`${e}\``).join('\n')
    writeFile(
      'CLAUDE.md',
      `# Project\n\`\`\`\nsrc/\n  api/\n\`\`\`\n\n- Key endpoints:\n${endpointLines}\n`,
    )
    fs.mkdirSync(path.join(tmpDir, 'src/api'), { recursive: true })
    writeFile('.env.example', '')
  }

  it('passes when endpoint count matches export count', () => {
    setup(['health', 'listSchemas'], ['GET /health', 'GET /schemas'])

    const result = run()
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toContain('API endpoints: OK')
  })

  it('fails when client has more exports than documented endpoints', () => {
    setup(['health', 'listSchemas', 'createSchema'], ['GET /health', 'GET /schemas'])

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('client.ts has 3 exports but CLAUDE.md lists 2 endpoints')
  })
})

// ─── Check 3: Environment variables ───────────────────────────────────────

describe('environment variables', () => {
  function setupBase() {
    writeFile('CLAUDE.md', `# Project\n\`\`\`\nsrc/\n  api/\n\`\`\`\n`)
    fs.mkdirSync(path.join(tmpDir, 'src/api'), { recursive: true })
    writeFile('src/api/client.ts', '')
  }

  it('passes when all VITE_ vars are in .env.example', () => {
    setupBase()
    writeFile('src/api/client.ts', 'const url = import.meta.env.VITE_API_URL')
    writeFile('.env.example', 'VITE_API_URL=http://localhost:8000\n')

    const result = run()
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toContain('env vars: OK')
  })

  it('fails when a VITE_ var is used but not in .env.example', () => {
    setupBase()
    writeFile('src/api/client.ts', 'const url = import.meta.env.VITE_API_URL')
    writeFile('.env.example', '# empty\n')

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('VITE_API_URL')
  })

  it('passes when no VITE_ vars are used', () => {
    setupBase()
    writeFile('src/api/client.ts', 'const x = 1')
    writeFile('.env.example', '')

    const result = run()
    expect(result.exitCode).toBe(0)
  })
})

// ─── Check 4: Markdown links ──────────────────────────────────────────────

describe('markdown links', () => {
  function setupBase() {
    writeFile('CLAUDE.md', `# Project\n\`\`\`\nsrc/\n  api/\n\`\`\`\n`)
    fs.mkdirSync(path.join(tmpDir, 'src/api'), { recursive: true })
    writeFile('src/api/client.ts', '')
    writeFile('.env.example', '')
  }

  it('passes when all relative links are valid', () => {
    setupBase()
    writeFile('docs/guide.md', 'See [readme](../README.md) for details.')
    writeFile('README.md', '# README')

    const result = run()
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toContain('markdown links: OK')
  })

  it('fails when a relative link target is missing', () => {
    setupBase()
    writeFile('docs/guide.md', 'See [broken](../nonexistent.md) for details.')

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('nonexistent.md')
  })

  it('ignores absolute URLs', () => {
    setupBase()
    writeFile('docs/guide.md', 'See [github](https://github.com) and [local](../README.md).')
    writeFile('README.md', '# README')

    const result = run()
    expect(result.exitCode).toBe(0)
  })
})
