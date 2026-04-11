// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const SCRIPT = path.resolve(__dirname, '../validate-harness.sh')
const HOOK_UTILS = path.resolve(__dirname, '../hook-utils.sh')

let tmpDir: string

function run() {
  // Copy hook-utils.sh into the temp tools/ dir so the source path resolves
  const toolsDir = path.join(tmpDir, 'tools')
  fs.mkdirSync(toolsDir, { recursive: true })
  fs.copyFileSync(HOOK_UTILS, path.join(toolsDir, 'hook-utils.sh'))
  fs.copyFileSync(SCRIPT, path.join(toolsDir, 'validate-harness.sh'))

  const result = spawnSync('bash', [path.join(toolsDir, 'validate-harness.sh')], {
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

/** Write .claude/settings.json with hook commands pointing to given paths. */
function writeSettings(hookCommands: string[]) {
  const settings = {
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: hookCommands.map((cmd) => ({ type: 'command', command: cmd, timeout: 5 })),
        },
      ],
    },
  }
  const dir = path.join(tmpDir, '.claude')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings))
}

/** Create a hook script file, optionally executable. */
function writeHook(relPath: string, executable = true) {
  const full = path.join(tmpDir, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, '#!/bin/bash\nexit 0\n')
  if (executable) fs.chmodSync(full, 0o755)
  else fs.chmodSync(full, 0o644)
}

/** Write an agent or skill .md file with given frontmatter fields. */
function writeMd(relPath: string, fields: Record<string, string>) {
  const full = path.join(tmpDir, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  const lines = ['---']
  for (const [k, v] of Object.entries(fields)) {
    lines.push(`${k}: ${v}`)
  }
  lines.push('---', '', 'Body text.')
  fs.writeFileSync(full, lines.join('\n'))
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('validate-harness.sh', () => {
  it('passes when all hooks exist and are executable', () => {
    writeSettings(['.claude/hooks/my-hook.sh'])
    writeHook('.claude/hooks/my-hook.sh')
    writeMd('.claude/agents/test.md', { name: 'test', description: 'A test agent' })
    writeMd('.claude/skills/foo/SKILL.md', { name: 'foo', description: 'A test skill' })

    const result = run()
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toContain('harness validation passed')
  })

  it('fails when a hook path references a missing file', () => {
    writeSettings(['.claude/hooks/missing.sh'])
    writeMd('.claude/agents/test.md', { name: 'test', description: 'ok' })
    writeMd('.claude/skills/foo/SKILL.md', { name: 'foo', description: 'ok' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('ERROR: hook path not found')
  })

  it('fails when a hook exists but is not executable', () => {
    writeSettings(['.claude/hooks/no-exec.sh'])
    writeHook('.claude/hooks/no-exec.sh', false)
    writeMd('.claude/agents/test.md', { name: 'test', description: 'ok' })
    writeMd('.claude/skills/foo/SKILL.md', { name: 'foo', description: 'ok' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('ERROR: hook not executable')
  })

  it('fails when an agent .md is missing name frontmatter', () => {
    writeSettings(['.claude/hooks/ok.sh'])
    writeHook('.claude/hooks/ok.sh')
    writeMd('.claude/agents/bad.md', { description: 'missing name' })
    writeMd('.claude/skills/foo/SKILL.md', { name: 'foo', description: 'ok' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('missing required frontmatter: name')
  })

  it('fails when a skill SKILL.md is missing description frontmatter', () => {
    writeSettings(['.claude/hooks/ok.sh'])
    writeHook('.claude/hooks/ok.sh')
    writeMd('.claude/agents/ok.md', { name: 'ok', description: 'fine' })
    writeMd('.claude/skills/bar/SKILL.md', { name: 'bar' })

    const result = run()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('missing required frontmatter: description')
  })

  it('passes with no agents or skills directories', () => {
    writeSettings(['.claude/hooks/ok.sh'])
    writeHook('.claude/hooks/ok.sh')

    const result = run()
    expect(result.exitCode).toBe(0)
  })
})
