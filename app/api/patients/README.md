# app/api/patients/

CRUD de pacientes cadastrados pelo profissional logado. Pacientes também são
criados automaticamente pelo fluxo da IA (upsert em
[lib/ai/executor.ts](../../../lib/ai/executor.ts)) na ação `book`.

## route.ts

**Endpoints:**

- `GET /api/patients?q=termo` — lista pacientes do profissional. Se `q` for
  passado, filtra por `name ILIKE %q% OR phone ILIKE %q%` (case-insensitive).
- `POST /api/patients` — cria um paciente.

**Payload do POST:**

```json
{
  "name": "Maria Silva",
  "phone": "5511999998888",
  "notes": "Primeira consulta em 10/05 — encaminhamento do Dr. João"
}
```

- `phone` — 11 a 13 dígitos (com DDI/DDD). Validação server-side.
- `notes` — opcional, até 2000 caracteres.

**Erros:**

- `400` — validação Zod falhou.
- `401` — sem sessão.
- `404` — perfil não encontrado.
- `409` — telefone duplicado para o mesmo profissional (unique
  `professional_id,phone`).
- `500` — erro genérico do banco.

## Subpastas

- [\[id\]/](./[id]/) — operações em um paciente específico (`GET`, `PATCH`,
  `DELETE`).
