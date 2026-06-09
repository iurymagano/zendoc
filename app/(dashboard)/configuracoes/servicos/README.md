# app/(dashboard)/configuracoes/servicos/

## page.tsx

**O que faz:** client component para gerenciar os **tipos de serviço** (nome,
duração, preço) e o **intervalo entre atendimentos** (buffer) do profissional.

**Fluxo:**

- Carrega serviços (`GET /api/services`) e o buffer (`GET /api/professionals`).
- Card "Intervalo entre atendimentos": campo em minutos → `PATCH /api/professionals`.
- Form de criar/editar serviço → `POST`/`PATCH /api/services`. Preço é digitado
  em reais e convertido para centavos (`priceToCents`).
- Lista com ativar/desativar (`active`), editar e excluir.

**Depende de:** `@/components/ui/{button,input,card,form-field}`,
`@/components/dashboard/PageHeader`, `/api/services`, `/api/professionals`.

**Notas:** os serviços ativos aparecem no seletor "Serviço" da `/agenda`, onde
o fim do agendamento é calculado pela duração escolhida.
