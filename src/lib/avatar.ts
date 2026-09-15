/** How many avatar hues the palette defines, in `globals.css`. */
const TONES = 6

/**
 * Two letters for an avatar.
 *
 * @param name - The display name, preferred.
 * @param fallback - Used when there is no name, usually the e-mail or username.
 */
export function initialsOf(name: string, fallback: string): string {
  const source = (name || fallback || '?').trim()
  const parts = source.split(/[\s.@_-]+/).filter(Boolean)

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

/**
 * A stable avatar hue for a person, so the same name always lands on the same
 * color across every screen instead of shuffling on each render.
 *
 * @param seed - Anything unique to the person: id, username or e-mail.
 */
export function avatarTone(seed: string): number {
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  return hash % TONES
}
