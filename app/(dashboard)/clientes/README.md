# app/(dashboard)/clientes/

Tela de cadastro e gestão manual de clientes.

## page.tsx

**O que faz:** client component com busca, listagem e formulário inline para
criar/editar clientes.

**Fluxo:**

1. Ao montar, faz `GET /api/patients` e preenche a lista.
2. Botão "Novo cliente" abre o formulário inline zerado (`POST`).
3. Botão "Editar" em cada linha abre o mesmo formulário pré-preenchido
   (`PATCH /api/patients/:id`).
4. Botão "Excluir" pede confirmação via `window.confirm` e chama
   `DELETE /api/patients/:id`.
5. Busca local por nome, telefone ou CPF filtra a lista já carregada (não
   refaz `GET` — assume que o volume é baixo para o MVP).

**Formatação:**

- Telefone armazenado como dígitos puros com DDI no banco (`5511999998888`),
  renderizado na lista com `formatPhoneBR` (`+55 (11) 99999-8888`). No form, o campo
  usa `MaskedInput` (`(11) 99999-8888`; ao editar, o valor do banco já aparece
  formatado via `maskPhone`). O form aceita com/sem DDI: normaliza com `normalizePhoneBR` (`lib/phone.ts`) antes
  de enviar, e a API normaliza de novo (fonte da verdade é o servidor).
- CPF é opcional. O input usa `MaskedInput mask="cpf"` (máscara `000.000.000-00` ao
  digitar) e é validado por checksum no submit; persiste só com dígitos. Na
  lista aparece como `CPF 000.000.000-00` quando preenchido.
- No submit, o telefone é normalizado (só dígitos + `55` se faltar o DDI) antes de enviar à API.

**Depende de:**

- `@/components/ui/{button,input,masked-input,textarea,card,form-field}`
- `@/lib/masks` (`maskPhone`)
- `@/lib/patients/cpf` (`formatCpf`, `isValidCpf`, `normalizeCpf`)
- `GET|POST /api/patients`, `PATCH|DELETE /api/patients/[id]`

**Notas:**

- Não usa modal (shadcn `dialog` não instalado) — o formulário vive na mesma
  página, ocultável. Se a lista crescer, vale revisar com `dialog` ou drawer.
- A exclusão é hard delete. A FK `appointments.patient_id ON DELETE SET NULL`
  mantém o histórico de atendimentos — o appointment ainda guarda
  `patient_name`/`patient_phone` desnormalizados.
- Cada linha tem botão "Histórico" que navega para `/clientes/[id]` com a
  visão de próximos atendimentos + histórico completo.

## Subpastas

- [\[id\]/](./[id]/) — página de detalhe + histórico do cliente.
