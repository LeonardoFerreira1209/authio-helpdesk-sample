import { BuildingIcon, ChartIcon, ClockIcon, FlameIcon, InboxIcon } from '@/components/icons'
import { STATUS_COLOR } from '@/components/ticket-badges'
import { claimValue, DEPARTMENT_CLAIM } from '@/lib/authz'
import { relative } from '@/lib/format'
import { requirePage } from '@/lib/guard'
import { PRIORITY_LABEL, reportFor, STATUS_LABEL, TICKET_STATUSES } from '@/lib/tickets'

/**
 * Volume for the person's own area.
 *
 * Gated on a claim instead of a role, and the claim's *value* picks the rows. A
 * role would have answered "may this person open a report"; only the claim
 * answers "a report on what".
 */
export default async function ReportsPage() {
  const caller = await requirePage()
  const department = claimValue(caller.claims, DEPARTMENT_CLAIM)

  if (!department) {
    return (
      <div className="stack">
        <div className="page-head">
          <div>
            <h1>Relatórios</h1>
            <p>Volume de chamados da sua área.</p>
          </div>
        </div>

        <div className="card">
          <h2>
            <BuildingIcon size={16} />
            Sua conta não está vinculada a uma área
          </h2>
          <p>
            O relatório é sempre da área de quem abre — e a sua conta não informa nenhuma. Peça a um
            administrador para registrar o atributo <code>{DEPARTMENT_CLAIM}</code> no seu usuário.
          </p>
          <div className="note">
            Diferente dos papéis, este atributo não diz o que você pode fazer, e sim sobre quais
            registros. Por isso ele é pedido aqui e em nenhuma outra tela.
          </div>
        </div>
      </div>
    )
  }

  const report = reportFor(department)
  const maximum = Math.max(1, ...TICKET_STATUSES.map((status) => report.byStatus[status]))

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Relatórios</h1>
          <p>
            Área <strong>{department}</strong> · {report.total} chamado(s) no período.
          </p>
        </div>
        <span className="badge accent">
          <BuildingIcon size={12} />
          escopo definido pela sua conta
        </span>
      </div>

      <div className="cards">
        <div className="stat">
          <div>
            <div className="value">{report.total}</div>
            <div className="label">Total da área</div>
          </div>
          <span className="icon-chip">
            <ChartIcon size={17} />
          </span>
        </div>
        <div className="stat">
          <div>
            <div className="value">{report.total - report.byStatus.resolvido}</div>
            <div className="label">Em aberto</div>
          </div>
          <span className="icon-chip tone-info">
            <InboxIcon size={17} />
          </span>
        </div>
        <div className="stat">
          <div>
            <div className="value">{report.byPriority.critica + report.byPriority.alta}</div>
            <div className="label">Alta ou crítica</div>
          </div>
          <span className="icon-chip tone-danger">
            <FlameIcon size={16} />
          </span>
        </div>
        <div className="stat">
          <div>
            <div className="value" style={{ fontSize: 18, paddingTop: 6 }}>
              {report.oldestOpenAt ? relative(report.oldestOpenAt) : '—'}
            </div>
            <div className="label">Mais antigo em aberto</div>
          </div>
          <span className="icon-chip tone-warn">
            <ClockIcon size={17} />
          </span>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <h2>Por status</h2>
          <p>Distribuição atual da fila da área.</p>

          <div className="stack" style={{ gap: 12 }}>
            {TICKET_STATUSES.map((status) => (
              <div key={status}>
                <div className="between" style={{ marginBottom: 4 }}>
                  <span>{STATUS_LABEL[status]}</span>
                  <strong>{report.byStatus[status]}</strong>
                </div>
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(report.byStatus[status] / maximum) * 100}%`,
                      background: STATUS_COLOR[status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Por prioridade</h2>
          <p>Onde está a pressão da área.</p>

          <dl className="definition">
            {(['critica', 'alta', 'media', 'baixa'] as const).map((priority) => (
              <div key={priority}>
                <dt>{PRIORITY_LABEL[priority]}</dt>
                <dd>{report.byPriority[priority]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
