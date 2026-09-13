/**
 * How long ago something happened, in the coarse terms a list needs.
 *
 * @param at - An ISO timestamp.
 */
export function relative(at: string): string {
  const elapsed = Date.now() - new Date(at).getTime()

  if (elapsed < 60_000) {
    return 'agora'
  }

  if (elapsed < 3_600_000) {
    return `há ${Math.round(elapsed / 60_000)} min`
  }

  if (elapsed < 86_400_000) {
    return `há ${Math.round(elapsed / 3_600_000)} h`
  }

  const days = Math.round(elapsed / 86_400_000)

  return days === 1 ? 'há 1 dia' : `há ${days} dias`
}

/**
 * A timestamp in full, for detail screens.
 *
 * @param at - An ISO timestamp.
 */
export function fullDate(at: string): string {
  return new Date(at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
