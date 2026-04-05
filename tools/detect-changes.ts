import type { ChangeKind } from './bump-version'

export interface ConventionalCommit {
  type: string
  breaking: boolean
  description: string
}

const COMMIT_REGEX = /^(\w+)(?:\([^)]*\))?(!)?:\s*(.+)$/

export function parseConventionalCommit(message: string): ConventionalCommit | null {
  const firstLine = message.split('\n')[0]
  const match = firstLine.match(COMMIT_REGEX)
  if (!match) return null

  const [, type, bang, description] = match
  const breaking = bang === '!' || /BREAKING[ -]CHANGE:/.test(message)

  return { type, breaking, description }
}

const FEAT_TYPES = new Set(['feat'])
const PATCH_TYPES = new Set([
  'fix',
  'refactor',
  'style',
  'perf',
  'docs',
  'chore',
  'test',
  'build',
  'ci',
])

export function classifyCommits(messages: string[]): ChangeKind {
  if (messages.length === 0) return 'NONE'

  let hasBreaking = false
  let hasFeat = false
  let hasPatch = false
  let hasAny = false

  for (const msg of messages) {
    hasAny = true
    const parsed = parseConventionalCommit(msg)
    if (!parsed) continue
    if (parsed.breaking) hasBreaking = true
    if (FEAT_TYPES.has(parsed.type)) hasFeat = true
    if (PATCH_TYPES.has(parsed.type)) hasPatch = true
  }

  if (hasBreaking) return 'MAJOR'
  if (hasFeat) return 'MINOR'
  if (hasPatch) return 'PATCH'
  // Non-conventional commits present but no conventional ones → default to PATCH
  if (hasAny) return 'PATCH'
  return 'NONE'
}

const SECTION_MAP: Record<string, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  refactor: 'Refactors',
  perf: 'Performance',
  docs: 'Documentation',
  style: 'Styling',
  test: 'Tests',
  chore: 'Chores',
  build: 'Build',
  ci: 'CI',
}

export function generateChangelog(
  oldVersion: string,
  newVersion: string,
  messages: string[],
): string {
  if (messages.length === 0) {
    return `## ${newVersion}\n\nNo changes.\n`
  }

  const sections = new Map<string, string[]>()
  const other: string[] = []

  for (const msg of messages) {
    const parsed = parseConventionalCommit(msg)
    if (parsed) {
      const section = SECTION_MAP[parsed.type] ?? 'Other Changes'
      const list = sections.get(section) ?? []
      list.push(parsed.description)
      sections.set(section, list)
    } else {
      other.push(msg)
    }
  }

  let md = `## ${newVersion}\n`

  for (const [section, items] of sections) {
    md += `\n### ${section}\n\n`
    for (const item of items) {
      md += `- ${item}\n`
    }
  }

  if (other.length > 0) {
    md += `\n### Other Changes\n\n`
    for (const item of other) {
      md += `- ${item}\n`
    }
  }

  return md
}
