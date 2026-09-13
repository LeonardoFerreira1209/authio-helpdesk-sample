/**
 * The application's own domain data.
 *
 * Deliberately in memory: this sample exists to exercise Authio, and a database
 * would only add a second thing that can be misconfigured. The store survives
 * hot reloads by living on `globalThis`, so a ticket edited in the browser does
 * not silently revert the next time a file is saved.
 */

/** Where a ticket stands. */
export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido'

/** How urgent it is. */
export type TicketPriority = 'baixa' | 'media' | 'alta'

/**
 * A support ticket.
 */
export interface Ticket {
  id: string
  subject: string
  requester: string
  /** Which area owns it. Matched against the caller's `department` claim. */
  department: string
  status: TicketStatus
  priority: TicketPriority
  assignee: string | null
  updatedAt: string
}

/**
 * The seed every fresh process starts from.
 */
function seed(): Ticket[] {
  const now = new Date().toISOString()

  return [
    {
      id: 'TCK-1001',
      subject: 'Não consigo entrar depois de trocar a senha',
      requester: 'ana.souza@exemplo.com',
      department: 'suporte',
      status: 'aberto',
      priority: 'alta',
      assignee: null,
      updatedAt: now,
    },
    {
      id: 'TCK-1002',
      subject: 'Nota fiscal do mês passado veio com CNPJ errado',
      requester: 'carlos.lima@exemplo.com',
      department: 'financeiro',
      status: 'em_andamento',
      priority: 'media',
      assignee: 'joana.martins',
      updatedAt: now,
    },
    {
      id: 'TCK-1003',
      subject: 'Pedido de acesso ao relatório de chamados',
      requester: 'rita.alves@exemplo.com',
      department: 'suporte',
      status: 'aberto',
      priority: 'baixa',
      assignee: null,
      updatedAt: now,
    },
    {
      id: 'TCK-1004',
      subject: 'Cobrança duplicada no cartão',
      requester: 'paulo.dias@exemplo.com',
      department: 'financeiro',
      status: 'resolvido',
      priority: 'alta',
      assignee: 'joana.martins',
      updatedAt: now,
    },
  ]
}

const store = globalThis as typeof globalThis & { __helpdeskTickets?: Ticket[] }

store.__helpdeskTickets ??= seed()

/**
 * Every ticket, newest change first.
 */
export function listTickets(): Ticket[] {
  return [...(store.__helpdeskTickets ?? [])].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  )
}

/**
 * One ticket, or `undefined` when the id is unknown.
 *
 * @param id - The ticket identifier.
 */
export function findTicket(id: string): Ticket | undefined {
  return store.__helpdeskTickets?.find((ticket) => ticket.id === id)
}

/**
 * The fields a ticket update may change.
 */
export interface TicketUpdate {
  status?: TicketStatus
  priority?: TicketPriority
  assignee?: string | null
}

/**
 * Applies an update to a ticket.
 *
 * @param id - The ticket identifier.
 * @param update - The fields to change; absent fields are left alone.
 * @returns The ticket as it now stands, or `undefined` when the id is unknown.
 */
export function updateTicket(id: string, update: TicketUpdate): Ticket | undefined {
  const ticket = findTicket(id)

  if (!ticket) {
    return undefined
  }

  if (update.status) {
    ticket.status = update.status
  }

  if (update.priority) {
    ticket.priority = update.priority
  }

  if (update.assignee !== undefined) {
    ticket.assignee = update.assignee
  }

  ticket.updatedAt = new Date().toISOString()

  return ticket
}

/**
 * Counts tickets by status for one department.
 *
 * @param department - The department to report on.
 */
export function reportFor(department: string): {
  department: string
  total: number
  byStatus: Record<TicketStatus, number>
  byPriority: Record<TicketPriority, number>
} {
  const owned = listTickets().filter(
    (ticket) => ticket.department.toLowerCase() === department.toLowerCase(),
  )

  const byStatus: Record<TicketStatus, number> = { aberto: 0, em_andamento: 0, resolvido: 0 }
  const byPriority: Record<TicketPriority, number> = { baixa: 0, media: 0, alta: 0 }

  for (const ticket of owned) {
    byStatus[ticket.status] += 1
    byPriority[ticket.priority] += 1
  }

  return { department, total: owned.length, byStatus, byPriority }
}

/** Statuses a ticket may be moved to, for validating an update. */
export const TICKET_STATUSES: TicketStatus[] = ['aberto', 'em_andamento', 'resolvido']

/** Priorities a ticket may be moved to, for validating an update. */
export const TICKET_PRIORITIES: TicketPriority[] = ['baixa', 'media', 'alta']
