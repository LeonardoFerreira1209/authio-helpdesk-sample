import type { ReactNode } from 'react'

/**
 * What a list shows instead of rows, when there are none.
 *
 * A blank table body reads as broken; naming what is missing and, when there
 * is one, offering the way out of it reads as a state the product designed
 * for.
 *
 * @param props.icon - A small icon, sized for this spot.
 * @param props.title - What is empty.
 * @param props.description - Why, or what to do about it.
 * @param props.action - An optional way out, usually a link.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  )
}
