// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const SCRIPT = path.resolve(__dirname, '../validate-stack-versions.sh')
const HOOK_UTILS = path.resolve(__dirname, '../hook-utils.sh')

let tmpDir: string

function run() {
  const toolsDir = path.join(tmpDir, 'tools')
  fs.mkdirSync(toolsDir, { recursive: true })
  fs.copyFileSync(HOOK_UTILS, path.join(toolsDir, 'hook-utils.sh'))
  fs.copyFileSync(SCRIPT, path.join(toolsDir, 'validate-stack-versions.sh'))

  const result = spawnSync('bash', [path.join(toolsDir, 'validate-stack-versions.sh')], {
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

function writePackageJson(deps: Record<string, string>, devDeps: Record<string, string> = {}) {
  fs.writeFileSync(
    path.join(tmpDir, 'package.json'),
    JSON.stringify({ dependencies: deps, devDependencies: devDeps }),
  )
}

function writeClaudeMd(stackLine: string) {
  fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), `# Project\n\n## Stack\n${stackLine}\n`)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stack-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('validate-stack-versions.sh', () => {
  it('passes when major versions match', () => {
    writeClaudeMd('React 19, TypeScript 5.9, Vite 8, React Router, Vitest, ESLint, Prettier')
    writePackageJson({ react: '^19.2.4' }, { typescript: '~5.9.3', vite: '^8.0.1' })

    const result = run()
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toContain('stack versions match')
  })

  it('fails when React major version mismatches', () => {
    writeClaudeMd('React 19, TypeScript 5.9, Vite 8, React Router, Vitest, ESLint, Prettier')
    writePackageJson({ react: '^18.3.0' }, { typescript: '~5.9.3', vite: '^8.0.1' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('React major version mismatch')
  })

  it('fails when TypeScript major version mismatches', () => {
    writeClaudeMd('React 19, TypeScript 5.9, Vite 8, React Router, Vitest, ESLint, Prettier')
    writePackageJson({ react: '^19.0.0' }, { typescript: '~4.9.5', vite: '^8.0.1' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('TypeScript major version mismatch')
  })

  it('fails when Vite major version mismatches', () => {
    writeClaudeMd('React 19, TypeScript 5.9, Vite 8, React Router, Vitest, ESLint, Prettier')
    writePackageJson({ react: '^19.0.0' }, { typescript: '~5.9.3', vite: '^7.0.0' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Vite major version mismatch')
  })

  it('fails when CLAUDE.md has no stack line', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# Project\n\nNo stack info here.\n')
    writePackageJson({ react: '^19.0.0' }, { typescript: '~5.9.3', vite: '^8.0.1' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('could not find stack version line')
  })

  it('fails when a package is missing from package.json', () => {
    writeClaudeMd('React 19, TypeScript 5.9, Vite 8, React Router, Vitest, ESLint, Prettier')
    writePackageJson({}, { typescript: '~5.9.3', vite: '^8.0.1' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('React not found in package.json')
  })

  it('fails with a diagnostic when stack line is partial (missing Vite)', () => {
    writeClaudeMd('React 19, TypeScript 5.9, Prettier')
    writePackageJson({ react: '^19.0.0' }, { typescript: '~5.9.3', vite: '^8.0.1' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Vite version not found in CLAUDE.md')
  })
})
