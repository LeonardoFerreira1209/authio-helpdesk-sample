import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  type TicketPriority,
  type TicketStatus,
} from '@/lib/tickets'

/** Which badge tone each status wears. */
const STATUS_TONE: Record<TicketStatus, string> = {
  aberto: 'info',
  em_andamento: 'accent',
  aguardando: 'warn',
  resolvido: 'ok',
}

/** Which badge tone each priority wears. */
const PRIORITY_TONE: Record<TicketPriority, string> = {
  baixa: '',
  media: 'info',
  alta: 'warn',
  critica: 'danger',
}

/**
 * A ticket's status.
 *
 * @param props.status - The status to render.
 */
export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`badge ${STATUS_TONE[status]}`}>
      <span className="dot" />
      {STATUS_LABEL[status]}
    </span>
  )
}

/**
 * A ticket's priority.
 *
 * @param props.priority - The priority to render.
 */
export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={`badge ${PRIORITY_TONE[priority]}`}>{PRIORITY_LABEL[priority]}</span>
}
