// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { bumpMajor, bumpMinor, bumpPatch } from './bump-version'

describe('bumpMajor', () => {
  it('increments major and resets minor/patch', () => {
    expect(bumpMajor('0.1.0')).toBe('1.0.0')
    expect(bumpMajor('1.2.3')).toBe('2.0.0')
    expect(bumpMajor('9.9.9')).toBe('10.0.0')
  })
})

describe('bumpMinor', () => {
  it('increments minor and resets patch', () => {
    expect(bumpMinor('0.1.0')).toBe('0.2.0')
    expect(bumpMinor('1.2.3')).toBe('1.3.0')
  })
})

describe('bumpPatch', () => {
  it('increments patch only', () => {
    expect(bumpPatch('1.2.3')).toBe('1.2.4')
    expect(bumpPatch('0.1.0')).toBe('0.1.1')
  })
})
