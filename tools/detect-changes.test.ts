// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { parseConventionalCommit, classifyCommits, generateChangelog } from './detect-changes'

describe('parseConventionalCommit', () => {
  it('extracts type and description', () => {
    const result = parseConventionalCommit('feat: add dashboard')
    expect(result).toEqual({ type: 'feat', breaking: false, description: 'add dashboard' })
  })

  it('detects breaking change via bang', () => {
    const result = parseConventionalCommit('feat!: drop legacy API')
    expect(result).toEqual({ type: 'feat', breaking: true, description: 'drop legacy API' })
  })

  it('detects BREAKING CHANGE footer', () => {
    const result = parseConventionalCommit(
      'feat: update auth\n\nBREAKING CHANGE: token format changed',
    )
    expect(result?.breaking).toBe(true)
  })

  it('detects BREAKING-CHANGE footer (hyphenated)', () => {
    const result = parseConventionalCommit('fix: update endpoint\n\nBREAKING-CHANGE: removed v1')
    expect(result?.breaking).toBe(true)
  })

  it('returns null for non-conventional commits', () => {
    expect(parseConventionalCommit('RED/GREEN: Foo produces Y')).toBeNull()
    expect(parseConventionalCommit('Merge pull request #30')).toBeNull()
    expect(parseConventionalCommit('Wire FooStep into FlowMapper')).toBeNull()
  })

  it('handles scoped types', () => {
    const result = parseConventionalCommit('fix(upload): handle large files')
    expect(result).toEqual({
      type: 'fix',
      breaking: false,
      description: 'handle large files',
    })
  })
})

describe('classifyCommits', () => {
  it('returns MAJOR for breaking changes', () => {
    expect(classifyCommits(['feat!: drop v1 routes'])).toBe('MAJOR')
    expect(classifyCommits(['fix: typo', 'feat!: breaking'])).toBe('MAJOR')
  })

  it('returns MINOR for feat commits', () => {
    expect(classifyCommits(['feat: new page', 'fix: button color'])).toBe('MINOR')
  })

  it('returns PATCH for fix commits', () => {
    expect(classifyCommits(['fix: typo'])).toBe('PATCH')
  })

  it('returns PATCH for non-conventional commits (fallback)', () => {
    expect(classifyCommits(['RED/GREEN: Foo', 'Wire Bar'])).toBe('PATCH')
  })

  it('returns NONE for empty list', () => {
    expect(classifyCommits([])).toBe('NONE')
  })

  it('returns PATCH for mixed conventional and non-conventional', () => {
    expect(classifyCommits(['chore: cleanup', 'RED/GREEN: test'])).toBe('PATCH')
  })
})

describe('generateChangelog', () => {
  it('produces grouped markdown with version header', () => {
    const commits = ['feat: add dashboard', 'fix: button color', 'RED/GREEN: test utility']
    const result = generateChangelog('0.1.0', '0.2.0', commits)

    expect(result).toContain('## 0.2.0')
    expect(result).toContain('### Features')
    expect(result).toContain('add dashboard')
    expect(result).toContain('### Bug Fixes')
    expect(result).toContain('button color')
    expect(result).toContain('### Other Changes')
    expect(result).toContain('RED/GREEN: test utility')
  })

  it('omits empty sections', () => {
    const result = generateChangelog('0.1.0', '0.1.1', ['fix: typo'])
    expect(result).toContain('### Bug Fixes')
    expect(result).not.toContain('### Features')
  })

  it('handles empty commit list', () => {
    const result = generateChangelog('0.1.0', '0.1.0', [])
    expect(result).toContain('## 0.1.0')
    expect(result).toContain('No changes')
  })
})
