import { normalizeTag, parseTags, serializeTags, mergeTags, suggestTags } from '@/lib/tags'

describe('tags utils', () => {
  test('normalizeTag trims, lowercases, and hyphenates spaces', () => {
    expect(normalizeTag('  Business Travel  ')).toBe('business-travel')
    expect(normalizeTag('SubSCRIPTion')).toBe('subscription')
  })

  test('parseTags handles string input and removes empties', () => {
    expect(parseTags('business, travel, , personal')).toEqual([
      'business',
      'travel',
      'personal',
    ])
  })

  test('parseTags handles array input and deduplicates', () => {
    expect(parseTags(['Business', 'business', 'work'])).toEqual(['business', 'work'])
  })

  test('serializeTags normalizes and joins with commas', () => {
    expect(serializeTags(['Business Travel', 'personal'])).toBe('business-travel,personal')
  })

  test('mergeTags combines, normalizes, deduplicates, and sorts', () => {
    const merged = mergeTags('business,personal', ['Work', 'business'], null, undefined, 'travel')
    expect(merged).toEqual(['business', 'personal', 'travel', 'work'])
  })

  test('suggestTags returns matches by prefix (normalized)', () => {
    const all = ['Business', 'personal', 'work', 'travel', 'training']
    expect(suggestTags('tr', all)).toEqual(['training', 'travel'])
    expect(suggestTags('  WORK', all)).toEqual(['work'])
  })
})

