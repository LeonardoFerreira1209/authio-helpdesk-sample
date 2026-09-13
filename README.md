# Helpdesk

Um sistema de chamados interno — pequeno, mas escrito como um produto de
verdade — que **não guarda usuário nenhum**. Login, cadastro de pessoas, papéis
e atributos vêm todos do Authio.

Existe para servir de exemplo a quem vai integrar: em vez de uma tela de
diagnóstico com respostas HTTP na cara do usuário, aqui a permissão aparece do
jeito que um produto mostra — o item some do menu, o botão fica desabilitado com
o motivo escrito, e a tela de acesso negado diz o que pedir e para quem.

Os chamados são dados de mentira, em memória. A identidade é real.

## Telas

| Tela | O que faz | Quem alcança |
| --- | --- | --- |
| **Início** | painel com a fila, o que está atribuído a você e a movimentação recente | qualquer papel do Helpdesk |
| **Chamados** | lista com busca e filtros | qualquer papel do Helpdesk |
| **Chamado** | detalhe, histórico, mudar status/prioridade, assumir, responder | leitura para todos; escrita para `agent` e `admin` |
| **Relatórios** | volume da **sua** área | quem tem o atributo `department` |
| **Equipe** | lista as pessoas e altera o acesso delas | `admin` |
| **Minha conta** | seus dados (grava no provedor) e o acesso que você tem | qualquer sessão |

Quem entra sem nenhum papel não vê uma tela vazia: cai num aviso de acesso
pendente que lista os três papéis e diz que um administrador concede — que é o
que acontece de verdade quando alguém é criado e ainda não recebeu acesso.

## Os papéis

| Papel | O que permite |
| --- | --- |
| `helpdesk.viewer` | acompanha a fila e lê os chamados, sem alterar nada |
| `helpdesk.agent` | atende: assume chamados, muda status e responde |
| `helpdesk.admin` | tudo isso, mais a gestão da equipe |

E um atributo, que **não** é papel:

| Claim | Para que serve |
| --- | --- |
| `department` | escopo dos relatórios — o valor escolhe as linhas, não só libera a tela |

Essa distinção é o ponto mais fácil de errar numa integração. Um papel responde
*"pode fazer?"*; um atributo como `department` responde *"sobre o quê?"*. Quem
resolve o segundo com papéis acaba com um papel por departamento.

## Onde a permissão é verificada

Em três camadas, e as três são necessárias:

1. **No menu** — `lib/nav.ts` esconde o que a pessoa não alcança. É cortesia com
   o usuário, **nunca** controle: qualquer um digita a URL.
2. **Na tela** — `lib/guard.ts` (`requirePage`, `requirePageRole`) roda no
   servidor antes de renderizar. Sem papel, redireciona para `/sem-permissao`
   dizendo o que falta.
3. **No endpoint** — `lib/session.ts` (`requireCaller`, `requireRole`) roda em
   toda rota que escreve. É esta a camada que decide de fato: o botão
   desabilitado da tela de chamado é dica visual, e o `PUT` continua recusando
   `403` para quem só tem `helpdesk.viewer`, venha a requisição de onde vier.

Trocar um papel no provedor **não** muda o token que já está na mão de alguém —
papéis são carimbados na emissão. Por isso a tela de equipe avisa que a mudança
vale a partir do próximo login da pessoa.

## Rodar

```bash
npm install
cp .env.example .env.local   # e preencher
npm run dev                  # http://localhost:3200
```

### Antes, no Authio

1. **Crie um client para esta aplicação** (sugestão: `helpdesk`):
   - `redirect_uri`: `http://localhost:3200/api/auth/callback/authio`
   - grants: `authorization_code` e `refresh_token`
   - escopos: `openid`, `profile`, `email`, `offline_access`
   - método: `client_secret_basic`
2. **Crie os papéis** `helpdesk.admin`, `helpdesk.agent` e `helpdesk.viewer` com
   estes nomes exatos e atribua a quem for testar. Os nomes são o contrato
   inteiro entre os dois lados (a comparação é case-insensitive).
3. **Para os relatórios**, registre a claim `department` no usuário (ex.:
   `suporte`, `financeiro` ou `infraestrutura`) e projete-a no token deste client
   por um claim mapper. Claim no usuário mas fora do token é o mesmo que claim
   ausente.
4. **Para as telas de conta e equipe**, preencha `AUTHIO_ADMIN_USERNAME` e
   `AUTHIO_ADMIN_PASSWORD` com um usuário **system** do realm. Sem isso o token
   administrativo sai sem `system_resource_access` e todo `/api/v1/admin`
   responde 403 — o erro mais confuso da integração, porque parece API quebrada e
   é credencial errada.

### Testando os papéis

Crie duas ou três contas no Authio com papéis diferentes e entre com cada uma. A
mesma tela muda de comportamento: o `viewer` abre o chamado com os controles
desabilitados, o `agent` atende, e só o `admin` enxerga **Equipe** no menu.

## Publicar (Railway, Render, Fly e afins)

**Não fixe porta.** O provedor injeta `PORT` e o `next start` já lê essa
variável — por isso o script `start` não passa `-p`. Só o `dev` fixa 3200, que é
local.

O que configurar no serviço:

| Variável | Valor |
| --- | --- |
| `NEXTAUTH_URL` | a URL pública do serviço (ex.: `https://helpdesk.up.railway.app`) |
| `NEXT_PUBLIC_AUTHIO_ISSUER` | o issuer do realm |
| `AUTHIO_ID` / `AUTHIO_CLIENT_SECRET` | o client desta aplicação |
| `AUTH_SECRET` | `openssl rand -base64 32`, só desta aplicação |
| `AUTHIO_URL` e as `AUTHIO_ADMIN_*` | o Admin API, se quiser conta e equipe |

Build `npm run build`, start `npm start`. E registre o `redirect_uri` novo no
client: `https://<seu-domínio>/api/auth/callback/authio` — o Authio compara por
origem, então um domínio novo normalmente pede um client novo.

## Onde olhar no código

| Arquivo | Por quê |
| --- | --- |
| `src/auth.ts` | o provider, os escopos, e a renovação com rotação de refresh token |
| `src/lib/authz.ts` | de onde os papéis são lidos no token, e os nomes que esta app usa |
| `src/lib/guard.ts` | guardas de tela |
| `src/lib/session.ts` | guardas de endpoint |
| `src/lib/authio.ts` | o cliente do Admin API, e por que o token dele vem de um usuário system |
| `src/app/api/profile/route.ts` | por que o `PUT` relê o usuário antes de gravar |
| `src/components/team-table.tsx` | por que papéis fora do Helpdesk são devolvidos intactos |
