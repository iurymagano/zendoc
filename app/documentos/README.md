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

**Quando emite:** o texto afirma que o cliente "compareceu", então o documento só é
gerado se o atendimento **já começou** e **não** está `cancelled`/`no_show`
(`declarationEligibility`). Atendimento futuro mostra o aviso "A declaração fica
disponível depois do atendimento."; cancelado ou falta mostra o aviso
correspondente. Em ambos há o botão "Voltar para a agenda" e nada para imprimir.

**Depende de:** `@/auth`, `@/lib/supabase`, `@/lib/appointments/declaration`,
`@/components/documents/PrintButton`, `@/components/ui/button`, `@/types/database`.

**Notas:** recibo de pagamento fica para o módulo financeiro (precisa do valor
do atendimento) — ver Sprint 6 em `TASKS.md`.
