# components/ui/

Componentes de UI gerados pelo CLI do **shadcn/ui** (`npx shadcn@latest add <name>`).
Editáveis — o padrão do shadcn é "copy-paste ownership", ou seja, o código vive
aqui e é nosso para customizar.

Tokens de cor vêm de `app/globals.css` (`--primary`, `--muted`, etc.). Preset:
`base-nova` (base-ui + lucide icons).

**Identidade v1 (ver [DESIGN.md](../../DESIGN.md)):** botões em pílula (altura 40/48), campos de 44px com
raio 12, cards de raio 24 sem sombra e `Switch` de 44x24. Quem reinstalar um componente pelo CLI
deve reaplicar esses ajustes.

## Componentes instalados

| Arquivo           | Comando de instalação                          |
| ----------------- | ---------------------------------------------- |
| `button.tsx`      | `npx shadcn@latest add button`                 |
| `input.tsx`       | `npx shadcn@latest add input`                  |
| `label.tsx`       | `npx shadcn@latest add label`                  |
| `select.tsx`      | `npx shadcn@latest add select`                 |
| `textarea.tsx`    | `npx shadcn@latest add textarea`               |
| `card.tsx`        | `npx shadcn@latest add card`                   |
| `switch.tsx`      | `npx shadcn@latest add switch`                 |
| `accordion.tsx`   | `npx shadcn@latest add accordion` (import ajustado para `@/lib/utils`; usado no FAQ da landing) |
| `separator.tsx`   | `npx shadcn@latest add separator`              |
| `popover.tsx`     | `npx shadcn@latest add popover` (Replicar da disponibilidade; lista do sino no desktop) |
| `checkbox.tsx`    | `npx shadcn@latest add checkbox`               |
| `sheet.tsx`       | `npx shadcn@latest add sheet` (lista do sino no celular)   |
| `sonner.tsx`      | `npx shadcn@latest add sonner` (toasts; dependência `sonner`) |

## form-field.tsx

**O que faz:** wrapper fino que combina `Label` + conteúdo + mensagem de erro em
uma única célula de formulário. Não é componente shadcn — é composição interna
para padronizar os formulários do IAzen.

**Exporta:**

- `FormField({ label?, error?, htmlFor?, className?, children })` — componente

**Notas:** não injeta `id` no `children`; o consumidor define `id` no input e
`htmlFor` no `FormField` para ligar o label.

## masked-input.tsx

**O que faz:** `Input` do shadcn com máscara enquanto digita. Não é componente
shadcn — é composição interna sobre `input.tsx`.

**Exporta:**

- `MaskedInput({ mask: 'phone' | 'cpf' | 'cep' | 'currency', value, onChangeValue, ...inputProps })`
  — `value` e `onChangeValue` trabalham com o texto JÁ mascarado; limpe ao enviar
  (ver `lib/masks.ts`). Define `inputMode` (`tel`/`numeric`), `placeholder` e
  `autoComplete` padrão por máscara (sobrescrevíveis).

**Depende de:** `components/ui/input.tsx`, `lib/masks.ts`.

**Notas:** mantém o cursor no lugar ao editar/apagar no meio; Backspace/Delete
sobre um separador remove o dígito vizinho em vez de travar; colar reaplica a
máscara e leva o cursor ao fim. Valor em R$ sempre edita pelo fim.

## skeleton.tsx

**O que faz:** placeholder de carregamento (`Skeleton`) — bloco com `animate-pulse`.
Usado nos estados de carregando (agenda, conversas).

**Exporta:** `Skeleton({ className })` — dimensione via className (ex.: `h-4 w-2/3`).

## sonner.tsx

**O que faz:** `<Toaster />` (toast do shadcn sobre a lib `sonner`). Montado uma vez no
`app/(dashboard)/layout.tsx` (`position="top-center"`); qualquer tela do painel dispara
`toast.success(...)` importando `toast` de `sonner`.

**Notas:** o CLI gerou `import { cn } from "cn"` e dependia de `next-themes`; foi
ajustado para `@/lib/utils` e `theme="light"` (o painel é sempre claro). Reaplique isso
se reinstalar. `popover.tsx` e `checkbox.tsx` são o shadcn puro (base-ui), ajustando só
o import do `cn`; usados por `components/availability/ReplicateDayButton.tsx`.

## Convenção

**Sempre use componentes shadcn antes de escrever HTML puro.** Para novas
necessidades, rode `npx shadcn@latest add <name>` e use o componente gerado.
