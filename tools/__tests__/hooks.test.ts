// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { execSync, type ExecSyncOptionsWithStringEncoding } from 'child_process'
import * as path from 'path'

const HOOKS_DIR = path.resolve(__dirname, '../../.claude/hooks')
const PROJECT_ROOT = path.resolve(__dirname, '../..')

/**
 * Run a hook script with JSON piped to stdin.
 * Returns { exitCode, stdout, stderr }.
 */
function runHook(
  hookName: string,
  stdinJson: Record<string, unknown>,
  env?: Record<string, string>,
): { exitCode: number; stdout: string; stderr: string } {
  const hookPath = path.join(HOOKS_DIR, hookName)
  const input = JSON.stringify(stdinJson)
  const opts: ExecSyncOptionsWithStringEncoding = {
    input,
    timeout: 10_000,
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: PROJECT_ROOT,
      CLAUDE_WORKING_DIR: PROJECT_ROOT,
      ...env,
    },
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  }

  try {
    const stdout = execSync(`bash "${hookPath}"`, opts)
    return { exitCode: 0, stdout: stdout ?? '', stderr: '' }
  } catch (err: unknown) {
    const e = err as { status: number; stdout: string; stderr: string }
    return {
      exitCode: e.status ?? 1,
      stdout: (e.stdout ?? '').toString(),
      stderr: (e.stderr ?? '').toString(),
    }
  }
}

// ─── pre-commit.sh ──────────────────────────────────────────────────────────

describe('pre-commit.sh', () => {
  it('passes through non-git-commit commands', () => {
    const result = runHook('pre-commit.sh', { tool_input: { command: 'ls -la' } })
    expect(result.exitCode).toBe(0)
  })

  it('passes through when repo root does not match UI root', () => {
    const result = runHook(
      'pre-commit.sh',
      { tool_input: { command: 'git commit -m "test"' } },
      {
        CLAUDE_WORKING_DIR: '/tmp/some-other-repo',
        CLAUDE_PROJECT_DIR: '/tmp/some-other-repo',
      },
    )
    expect(result.exitCode).toBe(0)
  })
})

// ─── check-boundaries.sh ────────────────────────────────────────────────────

describe('check-boundaries.sh', () => {
  it('passes through non-git-commit commands', () => {
    const result = runHook('check-boundaries.sh', { tool_input: { command: 'git status' } })
    expect(result.exitCode).toBe(0)
  })

  it('passes through when repo root does not match UI root', () => {
    const result = runHook(
      'check-boundaries.sh',
      { tool_input: { command: 'git commit -m "test"' } },
      {
        CLAUDE_WORKING_DIR: '/tmp/some-other-repo',
        CLAUDE_PROJECT_DIR: '/tmp/some-other-repo',
      },
    )
    expect(result.exitCode).toBe(0)
  })
})

// ─── security-scan.sh ───────────────────────────────────────────────────────

describe('security-scan.sh', () => {
  it('passes through non-git-commit commands', () => {
    const result = runHook('security-scan.sh', { tool_input: { command: 'git status' } })
    expect(result.exitCode).toBe(0)
  })

  it('passes through when repo root does not match UI root', () => {
    const result = runHook(
      'security-scan.sh',
      { tool_input: { command: 'git commit -m "test"' } },
      {
        CLAUDE_WORKING_DIR: '/tmp/some-other-repo',
        CLAUDE_PROJECT_DIR: '/tmp/some-other-repo',
      },
    )
    expect(result.exitCode).toBe(0)
  })
})

// ─── enforce-create-pr.sh ───────────────────────────────────────────────────

describe('enforce-create-pr.sh', () => {
  it('passes through non-gh-pr-create commands', () => {
    const result = runHook('enforce-create-pr.sh', {
      tool_input: { command: 'gh pr list' },
    })
    expect(result.exitCode).toBe(0)
  })

  it('blocks bare gh pr create without skill footer', () => {
    const result = runHook('enforce-create-pr.sh', {
      tool_input: { command: 'gh pr create --title "test" --body "no footer"' },
    })
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('/create-pr')
  })

  it('allows gh pr create with Generated with [Claude Code] footer', () => {
    const result = runHook('enforce-create-pr.sh', {
      tool_input: {
        command: 'gh pr create --title "test" --body "summary\\n\\nGenerated with [Claude Code]"',
      },
    })
    expect(result.exitCode).toBe(0)
  })
})

// ─── protect-files.sh ───────────────────────────────────────────────────────

