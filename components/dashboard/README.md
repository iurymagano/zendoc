# components/dashboard/

Shell compartilhado pelas páginas autenticadas (grupo `app/(dashboard)/`).

---

## Sidebar.tsx

**O que faz:** navegação da área interna: sidebar fixa à esquerda de `lg` (1024px) para cima; abaixo disso, barra superior com logo, sino e menu que abre um drawer. Itens com ícone (lucide): áreas do dia a dia (Visão geral, Agenda, Assistente, Conversas, Clientes) e o grupo **Configurações** (Disponibilidade, Serviços, Google Agenda, WhatsApp, Testar IA, Assinatura) num painel um degrau acima do Void, com itens menores.

**Exporta:** `<Sidebar isAdmin? />` — client component; com `isAdmin` (calculado no layout por `isAdminEmail`) mostra o link discreto "Admin" (`/admin`) no fim da sidebar e do drawer; `usePathname()` destaca o item ativo (`aria-current="page"`, fundo `--ia-void-2`, sem sombra nem borda).

**Comportamentos:**

- **Badge de notificação** em "Conversas": conversas que precisam de resposta (`GET /api/conversations/attention-count`, poll 30s), com texto para leitor de tela. No celular também aparece um ponto no botão do menu.
- **Drawer** (`role="dialog"`, `aria-modal`): sempre montado e `inert` quando fechado, para animar sem 150-250ms de salto; fecha com Escape, no X, fora ou ao escolher um item; **prende o foco** (Tab e Shift+Tab ciclam dentro dele); trava o scroll do corpo; o foco vai ao botão fechar ao abrir e volta ao botão do menu ao fechar. Respeita `prefers-reduced-motion`.
- **Perfil no rodapé:** avatar com iniciais, nome e o sinal da secretária: "online" (ponto Faísca pulsando) só com a IA ligada **e** o WhatsApp conectado; senão "Secretária IA pausada" ou "WhatsApp desconectado" (mesma regra do card "Sua secretária"), lido de `GET /api/professionals` (`ai_enabled`, `whatsapp_connected`); sem o campo, mostra a especialidade. Acima do "Sair".
- **Sino** ([components/notifications](../notifications/README.md)): `variant="sheet"` na barra superior, `variant="popover"` no topo da sidebar.

**Depende de:** `next/link`, `next/navigation`, `next-auth/react`, `lucide-react`, `@/components/brand/Logo`, `@/lib/utils`.

**Notas:** renderizada por `app/(dashboard)/layout.tsx`, que aplica `lg:pl-64` ao conteúdo. Ao adicionar uma tela, inclua-a em `PRIMARY` ou `SETTINGS`. Usa os tokens `--sidebar-*` e `--ia-void-*`.

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

- `<PageHeader title description? actions? eyebrow? />` — server-friendly, sem client hooks. `eyebrow` é `@deprecated`: aceito por compatibilidade e **não é exibido**; nenhuma página do painel (fora da agenda, em ajuste) o passa mais.

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
