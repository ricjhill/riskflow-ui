// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import {
  detectLayer,
  detectFeatureName,
  resolveImportLayer,
  checkFile,
  scanDirectory,
  LAYER_RULES,
} from './import-boundary-linter'

describe('detectLayer', () => {
  it('returns the layer for a types/ file', () => {
    expect(detectLayer('src/types/api.ts')).toBe('types')
  })

  it('returns the layer for an api/ file', () => {
    expect(detectLayer('src/api/client.ts')).toBe('api')
  })

  it('returns the layer for a hooks/ file', () => {
    expect(detectLayer('src/hooks/useSession.ts')).toBe('hooks')
  })

  it('returns the layer for a components/ file', () => {
    expect(detectLayer('src/components/Button.tsx')).toBe('components')
  })

  it('returns the layer for a features/ file', () => {
    expect(detectLayer('src/features/flow-mapper/FlowMapper.tsx')).toBe('features')
  })

  it('returns the layer for a test/ file', () => {
    expect(detectLayer('src/test/setup.ts')).toBe('test')
  })

  it('returns null for files outside src/', () => {
    expect(detectLayer('tools/linter.ts')).toBeNull()
  })

  it('returns null for files directly in src/ (no layer)', () => {
    expect(detectLayer('src/App.tsx')).toBeNull()
  })

  it('returns null for files with no src/ in path', () => {
    expect(detectLayer('lib/utils.ts')).toBeNull()
  })

  it('works with absolute paths (as resolved from path aliases)', () => {
    expect(detectLayer('/project/src/api/client.ts')).toBe('api')
    expect(detectLayer('/project/src/components/Button.tsx')).toBe('components')
    expect(detectLayer('/project/src/features/flow-mapper/FlowMapper.tsx')).toBe('features')
  })
})

describe('detectFeatureName', () => {
  it('extracts the feature name from a features/ path', () => {
    expect(detectFeatureName('src/features/flow-mapper/FlowMapper.tsx')).toBe('flow-mapper')
  })

  it('extracts nested feature paths', () => {
    expect(detectFeatureName('src/features/schemas/SchemaList.tsx')).toBe('schemas')
  })

  it('returns null for non-feature paths', () => {
    expect(detectFeatureName('src/components/Button.tsx')).toBeNull()
  })

  it('returns null for paths outside src/', () => {
    expect(detectFeatureName('tools/linter.ts')).toBeNull()
  })
})

describe('resolveImportLayer', () => {
  it('resolves a relative import to types/ from api/', () => {
    const result = resolveImportLayer('../types/api', '/project/src/api/client.ts')
    expect(result).toEqual({ layer: 'types', featureName: null })
  })

  it('resolves a relative import to api/ from hooks/', () => {
    const result = resolveImportLayer('../api/client', '/project/src/hooks/useSession.ts')
    expect(result).toEqual({ layer: 'api', featureName: null })
  })

  it('returns null for third-party imports', () => {
    expect(resolveImportLayer('react', '/project/src/api/client.ts')).toBeNull()
  })

  it('returns null for node built-in imports', () => {
    expect(resolveImportLayer('fs', '/project/src/api/client.ts')).toBeNull()
  })

  it('returns null for imports that resolve outside src/', () => {
    expect(resolveImportLayer('../../tools/linter', '/project/src/api/client.ts')).toBeNull()
  })

  it('resolves cross-feature import with featureName', () => {
    const result = resolveImportLayer(
      '../flow-mapper/FlowMapper',
      '/project/src/features/schemas/SchemaList.tsx',
    )
    expect(result).toEqual({ layer: 'features', featureName: 'flow-mapper' })
  })

  it('resolves same-feature import with featureName', () => {
    const result = resolveImportLayer('./FlowMapper', '/project/src/features/flow-mapper/index.ts')
    expect(result).toEqual({ layer: 'features', featureName: 'flow-mapper' })
  })

  it('returns null for same-directory import within a non-feature layer', () => {
    // ./sibling from within types/ resolves to types/ — valid, returns the layer
    const result = resolveImportLayer('./other', '/project/src/types/api.ts')
    expect(result).toEqual({ layer: 'types', featureName: null })
  })
})

