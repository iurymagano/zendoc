# components/dashboard/

Shell compartilhado pelas páginas autenticadas (grupo `app/(dashboard)/`).

---

## Sidebar.tsx

**O que faz:** navegação lateral (estilo app) da área interna — sidebar fixa à
esquerda no desktop e drawer (gaveta) no mobile. Itens com ícone (lucide),
divididos em **áreas do dia a dia** (Visão geral, Agenda, Conversas, Pacientes)
e o grupo **Configurações** (Disponibilidade, Serviços, Google Agenda, WhatsApp,
Testar IA, Assinatura). Rodapé com "Sair".

**Exporta:**

- `<Sidebar />` — client component, lê `usePathname()` para destacar o item ativo
  (barra de acento à esquerda + fundo `bg-primary/10`).

**Comportamentos:**

- **Badge de notificação** no item "Conversas" — total de conversas que precisam
  de resposta (`GET /api/conversations/attention-count`, poll 30s). No mobile, um
  ponto vermelho aparece no ícone do menu (hambúrguer).
- **Mobile:** barra superior com logo + hambúrguer abre o drawer; fecha ao clicar
  fora, no X, ou ao escolher um item.

**Depende de:** `next/link`, `next/navigation`, `next-auth/react` (`signOut`),
`lucide-react` (ícones), `@/components/brand/Logo`, `@/lib/utils`.

- **Rodapé com perfil:** avatar com iniciais (gradiente azul→violeta) + nome e
  especialidade (`GET /api/professionals`), acima do "Sair".

**Notas:** renderizada pelo `app/(dashboard)/layout.tsx` (que aplica `md:pl-64`
no conteúdo para liberar a largura da sidebar fixa). Ao adicionar uma tela, basta
incluí-la em `PRIMARY` ou `SETTINGS`. Usa os tokens `--sidebar-*` do tema.

---

## EmptyState.tsx

**O que faz:** estado vazio padronizado — ícone num círculo, título, descrição
opcional e slot de ação (`children`). Usado em listas sem itens (conversas,
serviços, …).

**Exporta:** `<EmptyState icon title description? children? />`.

---

## PageHeader.tsx

**O que faz:** cabeçalho padronizado das páginas internas — eyebrow (font-mono, uppercase), título em Space Grotesk e descrição + área opcional de ações.

**Exporta:**

- `<PageHeader eyebrow? title description? actions? />` — server-friendly, sem client hooks.

**Depende de:** nada além de React.

**Notas:** usar em toda página dentro de `(dashboard)/` para manter o layout consistente. O título aplica `letter-spacing: -0.03em` conforme o design system.
