# Helpdesk — aplicação de exemplo sobre o Authio

Um atendimento interno fictício, do tamanho de um projeto real pequeno, que **não
guarda usuário nenhum**: login, cadastro, papéis e claims são todos do Authio.
Serve para testar a integração ponta a ponta — e para ver, na tela, a diferença
entre "papel" e "claim" quando um endpoint recusa alguém.

É um cliente comum do Authio, escrito como um tenant escreveria — não uma bancada
que audita o provedor.

## O que tem dentro

Uma tela só, em `/`, com quatro blocos:

| Bloco | O que exercita |
| --- | --- |
| **Quem o Authio diz que você é** | claims e papéis lidos do access token, com as permissões que cada papel carrega |
| **Meu perfil** | `GET` e `PUT` em `/api/profile` → lê e grava o usuário no Authio |
| **Endpoints protegidos** | chama os endpoints da própria app e mostra 200/401/403 com o corpo cru |
| **Equipe** | `GET /api/team` e `PUT /api/team/{id}` → lista usuários do client e troca os papéis deles |

### Endpoints e o que cada um exige

| Endpoint | Exige |
| --- | --- |
| `GET /api/profile` | qualquer sessão válida |
| `PUT /api/profile` | qualquer sessão válida (só mexe no próprio registro — o id vem do `sub`) |
| `GET /api/tickets` | papel `helpdesk.viewer`, `helpdesk.agent` ou `helpdesk.admin` |
| `PUT /api/tickets/{id}` | papel `helpdesk.agent` ou `helpdesk.admin` |
| `GET /api/reports` | claim `department` no token — e o **valor** dela decide quais chamados aparecem |
| `GET /api/team` | papel `helpdesk.admin` |
| `PUT /api/team/{id}` | papel `helpdesk.admin` |

O par `GET /api/tickets` + `PUT /api/tickets/{id}` é o que vale olhar primeiro:
um `helpdesk.viewer` recebe 200 na leitura e 403 na escrita. E o `/api/reports`
é o contraste com os outros — um papel responderia "pode abrir relatório?", e só
a claim responde "relatório de quê".

Os chamados vivem em memória, de propósito: um banco só somaria uma segunda
coisa para configurar errado.

## Subir

```bash
npm install
cp .env.example .env.local   # e preencher
npm run dev                  # http://localhost:3200
```

A porta é 3200 para não brigar com o console do Authio (3000) nem com a bancada
de testes (3100).

### Antes, no Authio

1. **Crie um client para esta aplicação** (sugestão: `helpdesk`). Vale um client
   só dela: o Authio compara a `redirect_uri` por origem, e :3200 não cabe no
   cadastro de quem atende em :3000.
   - `redirect_uri`: `http://localhost:3200/api/auth/callback/authio`
   - grants: `authorization_code` e `refresh_token`
   - escopos: `openid`, `profile`, `email`, `offline_access`
   - método: `client_secret_basic`
2. **Crie os três papéis** com estes nomes exatos e atribua a quem for testar:
   `helpdesk.admin`, `helpdesk.agent`, `helpdesk.viewer`. Os nomes são o contrato
   inteiro entre os dois lados (a comparação é case-insensitive).
3. **Para o `/api/reports`**, ponha uma claim `department` no usuário (ex.:
   `suporte` ou `financeiro`) e projete ela no token deste client por um claim
   mapper. Claim no usuário mas fora do token é o mesmo que claim ausente, e o
   corpo do 403 diz isso.
4. **Para os painéis de perfil e equipe**, preencha `AUTHIO_ADMIN_USERNAME` /
   `AUTHIO_ADMIN_PASSWORD` com um usuário **system** do realm. Sem isso o token
   administrativo sai sem `system_resource_access` e todo `/api/v1/admin`
   responde 403 — o erro mais confuso daqui, porque parece API quebrada e é
   credencial errada.

## Como os papéis chegam

O Authio entrega os papéis de um usuário de client na claim
`user_resource_access`: um objeto JSON cujas chaves são os nomes dos papéis e
cujos valores dizem o que cada um pode. `lib/authz.ts` lê essa forma e também as
formas `realm_access` / `resource_access` / `roles`, para que apontar a app para
um realm configurado de outro jeito não produza silenciosamente um usuário sem
papel algum.

Trocar um papel no Authio **não** muda o token que já está na mão de alguém —
papéis são carimbados na emissão. A tela diz isso onde importa.

## Onde olhar no código

| Arquivo | Por quê |
| --- | --- |
| `src/auth.ts` | o provider, os escopos, e a renovação com rotação de refresh token |
| `src/lib/authz.ts` | de onde os papéis são lidos, e os nomes que esta app usa |
| `src/lib/session.ts` | `requireCaller`, `requireRole`, `requireClaim` — os guardas |
| `src/lib/authio.ts` | o cliente do Admin API, e por que o token dele vem de um usuário system |
| `src/app/api/profile/route.ts` | por que o `PUT` relê o usuário antes de gravar |
