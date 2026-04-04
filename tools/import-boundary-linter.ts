/**
 * AST-based architecture boundary linter for feature-based React projects.
 *
 * Uses the TypeScript compiler API to parse imports (not regex) to enforce
 * the dependency direction:
 *   types/ <- api/ <- hooks/ <- components/ <- features/
 *
 * Advantages over regex:
 * - Ignores imports inside comments and strings
 * - Handles both static imports and re-exports
 * - Reports exact file:line for each violation
 * - Includes agent-readable FIX suggestions
 *
 * Run: npx tsx tools/import-boundary-linter.ts
 */

import * as ts from 'typescript'
import * as path from 'path'
import * as fs from 'fs'

// Layers and what each layer is allowed to import from (project-local only).
// Third-party and Node built-in imports are always allowed.
export const LAYER_RULES: Record<string, Set<string>> = {
  types: new Set(['types']),
  api: new Set(['api', 'types']),
  hooks: new Set(['hooks', 'api', 'types']),
  components: new Set(['components', 'hooks', 'api', 'types']),
  features: new Set(['features', 'components', 'hooks', 'api', 'types']),
  test: new Set(['test', 'features', 'components', 'hooks', 'api', 'types']),
}

const LOCAL_LAYERS = new Set(['types', 'api', 'hooks', 'components', 'features', 'test'])

const FIX_SUGGESTIONS: Record<string, string> = {
  types:
    'FIX: types/ must not import from other project layers. Types should be pure data definitions.',
  api: 'FIX: api/ may only import from types/. API client functions must not depend on UI code.',
  hooks:
    'FIX: hooks/ may only import from api/ and types/. Hooks must not import components or features.',
  components:
    'FIX: components/ may only import from hooks/, api/, and types/. Components are generic -- no feature-specific logic.',
}

export interface Violation {
  file: string
  line: number
  currentLayer: string
  importedLayer: string
  importPath: string
  fix: string
}

/**
 * Determine which architectural layer a file belongs to based on its path
 * relative to src/.
 */
export function detectLayer(filePath: string): string | null {
  const srcIndex = filePath.indexOf('src/')
  if (srcIndex === -1) return null

  const relative = filePath.substring(srcIndex + 4) // after "src/"
  const firstSegment = relative.split('/')[0]

  if (LOCAL_LAYERS.has(firstSegment)) return firstSegment
  return null
}

/**
 * Extract the feature name from a file path, e.g.
 * "src/features/flow-mapper/FlowMapper.tsx" -> "flow-mapper"
 */
export function detectFeatureName(filePath: string): string | null {
  const match = filePath.match(/src\/features\/([^/]+)/)
  return match ? match[1] : null
}

/**
 * Determine which layer an import specifier targets.
 * Only matches project-relative imports (starting with ../ or ./ that resolve
 * into src/ layers, or absolute paths like ../api/client).
 *
 * Returns null for third-party packages (react, vitest, etc.)
 */
export function resolveImportLayer(
  importSpecifier: string,
  importingFile: string,
): { layer: string; featureName: string | null } | null {
  // Handle @/ path alias (maps to src/)
  if (importSpecifier.startsWith('@/')) {
    const relative = importSpecifier.slice(2) // strip "@/"
    const firstSegment = relative.split('/')[0]
    if (!LOCAL_LAYERS.has(firstSegment)) return null

    let featureName: string | null = null
    if (firstSegment === 'features') {
      const parts = relative.split('/')
      if (parts.length >= 2) featureName = parts[1]
    }
    return { layer: firstSegment, featureName }
  }

  // Skip third-party imports (no leading dot)
  if (!importSpecifier.startsWith('.')) return null

  // Resolve relative to the importing file's directory
  const dir = path.dirname(importingFile)
  const resolved = path.resolve(dir, importSpecifier)

  // Must be within src/
  const srcIndex = resolved.indexOf('src/')
  if (srcIndex === -1) return null

  const relative = resolved.substring(srcIndex + 4)
  const firstSegment = relative.split('/')[0]

  if (!LOCAL_LAYERS.has(firstSegment)) return null

  let featureName: string | null = null
  if (firstSegment === 'features') {
    const parts = relative.split('/')
    if (parts.length >= 2) featureName = parts[1]
  }

  return { layer: firstSegment, featureName }
}

/**
 * Check a single TypeScript file for architecture boundary violations.
 */
export function checkFile(filePath: string): Violation[] {
  // Test files are co-located with source but are not production code —
  // they may import from any layer (e.g. @/test/mocks).
  if (/\.(test|spec)\.(ts|tsx)$/.test(filePath)) return []

  const detectedLayer = detectLayer(filePath)
  if (detectedLayer === null) return []

  const currentLayer: string = detectedLayer

  const source = fs.readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)

  const allowed = LAYER_RULES[currentLayer]
  if (!allowed) return []

  const currentFeature = detectFeatureName(filePath)
  const violations: Violation[] = []

  function visit(node: ts.Node) {
    let importPath: string | undefined

    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      importPath = node.moduleSpecifier.text
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      importPath = node.moduleSpecifier.text
    }

    if (importPath) {
      const target = resolveImportLayer(importPath, filePath)
      if (target) {
        // Check layer rule
        if (!allowed.has(target.layer)) {
          const fix = FIX_SUGGESTIONS[currentLayer] ?? ''
          violations.push({
            file: filePath,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            currentLayer,
            importedLayer: target.layer,
            importPath,
            fix,
          })
        }

        // Check cross-feature imports (features/<X> must not import features/<Y>)
        if (
          currentLayer === 'features' &&
          target.layer === 'features' &&
          currentFeature &&
          target.featureName &&
          currentFeature !== target.featureName
        ) {
          violations.push({
            file: filePath,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            currentLayer: `features/${currentFeature}`,
            importedLayer: `features/${target.featureName}`,
            importPath,
            fix: `FIX: features/${currentFeature}/ must not import from features/${target.featureName}/. Features are isolated -- extract shared code to components/, hooks/, or types/.`,
          })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

/**
 * Scan all TypeScript files under a directory for boundary violations.
 */
export function scanDirectory(srcDir: string): Violation[] {
  const allViolations: Violation[] = []

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(full)
      } else if (
        entry.isFile() &&
        /\.(ts|tsx)$/.test(entry.name) &&
        !entry.name.endsWith('.d.ts')
      ) {
        allViolations.push(...checkFile(full))
      }
    }
  }

  walk(srcDir)
  return allViolations
}

/**
 * CLI entry point — scan src/ and exit with appropriate code.
 */
function main() {
  const srcDir = path.resolve('src')

  if (!fs.existsSync(srcDir)) {
    console.error('Error: src/ directory not found')
    process.exit(1)
  }

  const allViolations = scanDirectory(srcDir)

  if (allViolations.length > 0) {
    for (const v of allViolations) {
      console.error(
        `VIOLATION: Layer '${v.currentLayer}' cannot import '${v.importedLayer}' ` +
          `(from '${v.importPath}') in ${v.file}:${v.line}. ${v.fix}`,
      )
    }
    console.error(`\nTotal Architecture Violations: ${allViolations.length}`)
    process.exit(1)
  } else {
    console.log('Architecture Integrity: GREEN')
  }
}

main()
