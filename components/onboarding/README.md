# components/onboarding/

Componentes específicos do fluxo de onboarding.

## AddressFields.tsx

**O que faz:** campos de endereço de atendimento (opcional): CEP com máscara +
busca automática no ViaCEP (rua, bairro, cidade, UF), número, complemento.

**Exporta:**

- `AddressFields({ initialValue?, onChange })` — `onChange` recebe o texto único
  (`buildAddress`, `''` se vazio), o mesmo que vai para `professionals.address`.

**Depende de:** `lib/address.ts`, `components/ui/{masked-input,input,form-field,button}`.

**Notas:** a busca roda no navegador ao completar 8 dígitos, com spinner e
mensagens para CEP inválido, não encontrado e falha de rede (sem travar: todos os
campos seguem editáveis, e dá para preencher sem CEP). Trocar o CEP durante a
busca descarta a resposta antiga. `initialValue` que não dá para separar com
segurança abre num campo de texto livre (botão "Preencher por CEP" leva o texto
para o campo Rua).

## StepHeader.tsx

**O que faz:** barra de progresso (2 passos), contador "Passo X de 2" e título +
subtítulo.

**Exporta:**

- `StepHeader({ current: 1 | 2, title, subtitle? })` — componente

**Notas:** não tem `'use client'` — é server-friendly. Passos concluídos usam
violeta de ação sólido (`role="progressbar"`); os pendentes, `bg-muted`. O layout do onboarding
usa fundo Névoa, card `rounded-3xl` e o logo em Void, sem halo radial.