describe('checkFile', () => {
  const tmpDir = path.join(__dirname, '__test_fixtures__')

  beforeAll(() => {
    // Create a fake src/ tree with known imports
    fs.mkdirSync(path.join(tmpDir, 'src', 'types'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'src', 'api'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'src', 'components'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'src', 'features', 'alpha'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'src', 'features', 'beta'), { recursive: true })

    // types/ importing api/ — VIOLATION
    fs.writeFileSync(
      path.join(tmpDir, 'src', 'types', 'bad.ts'),
      `import { client } from '../api/client'\n`,
    )

    // api/ importing types/ — ALLOWED
    fs.writeFileSync(
      path.join(tmpDir, 'src', 'api', 'good.ts'),
      `import { ApiResponse } from '../types/api'\n`,
    )

    // api/ importing components/ — VIOLATION
    fs.writeFileSync(
      path.join(tmpDir, 'src', 'api', 'bad.ts'),
      `import { Button } from '../components/Button'\n`,
    )

    // features/alpha importing features/beta — CROSS-FEATURE VIOLATION
    fs.writeFileSync(
      path.join(tmpDir, 'src', 'features', 'alpha', 'Alpha.tsx'),
      `import { Beta } from '../beta/Beta'\n`,
    )

    // Comment containing import-like text — should NOT trigger
    fs.writeFileSync(
      path.join(tmpDir, 'src', 'types', 'safe.ts'),
      `// import { client } from '../api/client'\nexport interface Foo { bar: string }\n`,
    )

    // components/ importing types/ — ALLOWED
    fs.writeFileSync(
      path.join(tmpDir, 'src', 'components', 'Button.tsx'),
      `import { Theme } from '../types/theme'\n`,
    )
  })

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('detects types/ importing api/ as a violation', () => {
    const violations = checkFile(path.join(tmpDir, 'src', 'types', 'bad.ts'))
    expect(violations).toHaveLength(1)
    expect(violations[0].currentLayer).toBe('types')
    expect(violations[0].importedLayer).toBe('api')
  })

  it('allows api/ importing types/', () => {
    const violations = checkFile(path.join(tmpDir, 'src', 'api', 'good.ts'))
    expect(violations).toHaveLength(0)
  })

  it('detects api/ importing components/ as a violation', () => {
    const violations = checkFile(path.join(tmpDir, 'src', 'api', 'bad.ts'))
    expect(violations).toHaveLength(1)
    expect(violations[0].currentLayer).toBe('api')
    expect(violations[0].importedLayer).toBe('components')
  })

  it('detects cross-feature imports', () => {
    const violations = checkFile(path.join(tmpDir, 'src', 'features', 'alpha', 'Alpha.tsx'))
    expect(violations).toHaveLength(1)
    expect(violations[0].currentLayer).toBe('features/alpha')
    expect(violations[0].importedLayer).toBe('features/beta')
  })

  it('ignores imports inside comments (AST advantage)', () => {
    const violations = checkFile(path.join(tmpDir, 'src', 'types', 'safe.ts'))
    expect(violations).toHaveLength(0)
  })

  it('allows components/ importing types/', () => {
    const violations = checkFile(path.join(tmpDir, 'src', 'components', 'Button.tsx'))
    expect(violations).toHaveLength(0)
  })

  it('returns empty array for files outside src/', () => {
    const violations = checkFile(path.join(tmpDir, 'tools', 'something.ts'))
    expect(violations).toHaveLength(0)
  })
})

describe('scanDirectory', () => {
  it('returns zero violations for the real src/ directory', () => {
    const srcDir = path.resolve('src')
    const violations = scanDirectory(srcDir)
    expect(violations).toHaveLength(0)
  })
})

describe('LAYER_RULES', () => {
  it('defines rules for all layers', () => {
    expect(LAYER_RULES).toHaveProperty('types')
    expect(LAYER_RULES).toHaveProperty('api')
    expect(LAYER_RULES).toHaveProperty('hooks')
    expect(LAYER_RULES).toHaveProperty('components')
    expect(LAYER_RULES).toHaveProperty('features')
    expect(LAYER_RULES).toHaveProperty('test')
  })

  it('types/ can only import from itself', () => {
    expect(LAYER_RULES.types).toEqual(new Set(['types']))
  })

  it('features/ can import from all layers except test/', () => {
    expect(LAYER_RULES.features).toEqual(
      new Set(['features', 'components', 'hooks', 'api', 'types']),
    )
  })
})
