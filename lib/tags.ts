// Tag utilities for parsing, normalizing, and serializing tags

/** Normalize a single tag name */
export function normalizeTag(tag: string): string {
  // Trim, lowercase, replace spaces with hyphens
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/** Parse tags from string or array into a normalized unique array */
export function parseTags(input: string | string[] | null | undefined): string[] {
  if (!input) return []

  const parts = Array.isArray(input)
    ? input
    : input.split(',')

  const normalized = parts
    .map((t) => normalizeTag(t))
    .filter((t) => t.length > 0)

  // Deduplicate while preserving order
  const seen = new Set<string>()
  const result: string[] = []
  for (const t of normalized) {
    if (!seen.has(t)) {
      seen.add(t)
      result.push(t)
    }
  }
  return result
}

/** Serialize tags array into a storage string */
export function serializeTags(tags: string[]): string {
  return parseTags(tags).join(',')
}

/** Merge multiple tag inputs into a unique, sorted array */
export function mergeTags(...inputs: Array<string | string[] | null | undefined>): string[] {
  const merged = inputs.flatMap((i) => parseTags(i))
  const unique = Array.from(new Set(merged))
  return unique.sort()
}

/** Suggest tags from allTags matching the given prefix */
export function suggestTags(prefix: string, allTags: string[], limit = 10): string[] {
  const p = normalizeTag(prefix)
  if (!p) return []
  return Array.from(new Set(allTags.map((t) => normalizeTag(t))))
    .filter((t) => t.startsWith(p))
    .sort()
    .slice(0, limit)
}
