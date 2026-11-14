# components/onboarding/

Componentes específicos do fluxo de onboarding.

## StepHeader.tsx

**O que faz:** barra de progresso (2 passos), contador "Passo X de 2" e título +
subtítulo.

**Exporta:**

- `StepHeader({ current: 1 | 2, title, subtitle? })` — componente

**Notas:** não tem `'use client'` — é server-friendly. Passos concluídos usam
violeta de ação sólido (`role="progressbar"`); os pendentes, `bg-muted`. O layout do onboarding
usa fundo Névoa, card `rounded-3xl` e o logo em Void, sem halo radial.
