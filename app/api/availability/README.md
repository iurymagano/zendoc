# app/api/availability/

Endpoints de gerenciamento de disponibilidade do profissional.

## weekly/route.ts

**Endpoints:**

- `GET /api/availability/weekly` — retorna `{ blocks: AvailabilityWeekly[] }`
  com todos os blocos semanais do profissional logado.
- `POST /api/availability/weekly` — substitui **todos** os blocos semanais do
  profissional pelo payload enviado (delete-then-insert em transação lógica).

**Payload do POST:**

```json
{
  "blocks": [
    {
      "weekday": 1,
      "block_type": "morning",
      "start_time": "08:00",
      "end_time": "12:00",
      "slot_duration": 50,
      "is_active": true
    }
  ]
}
```

**Autenticação:** ambos exigem sessão NextAuth. 401 se não logado, 404 se o
usuário não tem perfil em `professionals`.

**Notas:**

- A semântica de "replace all" simplifica o cliente — ele manda sempre o estado
  completo. Se os volumes de blocos crescerem muito, passar para diffing.
- Validação com Zod: `start_time < end_time`, `weekday 0..6`,
  `slot_duration 15..240`.

## exceptions/route.ts

**Endpoints:**

- `GET /api/availability/exceptions?from=YYYY-MM-DD&to=YYYY-MM-DD` — retorna
  `{ exceptions: AvailabilityException[] }` ordenadas por data. `from`/`to` são
  opcionais; sem filtro, devolve todas as exceções do profissional.
- `POST /api/availability/exceptions` — cria **ou substitui** (upsert em
  `professional_id,date`) uma exceção pontual.

**Payload do POST:**

```json
{
  "date": "2026-05-01",
  "type": "day_off",
  "start_time": null,
  "end_time": null,
  "slot_duration": null,
  "note": "Feriado do trabalhador"
}
```

Para `type = "custom_hours"` ou `"extra_day"`, `start_time`, `end_time` e
`slot_duration` são obrigatórios (com `start_time < end_time`). Para
`type = "day_off"`, campos de horário são forçados para `null` no servidor.

## exceptions/[id]/route.ts

**Endpoints:**

- `DELETE /api/availability/exceptions/:id` — remove uma exceção pelo ID. A
  query filtra por `professional_id` também, garantindo isolamento entre
  profissionais mesmo com `service key` server-side.

**Autenticação:** idem weekly — 401 sem sessão, 404 sem perfil.
