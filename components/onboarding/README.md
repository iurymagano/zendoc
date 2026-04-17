# components/onboarding/

Componentes específicos do fluxo de onboarding.

## StepHeader.tsx

**O que faz:** barra de progresso (2 passos), contador "Passo X de 2" e título +
subtítulo.

**Exporta:**

- `StepHeader({ current: 1 | 2, title, subtitle? })` — componente

**Notas:** não tem `'use client'` — é server-friendly. Estilização via tokens
shadcn (`bg-primary`, `bg-muted`).
