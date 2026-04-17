# components/ui/

Componentes de UI gerados pelo CLI do **shadcn/ui** (`npx shadcn@latest add <name>`).
Editáveis — o padrão do shadcn é "copy-paste ownership", ou seja, o código vive
aqui e é nosso para customizar.

Tokens de cor vêm de `app/globals.css` (`--primary`, `--muted`, etc.). Preset:
`base-nova` (base-ui + lucide icons).

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
| `separator.tsx`   | `npx shadcn@latest add separator`              |

## form-field.tsx

**O que faz:** wrapper fino que combina `Label` + conteúdo + mensagem de erro em
uma única célula de formulário. Não é componente shadcn — é composição interna
para padronizar os formulários do Zendoc.

**Exporta:**

- `FormField({ label?, error?, htmlFor?, className?, children })` — componente

**Notas:** não injeta `id` no `children`; o consumidor define `id` no input e
`htmlFor` no `FormField` para ligar o label.

## Convenção

**Sempre use componentes shadcn antes de escrever HTML puro.** Para novas
necessidades, rode `npx shadcn@latest add <name>` e use o componente gerado.
