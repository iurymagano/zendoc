# app/api/reminders/dispatch/

Endpoint chamado por um cron externo (cron-job.org) a cada 1 minuto — processa lembretes
pendentes cujo `scheduled_for` já passou.

## route.ts

**Endpoint:** `GET|POST /api/reminders/dispatch`

**Autenticação:** header `Authorization: Bearer ${CRON_SECRET}`. Sem isso,
retorna 401. O job no cron-job.org precisa mandar esse header
(campo "Headers" do job).

**Resposta 200:**

```json
{ "ok": true, "total": 12, "sent": 10, "failed": 1, "skipped": 1 }
```

- `sent` — enviados com sucesso pela Z-API.
- `failed` — tentativa falhou (Z-API fora do ar, número inválido, etc.).
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
- env vars: `CRON_SECRET`. Credenciais Z-API (`zapi_instance_id` e
  `zapi_token`) vêm da tabela `professionals` por cliente — não são env.

**Notas:**

- Agendado **fora** do `vercel.json`: o plano grátis da Vercel (Hobby) não
  aceita cron mais frequente que diário. O cron-job.org (grátis) chama este
  endpoint a cada 1 minuto, então o lembrete sai no máximo ~1 min depois do
  `scheduled_for`. Passos no [README raiz](../../../../README.md#crons-cron-joborg).
- **Sem envio em dobro:** antes de enviar, cada lembrete é reservado com um
  update condicional (`pending → sent` onde `status = 'pending'`). Se duas
  execuções se sobrepõem, só a que conseguiu a troca envia; a outra conta como
  `skipped`. Se o envio falha, o lembrete é regravado como `failed`.
- Para testar localmente, chame manualmente com o header Bearer:
  `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/reminders/dispatch`.
