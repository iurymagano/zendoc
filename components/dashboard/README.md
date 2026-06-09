# components/dashboard/

Shell compartilhado pelas páginas autenticadas (grupo `app/(dashboard)/`).

---

## Navbar.tsx

**O que faz:** navbar sticky com logo IAzen, navegação e botão de sair. As áreas
do dia a dia (Visão geral, Agenda, Conversas, Pacientes) ficam no topo; as
configurações (Disponibilidade, Serviços, Google Agenda, WhatsApp, Testar IA,
Assinatura) ficam num dropdown **"Configurações ▾"** — evita poluir a barra
conforme o produto cresce. No mobile, vira duas faixas (áreas + Config).

**Exporta:**

- `<Navbar />` — client component, lê `usePathname()` para destacar o item ativo.

**Comportamentos:**

- **Badge de notificação** no item "Conversas" — total de conversas que precisam
  de resposta (`GET /api/conversations/attention-count`, poll 30s), posicionado
  em `absolute` no canto.
- **Dropdown de Configurações** — abre/fecha por clique, fecha ao clicar fora
  (listener de `mousedown`) e ao escolher um item; o gatilho fica destacado em
  qualquer rota `/configuracoes/*`.

**Depende de:** `next/link`, `next/navigation`, `next-auth/react` (`signOut`),
`lucide-react` (`ChevronDown`), `@/components/brand/Logo`,
`@/components/ui/button`, `@/lib/utils`.

**Notas:** renderizado pelo `app/(dashboard)/layout.tsx`. Ao adicionar uma tela
de configuração, basta incluí-la em `SETTINGS` (não precisa mexer no layout).

---

## PageHeader.tsx

**O que faz:** cabeçalho padronizado das páginas internas — eyebrow (font-mono, uppercase), título em Space Grotesk e descrição + área opcional de ações.

**Exporta:**

- `<PageHeader eyebrow? title description? actions? />` — server-friendly, sem client hooks.

**Depende de:** nada além de React.

**Notas:** usar em toda página dentro de `(dashboard)/` para manter o layout consistente. O título aplica `letter-spacing: -0.03em` conforme o design system.
