# components/dashboard/

Shell compartilhado pelas páginas autenticadas (grupo `app/(dashboard)/`).

---

## Sidebar.tsx

**O que faz:** navegação lateral (estilo app) da área interna — sidebar fixa à
esquerda no desktop e drawer (gaveta) no mobile. Itens com ícone (lucide),
divididos em **áreas do dia a dia** (Visão geral, Assistente, Agenda, Conversas, Clientes)
e o grupo **Configurações** (Disponibilidade, Serviços, Google Agenda, WhatsApp,
Testar IA, Assinatura). Rodapé com "Sair".

**Exporta:**

- `<Sidebar />` — client component, lê `usePathname()` para destacar o item ativo
  (barra violeta à esquerda + `bg-sidebar-accent`; fundo Void, sem sombra nem borda).

**Comportamentos:**

- **Badge de notificação** no item "Conversas" — total de conversas que precisam
  de resposta (`GET /api/conversations/attention-count`, poll 30s). No mobile, um
  ponto vermelho aparece no ícone do menu (hambúrguer).
- **Mobile:** barra superior com logo + hambúrguer abre o drawer; fecha ao clicar
  fora, no X, ou ao escolher um item.
- **Sino de notificações** ([components/notifications](../notifications/README.md)):
  `NotificationBell variant="sheet"` na barra superior do mobile e
  `variant="popover"` no canto superior direito da sidebar no desktop. Ambos leem
  o mesmo `NotificationsProvider` (um polling só).

**Depende de:** `next/link`, `next/navigation`, `next-auth/react` (`signOut`),
`lucide-react` (ícones), `@/components/brand/Logo`, `@/lib/utils`.

- **Rodapé com perfil:** avatar com iniciais (violeta de ação, sem gradiente) + nome e
  especialidade (`GET /api/professionals`), acima do "Sair".

**Notas:** renderizada pelo `app/(dashboard)/layout.tsx` (que aplica `md:pl-64`
no conteúdo para liberar a largura da sidebar fixa). Ao adicionar uma tela, basta
incluí-la em `PRIMARY` ou `SETTINGS`. Usa os tokens `--sidebar-*` do tema.

---

## EmptyState.tsx

**O que faz:** estado vazio padronizado — símbolo do logo em mono como único ornamento, título, descrição
opcional e slot de ação (`children`). A prop `icon` é aceita por compatibilidade e não é desenhada. Usado em listas sem itens (conversas,
serviços, …).

**Exporta:** `<EmptyState icon title description? children? />`.

---

## PageHeader.tsx

**O que faz:** cabeçalho padronizado das páginas internas — título em Sora 700, descrição de uma frase e área opcional de ações. Sem eyebrow (redesign premium).

**Exporta:**

- `<PageHeader title description? actions? eyebrow? />` — server-friendly, sem client hooks. `eyebrow` é `@deprecated`: aceito para as páginas que ainda o passam, mas **não é mais exibido**; remover das chamadas ao tocar em cada página.

**Depende de:** nada além de React.

**Notas:** usar em toda página dentro de `(dashboard)/` para manter o layout consistente. O título aplica `letter-spacing: -0.03em` conforme o design system.

## home/

Blocos da página inicial `/dashboard`. Ver [home/README.md](./home/README.md).
---

## UrlParamEffect.tsx

**O que faz:** efeito sem UI que reage a um parâmetro da URL, usado pelos links das notificações para abrir a agenda num dia (`?date=`) ou a caixa de conversas num contato (`?phone=`) mesmo com a página já aberta.

**Exporta:**

- `UrlParamEffect({ name, onChange })` — chama `onChange(valor)` quando o parâmetro `name` aparece ou muda.

**Notas:** o parâmetro `n` (id da notificação) conta como mudança, então clicar na mesma notificação de novo dispara de novo. Usa `useSearchParams`: precisa estar dentro de um `<Suspense>`. Usado em `app/(dashboard)/agenda/page.tsx` e `app/(dashboard)/conversas/page.tsx`.
