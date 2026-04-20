# lib/appointments/

Utilitários de domínio para appointments reutilizados pelas API routes.

## conflicts.ts

**O que faz:** checa sobreposição entre um novo/editado appointment e os
existentes na agenda do profissional.

**Exporta:**

- `hasAppointmentConflict(professionalId, startsAt, endsAt, excludeId?): Promise<boolean>` —
  retorna `true` se houver pelo menos um appointment ativo (status
  `scheduled`, `confirmed` ou `pending_approval`) cuja janela se sobrepõe à
  informada. `excludeId` é usado ao editar um appointment (ignora a si
  mesmo).

**Regra de sobreposição:** `existing.starts_at < new_ends AND existing.ends_at > new_starts`.
Intervalos que apenas se tocam na borda (ex.: um termina 15:00 e outro começa
15:00) **não** são considerados conflito.

**Depende de:** `@/lib/supabase`.
