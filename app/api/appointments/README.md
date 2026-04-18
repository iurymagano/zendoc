# app/api/appointments/

Endpoints de leitura e manipulação manual dos appointments do profissional
logado. Appointments também são criados pelo fluxo da IA em
[lib/ai/executor.ts](../../../lib/ai/executor.ts).

## route.ts

**Endpoint:**

- `GET /api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD` — retorna
  `{ appointments: Appointment[] }` ordenados por `starts_at` ascendente.
  Inclui todos os status (`scheduled`, `confirmed`, `pending_approval`,
  `cancelled`, `no_show`) — filtrar visualmente fica a cargo do cliente.

**Parâmetros:**

- `from` e `to` — obrigatórios, formato `YYYY-MM-DD`. São interpretados como
  00:00 em `America/Sao_Paulo` (`fromT00:00:00-03:00`). A query usa
  `starts_at >= from AND starts_at < to` (intervalo semiaberto).

**Erros:**

- `400` — parâmetros ausentes ou fora do formato.
- `401` — sem sessão.
- `404` — perfil não encontrado.
- `500` — erro do banco.

**Notas:**

- O endpoint filtra por `professional_id` derivado da sessão — isolamento
  garantido mesmo usando `SUPABASE_SERVICE_KEY`.
- POST/PATCH/DELETE entram no próximo PR (criação/cancelamento manual).
