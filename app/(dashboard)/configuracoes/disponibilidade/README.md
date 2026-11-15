# app/(dashboard)/configuracoes/disponibilidade/

Tela de configuração da rotina semanal de atendimento.

## page.tsx

**O que faz:** client component que:

1. Ao montar, faz `GET /api/availability/weekly` e preenche o estado local.
2. Renderiza 7 `<WeekdayRow>` (domingo a sábado) + input da duração do slot.
3. No submit, serializa o estado como array de blocos e faz
   `POST /api/availability/weekly`.

**Default:** seg-sex das 08:00-12:00 (manhã), 12:00-13:00 (almoço/pausa) e
13:00-18:00 (tarde), com `slot_duration = 50`.

**Replicar:** cada dia tem o botão "Replicar" (copia o dia para outros). A cópia só altera o
estado local: mostra um toast "Copiado para seg, ter. Clique em Salvar para aplicar.", marca
`dirty` e exibe a barra fixa "Alterações não salvas" com o botão Salvar; nada vai ao servidor
antes do Salvar.

**Depende de:**

- `@/components/availability/WeekdayRow`, `@/lib/availability/replicate`, `sonner` (toast)
- `@/components/ui/{button,input,card,form-field}`
- `GET|POST /api/availability/weekly`

**Notas:**

- A URL aceita `?onboarding=1` — quando presente, ao salvar redireciona para
  `/dashboard` em vez de mostrar "salvo com sucesso". É o fluxo usado ao final
  do onboarding.
- O bloco `lunch` aparece na UI como "Almoço (pausa)" — é apenas uma pausa,
  nunca oferecida aos clientes (filtro em `getAvailableSlots`).
