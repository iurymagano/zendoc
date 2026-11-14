# app/documentos/

Documentos imprimíveis gerados a partir dos dados da agenda. Rotas **fora**
do grupo `(dashboard)` de propósito — sem navbar, layout limpo pra impressão/PDF.
Protegidas por login no `proxy.ts` (`path.startsWith('/documentos')`).

## Subpastas

- [declaracao/[id]/](./declaracao/) — declaração de comparecimento de um
  appointment.

## declaracao/[id]/page.tsx

**O que faz:** server component que monta a **declaração de comparecimento** a
partir de um appointment do profissional logado (nome do cliente, data e
horário do atendimento), com cabeçalho (nome/especialidade/endereço do
profissional) e linha de assinatura. Imprime via `<PrintButton>`.

**Acesso:** exige sessão; valida que o appointment pertence ao
`professional` do usuário (404 caso contrário). Linkado na `/agenda` (botão
"Declaração" no formulário de edição, oculto para atendimentos cancelados).

**Depende de:** `@/auth`, `@/lib/supabase`, `@/components/documents/PrintButton`,
`@/types/database`.

**Notas:** recibo de pagamento fica para o módulo financeiro (precisa do valor
do atendimento) — ver Sprint 6 em `TASKS.md`.
