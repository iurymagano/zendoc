# app/api/patients/

CRUD de clientes cadastrados pelo profissional logado. Clientes também são
criados automaticamente pelo fluxo da IA (upsert em
[lib/ai/executor.ts](../../../lib/ai/executor.ts)) na ação `book`.

## route.ts

**Endpoints:**

- `GET /api/patients?q=termo` — lista clientes do profissional. Se `q` for
  passado, filtra por `name ILIKE %q%` (case-insensitive); quando `q` contém
  dígitos, também busca `phone` e `cpf` por `ILIKE %dígitos%` (telefone e CPF
  são gravados só com dígitos, então "(11) 91111-2222" acha o cliente).
- `POST /api/patients` — cria um cliente.

**Payload do POST:**

```json
{
  "name": "Maria Silva",
  "phone": "5511999998888",
  "cpf": "390.533.447-05",
  "notes": "Primeiro atendimento em 10/05 — encaminhamento do Dr. João"
}
```

- `phone` — aceita qualquer formato (com/sem máscara, com/sem DDI). O servidor
  normaliza com `normalizePhoneBR` (`lib/phone.ts`) e grava `55` + DDD + número;
  se não resultar em 12–13 dígitos → 400. `PATCH /api/patients/[id]` idem.
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

- [\[id\]/](./[id]/) — operações em um cliente específico (`GET`, `PATCH`,
  `DELETE`). O `PATCH` aceita `messaging_opted_out` (LGPD — opor-se a mensagens
  ativas). `[id]/export/` devolve um JSON com cadastro + agendamentos + conversa
  (direito de acesso/portabilidade).
