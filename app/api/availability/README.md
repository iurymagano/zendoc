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
