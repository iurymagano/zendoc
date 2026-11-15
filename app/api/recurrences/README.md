# app/api/recurrences/

Séries de atendimentos recorrentes (semanal/quinzenal). A regra fica em
`recurrences`; os appointments são materializados — lógica em
[lib/recurrences/](../../../lib/recurrences/).

## route.ts

**`POST /api/recurrences`** — cria a série e materializa as primeiras ocorrências.

**Payload:**

```json
{
  "patient_name": "Maria Silva",
  "patient_phone": "5511999998888",
  "cpf": "390.533.447-05",
  "starts_at": "2026-06-10T15:00:00-03:00",
  "ends_at":   "2026-06-10T15:50:00-03:00",
  "frequency": "weekly" | "biweekly",
  "until": "2026-12-31",
  "notes": "opcional"
}
```

- `start_date`/`weekday`/`start_time`/`end_time` são derivados do `starts_at`
  (ISO sempre `-03:00` → slice exato); início e fim devem ser no mesmo dia.
- `patient_phone` é normalizado no servidor (`normalizePhoneBR`, `55` + DDD +
  número), igual ao booking.
- Reaproveita/cria o cliente por telefone (igual ao booking).
- A 1ª data (a do `starts_at`) é criada **mesmo se já passou** (`includePastStart`),
  como no agendamento único; as demais datas passadas não. A tela da agenda mostra
  um aviso com `created`/`skipped` (datas fora por conflito).

**Retorno:** `{ ok, recurrence, created, skipped }`. 401/404/400 nos casos usuais.

## Subpastas

- [\[id\]/stop/](./[id]/stop/) — `POST` encerra a série (cancela as futuras).
- [materialize/](./materialize/) — `GET|POST` cron (Bearer `CRON_SECRET`) que
  mantém ~8 semanas de cada série ativa materializadas à frente (diário em
  `vercel.json`).
