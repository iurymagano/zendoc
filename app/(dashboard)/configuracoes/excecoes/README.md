# app/(dashboard)/configuracoes/excecoes/

Tela de exceções pontuais na agenda — folgas, horários diferentes em dias
específicos e dias extras que normalmente não são atendidos.

## page.tsx

**O que faz:** client component que:

1. Ao montar, faz `GET /api/availability/exceptions` e lista as exceções
   ordenadas por data.
2. Renderiza um formulário para adicionar uma nova exceção (data, tipo,
   horários, duração de slot e observação opcional).
3. Faz `POST /api/availability/exceptions` — a API faz upsert por
   `(professional_id, date)`, então adicionar exceção em uma data existente
   substitui a anterior.
4. Cada item da lista tem botão "Excluir" que chama
   `DELETE /api/availability/exceptions/:id`.

**Tipos de exceção:**

- `day_off` — agenda bloqueada no dia inteiro (nenhum slot é oferecido).
- `custom_hours` — atende no dia, mas com horário e/ou duração diferente da
  rotina semanal.
- `extra_day` — atende em um dia que normalmente não atenderia (ex.: sábado
  atípico).

**Depende de:**

- `@/components/ui/{button,input,select,textarea,card,form-field}`
- `GET|POST /api/availability/exceptions`
- `DELETE /api/availability/exceptions/[id]`

**Notas:**

- O input de data usa `min={todayIso()}` para evitar exceções em datas
  passadas pela UI, mas a API aceita datas passadas (útil para corrigir
  histórico manualmente se preciso).
- Quando `type = day_off`, os campos de horário desaparecem do formulário.
