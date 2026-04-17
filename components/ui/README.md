# components/ui/

Componentes genéricos de UI, reutilizados em todo o app.

## Button.tsx

**O que faz:** botão com três variantes (`primary`, `secondary`, `ghost`) e
estado de loading.

**Exporta:**

- `Button({ variant?, loading?, ...ButtonHTMLAttributes })` — componente

**Notas:** quando `loading=true`, exibe "Carregando…" e fica desabilitado.

## Input.tsx

**O que faz:** input com label opcional e mensagem de erro, estilizado com foco
em esmeralda.

**Exporta:**

- `Input` — componente, `forwardRef` para `HTMLInputElement`

**Notas:** se `id` não for passado, usa `name` como fallback para ligar `<label>` e `<input>`.
