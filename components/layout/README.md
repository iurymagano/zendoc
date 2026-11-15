# components/layout/

Peças de página do painel (redesign premium): contêiner, título de seção, métrica, busca, filtros e carregamento. Regras visuais em DESIGN.md, "Painel: redesign premium".

---

## PageContainer.tsx

**O que faz:** largura máxima centralizada e ritmo vertical entre blocos (24px no celular, 32px a partir de `sm`).

**Exporta:** `PageContainer({ variant?: 'default' | 'wide', className?, children })` — `default` até 1024px, `wide` até 1280px.

**Notas:** o respiro lateral e o topo vêm do layout do painel. Hoje `app/(dashboard)/layout.tsx` limita o `main` a `max-w-5xl`; para a variante `wide` valer, a etapa que adotar o contêiner afrouxa esse limite.

---

## SectionHeader.tsx

**O que faz:** título de seção em Inter 15px semibold, descrição opcional e ação à direita. Substitui o rótulo mono `// SEÇÃO`.

**Exporta:** `SectionHeader({ title, description?, action?, as?: 'h2' | 'h3', className? })`.

---

## MetricCard.tsx

**O que faz:** número em Sora com rótulo, dica e ícone de apoio; com `href`, o card inteiro é link.

**Exporta:** `MetricCard({ label, value, hint?, icon?, href?, className? })`.

**Depende de:** `ui/card`.

---

## LoadingSkeleton.tsx

**O que faz:** carregamento com a forma do conteúdo (`list`, `cards` ou `page`), com `role="status"` e texto "Carregando" para leitor de tela.

**Exporta:** `LoadingSkeleton({ variant?, rows?, className? })`.

**Depende de:** `ui/skeleton`.

---

## SearchInput.tsx

**O que faz:** campo de busca (`Input` do shadcn) com lupa e botão de limpar. Client Component, controlado.

**Exporta:** `SearchInput({ value, onValueChange, placeholder?, label?, className? })`.

---

## FilterBar.tsx

**O que faz:** barra de filtros de lista: busca, filtros e contagem/ações, quebrando em linhas no celular.

**Exporta:**

- `FilterBar({ search?, children?, trailing?, label?, className? })`
- `FilterChip({ active, onClick, count?, children })` — filtro liga/desliga em pílula (`Button` com `aria-pressed`)
