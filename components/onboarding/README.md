# components/onboarding/

Componentes específicos do fluxo de onboarding.

## StepHeader.tsx

**O que faz:** exibe a barra de progresso (2 passos), o contador "Passo X de 2"
e um título + subtítulo.

**Exporta:**

- `StepHeader({ current: 1 | 2, title, subtitle? })` — componente

**Notas:** não é server-aware — recebe o passo atual como prop.
