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

## POST /api/appointments

Cria um appointment manual (`booked_via = 'manual'`, `status = 'scheduled'`).

**Payload:**

```json
{
  "patient_name": "Maria Silva",
  "patient_phone": "5511999998888",
  "cpf": "390.533.447-05",
  "starts_at": "2026-05-10T10:00:00-03:00",
  "ends_at":   "2026-05-10T10:50:00-03:00",
  "notes": "primeira consulta (opcional)"
}
```

- Paciente é **reaproveitado por telefone** (upsert em
  `patients(professional_id, phone)`) — mesmo comportamento que o fluxo da IA.
- `cpf` opcional (validado por checksum). Quando informado, é gravado no
  paciente durante o upsert; quando ausente, **não** sobrescreve um CPF já
  cadastrado.
- Timestamps precisam ter offset (`-03:00`). O cliente
  [`/agenda`](../../(dashboard)/agenda/README.md) converte `datetime-local` +
  `:00-03:00` antes de enviar.

**Retorno:** `{ ok: true, appointment }`.

**Erros:**

- `400` — validação Zod falhou (inclui `ends_at <= starts_at`) ou CPF inválido.
- `409` — conflito com outro appointment ativo no mesmo horário (checagem
  em [lib/appointments/conflicts.ts](../../../lib/appointments/conflicts.ts)).

## Subpastas

- [\[id\]/](./[id]/) — `GET`, `PATCH`, e subpasta `cancel/` com o cancelamento.
