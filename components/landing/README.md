# components/landing/

Peças visuais da landing (`app/page.tsx`) e do lado de marca das telas de auth.

---

## Bubble.tsx

**O que faz:** balão de conversa de WhatsApp. `side="in"` é o cliente (ponta embaixo à esquerda,
como o logo); `side="out"` é a secretária (violeta, ponta embaixo à direita).

**Exporta:** `Bubble({ side, time?, children, className?, style? })`

**Notas:** use dentro de um contêiner `.dark`. O horário vai em mono tabular dentro do balão.

## HeroChat.tsx

**O que faz:** janela de conversa do hero ("Secretária da Bia", 22:47, cliente Marina), com os balões
entrando em sequência (`ia-rise`) e a faísca "online agora".

**Exporta:** `HeroChat()`

**Notas:** conteúdo fictício. A animação respeita `prefers-reduced-motion`.

## WeekGrid.tsx

**O que faz:** semana de segunda a sexta com os blocos de manhã e tarde, atendimentos de 50 minutos,
horários ocupados riscados, almoço hachurado ("a secretária não oferece") e um horário marcado.

**Exporta:** `WeekGrid()`

**Notas:** dados de exemplo no próprio arquivo.

## ReminderTimeline.tsx

**O que faz:** linha do tempo de um atendimento: lembrete 24h antes (com a confirmação), 2h antes e o atendimento (cliente Diego).

**Exporta:** `ReminderTimeline()`

**Depende de:** `./Bubble`.

## ToneDemo.tsx

**O que faz:** o mesmo pedido de remarcação nos tons amigável e formal, alternados por abas.

**Exporta:** `ToneDemo()` (`'use client'`, guarda o tom escolhido em estado)

**Depende de:** `./Bubble`.

## AssistantDemo.tsx

**O que faz:** janela de chat do Assistente pessoal (`/assistente`) para a seção "E ela também organiza o seu dia.": o dono pede para marcar o dentista e lembrar de cobrar um cliente, a IA confirma e devolve o resumo do dia em cartão claro (horário em mono, etiqueta Lembrete/Cliente/Pessoal).

**Exporta:** `AssistantDemo()`

**Depende de:** `./Bubble`, `@/components/brand/Logo` (`LogoMark`).

**Notas:** conteúdo fictício. Use dentro de contêiner `.dark`. O recurso real vive em `app/(dashboard)/assistente` (feito por outra frente).
