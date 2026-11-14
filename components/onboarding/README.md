# components/onboarding/

Componentes específicos do fluxo de onboarding.

## StepHeader.tsx

**O que faz:** barra de progresso (2 passos), contador "Passo X de 2" e título +
subtítulo.

**Exporta:**

- `StepHeader({ current: 1 | 2, title, subtitle? })` — componente

**Notas:** não tem `'use client'` — é server-friendly. Passos concluídos usam
cor sólida `#4F6EF7` (sem gradiente, regra do design system); os pendentes,
`bg-muted`.
