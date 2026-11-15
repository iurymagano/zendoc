# app/api/appointments/[id]/cancel/

Rota dedicada de cancelamento pelo profissional.

## route.ts

**Endpoint:** `POST /api/appointments/:id/cancel`

**Payload:**

```json
{ "cancellation_note": "cliente desmarcou por motivo médico" }
```

`cancellation_note` é opcional, até 500 caracteres.

**Efeito:** seta `status = 'cancelled'`, `cancelled_by = 'professional'` e
`cancellation_note`. O trigger `appointments_create_reminders` cancela
automaticamente os lembretes pendentes associados.

**Sino:** depois de cancelar, cria o aviso "cancelou" (`actor = 'professional'`,
com a `cancellation_note`; nasce lido porque foi o próprio dono). Compromisso
pessoal (sem cliente) não gera aviso.

**Por que não usar PATCH?**

- Garante `cancelled_by = 'professional'` no servidor (não pode ser spoofado).
- Separa uma transição de ciclo de vida de edições rotineiras, deixando o
  PATCH focado em correções de dados.

**Erros:** `400`, `401`, `404`, `500`.
