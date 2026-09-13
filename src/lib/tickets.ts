/**
 * The application's own data.
 *
 * Deliberately in memory and seeded: the point of this sample is the identity
 * integration, and a database would only add a second thing to configure wrong.
 * The store lives on `globalThis` so a hot reload does not revert what was just
 * edited on screen.
 */

/** Where a ticket stands. */
export type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando' | 'resolvido'

/** How urgent it is. */
export type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica'

/**
 * A note left on a ticket.
 */
export interface TicketComment {
  id: string
  author: string
  body: string
  at: string
}

/**
 * A support ticket.
 */
export interface Ticket {
  id: string
  subject: string
  description: string
  requesterName: string
  requesterEmail: string
  /** Which area owns it. Matched against the signed-in person's `department` claim. */
  department: string
  status: TicketStatus
  priority: TicketPriority
  assignee: string | null
  createdAt: string
  updatedAt: string
  comments: TicketComment[]
}

/** How each status should read on screen. */
export const STATUS_LABEL: Record<TicketStatus, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando: 'Aguardando cliente',
  resolvido: 'Resolvido',
}

/** How each priority should read on screen. */
export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

/** The departments the seed data covers. */
export const DEPARTMENTS = ['suporte', 'financeiro', 'infraestrutura'] as const

/**
 * Builds a timestamp a given number of hours in the past.
 *
 * @param hours - How long ago.
 */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString()
}

/**
 * The seed every fresh process starts from.
 */
function seed(): Ticket[] {
  return [
    {
      id: 'TCK-2041',
      subject: 'Não consigo entrar depois de trocar a senha',
      description:
        'Troquei a senha ontem pelo link de recuperação e desde então o login recusa. A senha nova funciona no celular, mas não no computador do escritório.',
      requesterName: 'Ana Souza',
      requesterEmail: 'ana.souza@exemplo.com',
      department: 'suporte',
      status: 'aberto',
      priority: 'alta',
      assignee: null,
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
      comments: [],
    },
    {
      id: 'TCK-2040',
      subject: 'Nota fiscal do mês passado veio com CNPJ errado',
      description:
        'A nota 4471 saiu com o CNPJ da nossa antiga razão social. Precisamos da correção antes do fechamento contábil.',
      requesterName: 'Carlos Lima',
      requesterEmail: 'carlos.lima@exemplo.com',
      department: 'financeiro',
      status: 'em_andamento',
      priority: 'media',
      assignee: 'joana.martins',
      createdAt: hoursAgo(26),
      updatedAt: hoursAgo(5),
      comments: [
        {
          id: 'c-1',
          author: 'joana.martins',
          body: 'Pedido de correção aberto com a contabilidade. Retorno previsto para amanhã.',
          at: hoursAgo(5),
        },
      ],
    },
    {
      id: 'TCK-2039',
      subject: 'Lentidão no portal a partir das 18h',
      description:
        'Todos os dias por volta das 18h o portal passa a demorar mais de dez segundos por página. Some sozinho por volta das 20h.',
      requesterName: 'Rita Alves',
      requesterEmail: 'rita.alves@exemplo.com',
      department: 'infraestrutura',
      status: 'em_andamento',
      priority: 'critica',
      assignee: 'bruno.castro',
      createdAt: hoursAgo(50),
      updatedAt: hoursAgo(2),
      comments: [
        {
          id: 'c-2',
          author: 'bruno.castro',
          body: 'Coincide com a janela do job de faturamento. Investigando contenção no banco.',
          at: hoursAgo(2),
        },
      ],
    },
    {
      id: 'TCK-2038',
      subject: 'Cobrança duplicada no cartão',
      description: 'A mensalidade de setembro foi debitada duas vezes, nos dias 05 e 06.',
      requesterName: 'Paulo Dias',
      requesterEmail: 'paulo.dias@exemplo.com',
      department: 'financeiro',
      status: 'resolvido',
      priority: 'alta',
      assignee: 'joana.martins',
      createdAt: hoursAgo(96),
      updatedAt: hoursAgo(48),
      comments: [
        {
          id: 'c-3',
          author: 'joana.martins',
          body: 'Estorno solicitado e confirmado pela operadora. Prazo de até cinco dias úteis.',
          at: hoursAgo(48),
        },
      ],
    },
    {
      id: 'TCK-2037',
      subject: 'Pedido de acesso ao relatório de chamados',
      description: 'Preciso acompanhar o volume da minha área no fechamento do mês.',
      requesterName: 'Marina Reis',
      requesterEmail: 'marina.reis@exemplo.com',
      department: 'suporte',
      status: 'aguardando',
      priority: 'baixa',
      assignee: 'joana.martins',
      createdAt: hoursAgo(120),
      updatedAt: hoursAgo(30),
      comments: [
        {
          id: 'c-4',
          author: 'joana.martins',
          body: 'Encaminhado para aprovação da gestão da área.',
          at: hoursAgo(30),
        },
      ],
    },
    {
      id: 'TCK-2036',
      subject: 'Anexo de mais de 10 MB é recusado',
      description: 'O formulário recusa anexos grandes sem dizer qual é o limite.',
      requesterName: 'Felipe Nunes',
      requesterEmail: 'felipe.nunes@exemplo.com',
      department: 'suporte',
      status: 'aberto',
      priority: 'media',
      assignee: null,
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(8),
      comments: [],
    },
    {
      id: 'TCK-2035',
      subject: 'Certificado do ambiente de homologação expirou',
      description: 'O navegador bloqueia o acesso a homologação desde a madrugada.',
      requesterName: 'Equipe QA',
      requesterEmail: 'qa@exemplo.com',
      department: 'infraestrutura',
      status: 'aberto',
      priority: 'alta',
      assignee: null,
      createdAt: hoursAgo(14),
      updatedAt: hoursAgo(14),
      comments: [],
    },
    {
      id: 'TCK-2034',
      subject: 'Boleto não chegou por e-mail',
      description: 'O boleto de outubro não foi entregue. Verificado o lixo eletrônico.',
      requesterName: 'Lúcia Prado',
      requesterEmail: 'lucia.prado@exemplo.com',
      department: 'financeiro',
      status: 'aguardando',
      priority: 'media',
      assignee: 'joana.martins',
      createdAt: hoursAgo(72),
      updatedAt: hoursAgo(20),
      comments: [],
    },
    {
      id: 'TCK-2033',
      subject: 'Exportação de relatório trava em 60%',
      description: 'A exportação em CSV trava sempre no mesmo ponto para períodos longos.',
      requesterName: 'Diego Matos',
      requesterEmail: 'diego.matos@exemplo.com',
      department: 'suporte',
      status: 'resolvido',
      priority: 'media',
      assignee: 'bruno.castro',
      createdAt: hoursAgo(200),
      updatedAt: hoursAgo(150),
      comments: [
        {
          id: 'c-5',
          author: 'bruno.castro',
          body: 'Tempo limite do relatório ajustado. Exportação de 12 meses concluída em 40s.',
          at: hoursAgo(150),
        },
      ],
    },
    {
      id: 'TCK-2032',
      subject: 'Solicitação de novo usuário para a equipe fiscal',
      description: 'Entrada da Camila Braga, que assume o fiscal a partir da próxima semana.',
      requesterName: 'Carlos Lima',
      requesterEmail: 'carlos.lima@exemplo.com',
      department: 'financeiro',
      status: 'aberto',
      priority: 'baixa',
      assignee: null,
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(30),
      comments: [],
    },
  ]
}

