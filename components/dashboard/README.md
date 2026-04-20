# components/dashboard/

Shell compartilhado pelas páginas autenticadas (grupo `app/(dashboard)/`).

---

## Navbar.tsx

**O que faz:** navbar sticky com logo IAzen, links para as áreas principais e botão de sair. Em telas pequenas, os links descem para uma segunda linha.

**Exporta:**

- `<Navbar />` — client component, lê `usePathname()` para destacar o item ativo.

**Depende de:** `next/link`, `next/navigation` (`usePathname`), `next-auth/react` (`signOut`), `@/components/brand/Logo`, `@/components/ui/button`, `@/lib/utils`.

**Notas:** renderizado pelo `app/(dashboard)/layout.tsx`. O destaque do item ativo é calculado por prefixo — `/configuracoes/*` casa qualquer sub-rota de configuração.

---

## PageHeader.tsx

**O que faz:** cabeçalho padronizado das páginas internas — eyebrow (font-mono, uppercase), título em Space Grotesk e descrição + área opcional de ações.

**Exporta:**

- `<PageHeader eyebrow? title description? actions? />` — server-friendly, sem client hooks.

**Depende de:** nada além de React.

**Notas:** usar em toda página dentro de `(dashboard)/` para manter o layout consistente. O título aplica `letter-spacing: -0.03em` conforme o design system.
