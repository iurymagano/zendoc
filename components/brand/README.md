# components/brand/

Elementos de marca IAzen reutilizados em landing, auth, onboarding e dashboard.

---

## logo-geometry.ts

**O que faz:** fonte única da geometria da marca (símbolo e wordmark em curvas).

**Exporta:** `MARK_VIEWBOX`, `MARK_STROKE_PATH`, `MARK_STROKE_WIDTH`, `SPARK`, `BRAND` (cores),
`MARK_GRADIENT`, `WORDMARK` (caminhos de "IA" e "zen", largura e altura de caixa-alta).

**Notas:** o wordmark foi convertido de Sora para curvas, então o logo não depende de fonte
carregada. Os SVGs de `public/` e `app/icon.svg` saem destes mesmos números.

## Logo.tsx

**O que faz:** logo oficial em SVG inline: Ensō que vira balão com a faísca, mais o wordmark "IAzen".

**Exporta:**

- `<Logo size? href? variant? className? />` — logo completo. `size` é `'sm' | 'md' | 'lg' | 'xl'`
  (altura 22/30/42/60px), `href` default `'/'` (`null` renderiza sem link), `variant` é
  `'default'` (símbolo com degradê) ou `'mono'` (tudo em `currentColor`).
- `<LogoMark size? variant? className? title? />` — só o símbolo. `title={null}` o marca como
  decorativo (`aria-hidden`).

**Depende de:** `next/link`, `@/lib/utils` (`cn`), `./logo-geometry`.

**Notas:** o wordmark usa `currentColor`: use `text-white` sobre escuro e a cor de tinta sobre
claro. O gradiente tem id único por instância (`useId`). Regras de uso (área livre, tamanho
mínimo, proibições) no [DESIGN.md](../../DESIGN.md).
