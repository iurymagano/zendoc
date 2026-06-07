# app/api/patients/

CRUD de pacientes cadastrados pelo profissional logado. Pacientes também são
criados automaticamente pelo fluxo da IA (upsert em
[lib/ai/executor.ts](../../../lib/ai/executor.ts)) na ação `book`.

## route.ts

**Endpoints:**

- `GET /api/patients?q=termo` — lista pacientes do profissional. Se `q` for
  passado, filtra por `name ILIKE %q% OR phone ILIKE %q%` (case-insensitive);
  quando `q` contém dígitos, também busca `cpf ILIKE %dígitos%`.
- `POST /api/patients` — cria um paciente.

**Payload do POST:**

```json
{
  "name": "Maria Silva",
  "phone": "5511999998888",
  "cpf": "390.533.447-05",
  "notes": "Primeira consulta em 10/05 — encaminhamento do Dr. João"
}
```

- `phone` — 11 a 13 dígitos (com DDI/DDD). Validação server-side.
- `cpf` — opcional. Aceita com ou sem máscara; validado por checksum
  ([lib/patients/cpf.ts](../../../lib/patients/cpf.ts)) e persistido só com
  dígitos. Vazio/ausente → `null`.
- `notes` — opcional, até 2000 caracteres.

**Erros:**

- `400` — validação Zod falhou ou CPF inválido.
- `401` — sem sessão.
- `404` — perfil não encontrado.
- `409` — telefone ou CPF duplicado para o mesmo profissional (uniques
  `professional_id,phone` e `patients_professional_cpf_idx`). A mensagem
  diferencia qual campo colidiu.
- `500` — erro genérico do banco.

## Subpastas

- [\[id\]/](./[id]/) — operações em um paciente específico (`GET`, `PATCH`,
  `DELETE`).
