# app/(dashboard)/pacientes/

Tela de cadastro e gestão manual de pacientes.

## page.tsx

**O que faz:** client component com busca, listagem e formulário inline para
criar/editar pacientes.

**Fluxo:**

1. Ao montar, faz `GET /api/patients` e preenche a lista.
2. Botão "Novo paciente" abre o formulário inline zerado (`POST`).
3. Botão "Editar" em cada linha abre o mesmo formulário pré-preenchido
   (`PATCH /api/patients/:id`).
4. Botão "Excluir" pede confirmação via `window.confirm` e chama
   `DELETE /api/patients/:id`.
5. Busca local por nome, telefone ou CPF filtra a lista já carregada (não
   refaz `GET` — assume que o volume é baixo para o MVP).

**Formatação:**

- Telefone armazenado como dígitos puros no banco (`5511999998888`), mas
  renderizado na lista como `(11) 99999-8888` ou `+55 (11) 99999-8888`
  dependendo do tamanho.
- CPF é opcional. O input usa `maskCpfInput` (máscara `000.000.000-00` ao
  digitar) e é validado por checksum no submit; persiste só com dígitos. Na
  lista aparece como `CPF 000.000.000-00` quando preenchido.
- No submit, qualquer caractere não-dígito é removido antes de enviar à API.

**Depende de:**

- `@/components/ui/{button,input,textarea,card,form-field}`
- `@/lib/patients/cpf` (`formatCpf`, `isValidCpf`, `maskCpfInput`, `normalizeCpf`)
- `GET|POST /api/patients`, `PATCH|DELETE /api/patients/[id]`

**Notas:**

- Não usa modal (shadcn `dialog` não instalado) — o formulário vive na mesma
  página, ocultável. Se a lista crescer, vale revisar com `dialog` ou drawer.
- A exclusão é hard delete. A FK `appointments.patient_id ON DELETE SET NULL`
  mantém o histórico de atendimentos — o appointment ainda guarda
  `patient_name`/`patient_phone` desnormalizados.
- Cada linha tem botão "Histórico" que navega para `/pacientes/[id]` com a
  visão de próximas consultas + histórico completo.

## Subpastas

- [\[id\]/](./[id]/) — página de detalhe + histórico do paciente.
