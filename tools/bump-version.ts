export type ChangeKind = 'MAJOR' | 'MINOR' | 'PATCH' | 'NONE'

function parse(version: string): [number, number, number] {
  const parts = version.split('.')
  if (parts.length !== 3) throw new Error(`Invalid semver: "${version}" (expected X.Y.Z)`)
  const nums = parts.map(Number)
  if (nums.some(isNaN)) throw new Error(`Invalid semver: "${version}" (non-numeric parts)`)
  return nums as [number, number, number]
}

export function bumpMajor(version: string): string {
  const [major] = parse(version)
  return `${major + 1}.0.0`
}

export function bumpMinor(version: string): string {
  const [major, minor] = parse(version)
  return `${major}.${minor + 1}.0`
}

export function bumpPatch(version: string): string {
  const [major, minor, patch] = parse(version)
  return `${major}.${minor}.${patch + 1}`
}

export function computeNextVersion(current: string, changeKind: ChangeKind): string {
  switch (changeKind) {
    case 'MAJOR':
      return bumpMajor(current)
    case 'MINOR':
      return bumpMinor(current)
    case 'PATCH':
      return bumpPatch(current)
    case 'NONE':
      return current
  }
}