const store = globalThis as typeof globalThis & { __helpdeskTickets?: Ticket[] }

store.__helpdeskTickets ??= seed()

/**
 * Every ticket, most recently touched first.
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
 * Appends a note to a ticket.
 *
 * @param id - The ticket identifier.
 * @param author - Who is writing.
 * @param body - What they wrote.
 */
export function commentOnTicket(id: string, author: string, body: string): Ticket | undefined {
  const ticket = findTicket(id)

  if (!ticket) {
    return undefined
  }

  const at = new Date().toISOString()

  ticket.comments.push({ id: `c-${Date.now()}`, author, body, at })
  ticket.updatedAt = at

  return ticket
}

/**
 * Headline numbers for the dashboard.
 *
 * @param tickets - The tickets to summarise.
 */
export function summarise(tickets: Ticket[]): {
  open: number
  inProgress: number
  waiting: number
  resolved: number
  unassigned: number
  critical: number
} {
  return {
    open: tickets.filter((ticket) => ticket.status === 'aberto').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'em_andamento').length,
    waiting: tickets.filter((ticket) => ticket.status === 'aguardando').length,
    resolved: tickets.filter((ticket) => ticket.status === 'resolvido').length,
    unassigned: tickets.filter((ticket) => !ticket.assignee && ticket.status !== 'resolvido').length,
    critical: tickets.filter(
      (ticket) => ticket.priority === 'critica' && ticket.status !== 'resolvido',
    ).length,
  }
}

/**
 * Counts tickets by status and priority for one department.
 *
 * @param department - The department to report on.
 */
export function reportFor(department: string): {
  department: string
  total: number
  byStatus: Record<TicketStatus, number>
  byPriority: Record<TicketPriority, number>
  oldestOpenAt: string | null
} {
  const owned = listTickets().filter(
    (ticket) => ticket.department.toLowerCase() === department.toLowerCase(),
  )

  const byStatus: Record<TicketStatus, number> = {
    aberto: 0,
    em_andamento: 0,
    aguardando: 0,
    resolvido: 0,
  }

  const byPriority: Record<TicketPriority, number> = { baixa: 0, media: 0, alta: 0, critica: 0 }

  for (const ticket of owned) {
    byStatus[ticket.status] += 1
    byPriority[ticket.priority] += 1
  }

  const open = owned
    .filter((ticket) => ticket.status !== 'resolvido')
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt))

  return {
    department,
    total: owned.length,
    byStatus,
    byPriority,
    oldestOpenAt: open[0]?.createdAt ?? null,
  }
}

/** Statuses a ticket may be moved to, for validating an update. */
export const TICKET_STATUSES: TicketStatus[] = ['aberto', 'em_andamento', 'aguardando', 'resolvido']

/** Priorities a ticket may be moved to, for validating an update. */
export const TICKET_PRIORITIES: TicketPriority[] = ['baixa', 'media', 'alta', 'critica']