describe('protect-files.sh', () => {
  it('blocks edits to package-lock.json', () => {
    const result = runHook('protect-files.sh', {
      tool_input: { file_path: '/project/package-lock.json' },
    })
    expect(result.exitCode).toBe(2)
  })

  it('blocks edits to .env', () => {
    const result = runHook('protect-files.sh', {
      tool_input: { file_path: '/project/.env' },
    })
    expect(result.exitCode).toBe(2)
  })

  it('blocks edits to .env.local', () => {
    const result = runHook('protect-files.sh', {
      tool_input: { file_path: '/project/.env.local' },
    })
    expect(result.exitCode).toBe(2)
  })

  it('blocks edits to .claude/settings.json', () => {
    const result = runHook('protect-files.sh', {
      tool_input: { file_path: '/project/.claude/settings.json' },
    })
    expect(result.exitCode).toBe(2)
  })

  it('blocks edits to package.json', () => {
    const result = runHook('protect-files.sh', {
      tool_input: { file_path: '/project/package.json' },
    })
    expect(result.exitCode).toBe(2)
  })

  it('allows edits to regular source files', () => {
    const result = runHook('protect-files.sh', {
      tool_input: { file_path: '/project/src/App.tsx' },
    })
    expect(result.exitCode).toBe(0)
  })

  it('allows edits when file_path is empty', () => {
    const result = runHook('protect-files.sh', {
      tool_input: { file_path: '' },
    })
    expect(result.exitCode).toBe(0)
  })
})

// ─── post-edit-format.sh ────────────────────────────────────────────────────

describe('post-edit-format.sh', () => {
  it('passes through for non-matching file extensions', () => {
    const result = runHook('post-edit-format.sh', {
      tool_input: { file_path: '/project/README.md' },
    })
    expect(result.exitCode).toBe(0)
  })

  it('passes through for .py files', () => {
    const result = runHook('post-edit-format.sh', {
      tool_input: { file_path: '/project/script.py' },
    })
    expect(result.exitCode).toBe(0)
  })
})

// ─── post-failure-context.sh ────────────────────────────────────────────────

describe('post-failure-context.sh', () => {
  it('passes through for non-test commands', () => {
    const result = runHook('post-failure-context.sh', {
      tool_input: { command: 'ls -la' },
      tool_output: 'some output',
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe('')
  })

  it('produces diagnostic JSON for vitest failures', () => {
    const result = runHook('post-failure-context.sh', {
      tool_input: { command: 'npm test' },
      tool_output: [
        ' FAIL  src/test/smoke.test.ts > smoke test',
        '  Error: expected 1 to be 2',
        '  Tests  1 failed',
      ].join('\n'),
    })
    expect(result.exitCode).toBe(0)
    const json = JSON.parse(result.stdout)
    expect(json.hookSpecificOutput.additionalContext).toContain('FAILURE DIAGNOSTIC')
    expect(json.hookSpecificOutput.additionalContext).toContain('vitest')
  })

  it('produces no output for passing vitest', () => {
    const result = runHook('post-failure-context.sh', {
      tool_input: { command: 'npm test' },
      tool_output: [
        ' ✓ src/test/smoke.test.ts (1 test) 4ms',
        ' Test Files  1 passed (1)',
        ' Tests  1 passed (1)',
      ].join('\n'),
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe('')
  })

  it('produces diagnostic JSON for tsc errors', () => {
    const result = runHook('post-failure-context.sh', {
      tool_input: { command: 'npx tsc -b' },
      tool_output: "src/App.tsx(5,1): error TS2304: Cannot find name 'foo'.",
    })
    expect(result.exitCode).toBe(0)
    const json = JSON.parse(result.stdout)
    expect(json.hookSpecificOutput.additionalContext).toContain('tsc')
  })

  it('produces diagnostic JSON for eslint errors', () => {
    const result = runHook('post-failure-context.sh', {
      tool_input: { command: 'npm run lint' },
      tool_output: [
        'src/App.tsx:5:1  error  Unexpected var  no-var',
        '',
        '1 problems (1 error, 0 warnings)',
      ].join('\n'),
    })
    expect(result.exitCode).toBe(0)
    const json = JSON.parse(result.stdout)
    expect(json.hookSpecificOutput.additionalContext).toContain('eslint')
  })
})

// ─── post-rename-check.sh ───────────────────────────────────────────────────

describe('post-rename-check.sh', () => {
  it('passes through for non-mv commands', () => {
    const result = runHook('post-rename-check.sh', {
      tool_input: { command: 'ls -la' },
    })
    expect(result.exitCode).toBe(0)
  })

  it('passes through when repo root does not match UI root', () => {
    const result = runHook(
      'post-rename-check.sh',
      { tool_input: { command: 'mv old.ts new.ts' } },
      {
        CLAUDE_WORKING_DIR: '/tmp/some-other-repo',
        CLAUDE_PROJECT_DIR: '/tmp/some-other-repo',
      },
    )
    expect(result.exitCode).toBe(0)
  })
})
