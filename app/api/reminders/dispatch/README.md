# app/api/reminders/dispatch/

Endpoint chamado pelo Vercel Cron a cada 15 minutos — processa lembretes
pendentes cujo `scheduled_for` já passou.

## route.ts

**Endpoint:** `GET|POST /api/reminders/dispatch`

**Autenticação:** header `Authorization: Bearer ${CRON_SECRET}`. Sem isso,
retorna 401. O Vercel Cron injeta esse header automaticamente quando
`CRON_SECRET` está definido nas env vars do projeto.

**Resposta 200:**

```json
{ "ok": true, "total": 12, "sent": 10, "failed": 1, "skipped": 1 }
```

- `sent` — enviados com sucesso pela Evolution API.
- `failed` — tentativa falhou (Evolution fora do ar, número inválido, etc.).
  `reminders.error_message` guarda o detalhe.
- `skipped` — lembrete foi finalizado sem envio por motivo aceitável
  (appointment cancelado, plano inativo, WhatsApp não conectado).

**Comportamento:**

1. Query busca até 50 lembretes `pending` com `scheduled_for <= now`, já com
   join em `appointment` e `professional`.
2. Para cada lembrete, decide o desfecho:
   - Appointment cancelado/no-show → marca `status = 'cancelled'`.
   - Plano `past_due`/`cancelled` → marca `status = 'failed'` com motivo.
   - WhatsApp não conectado → marca `status = 'failed'` com motivo.
   - Caso feliz → envia via `sendWhatsAppMessage` e marca `sent` com
     `sent_at = now()`. Se o envio lançar, marca `failed` com a mensagem do
     erro em `error_message`.
3. Lembretes sempre saem do estado `pending` após o run — nada volta a ser
   tentado. O batch size de 50 mitiga picos sem reenfileirar.

**Mensagens enviadas:**

- Tipo `24h`: `"Olá! Aqui é do consultório de {nome}. Sua consulta está marcada para {dia}, {data} às {hora}. Podemos confirmar?"`
- Tipo `2h`: `"Olá! Sua consulta com {nome} é hoje, às {hora}. Estou te esperando."`

Datas formatadas em `America/Sao_Paulo` via `Intl.DateTimeFormat` — seguro
independentemente do fuso da runtime (Vercel gru1 é UTC por padrão).

**Depende de:**

- `@/lib/supabase`, `@/lib/zapi/client`
- env vars: `CRON_SECRET`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`.

**Notas:**

- A cron do Vercel está agendada em [vercel.json](../../../../vercel.json) para
  rodar a cada 15 minutos (`*/15 * * * *`).
- Para testar localmente, chame manualmente com o header Bearer:
  `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/reminders/dispatch`.
