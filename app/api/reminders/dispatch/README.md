# app/api/reminders/dispatch/

Endpoint chamado por um cron externo (cron-job.org) a cada 1 minuto — processa os lembretes
de atendimento pendentes cujo `scheduled_for` já passou **e** os lembretes pessoais do
Assistente (`personal_reminders`) cujo `remind_at` já passou.

## route.ts

**Endpoint:** `GET|POST /api/reminders/dispatch`

**Autenticação:** header `Authorization: Bearer ${CRON_SECRET}`. Sem isso,
retorna 401. O job no cron-job.org precisa mandar esse header
(campo "Headers" do job).

**Resposta 200:**

```json
{
  "ok": true,
  "total": 12, "sent": 10, "failed": 1, "skipped": 1,
  "personal": { "total": 2, "sent": 1, "failed": 0, "skipped": 1 }
}
```

Os contadores do nível raiz são dos lembretes de atendimento (clientes);
`personal` traz os mesmos contadores para os lembretes pessoais.

- `sent` — enviados com sucesso pela Evolution API.
- `failed` — tentativa falhou (Evolution fora do ar, número inválido, etc.).
  `reminders.error_message` guarda o detalhe.
- `skipped` — lembrete foi finalizado sem envio por motivo aceitável
  (appointment cancelado, plano inativo, WhatsApp não conectado).

**Comportamento:**

1. Query busca até 50 lembretes `pending` com `scheduled_for <= now`, já com
   join em `appointment` e `professional`.
2. Para cada lembrete, decide o desfecho:
   - Compromisso sem cliente (`patient_phone` vazio ou sem dígitos, via
     `isPersonalCommitment` — compromisso pessoal criado pelo Assistente ou
     editado na agenda) → marca `status = 'cancelled'` ("Compromisso sem
     cliente"). Nunca envia mensagem para telefone vazio.
   - Appointment cancelado/no-show → marca `status = 'cancelled'`.
   - Atendimento que já começou (ex.: marcado com data passada) → marca
     `status = 'cancelled'` ("Atendimento já começou"); o cliente não recebe
     lembrete de algo que já passou.
   - Plano `past_due`/`cancelled` → marca `status = 'failed'` com motivo.
   - WhatsApp não conectado → marca `status = 'failed'` com motivo e avisa o dono
     no sino (`notifyReminderFailed`).
   - Caso feliz → envia via `sendWhatsAppMessage` e marca `sent` com
     `sent_at = now()`. Se o envio lançar, marca `failed` com a mensagem do
     erro em `error_message` e avisa o dono no sino (`notifyReminderFailed`, um
     aviso por lembrete).
3. Depois, `dispatchPersonalReminders` busca até 50 `personal_reminders`
   `pending` com `remind_at <= now` e, para cada um, usa
   `checkPersonalReminderDelivery` ([lib/assistant/reminders.ts](../../../../lib/assistant/reminders.ts)):
   plano inativo, WhatsApp desconectado ou `professionals.phone` ausente/inválido →
   `status = 'failed'` com o motivo em `error_message`. Caso feliz → reserva
   (`pending → sent`) e envia ao **próprio profissional** (`professionals.phone`)
   `"Lembrete do seu assistente IAzen:\n{texto}"` pela instância dele; se o envio
   lançar, regrava como `failed`.
4. Lembretes sempre saem do estado `pending` após o run — nada volta a ser
   tentado. O batch size de 50 mitiga picos sem reenfileirar.

**Mensagens enviadas:**

- Tipo `24h`: `"Olá! Aqui é a secretária de {nome}. Seu atendimento está marcado para {dia}, {data} às {hora}. Podemos confirmar?"`
- Tipo `2h`: `"Olá! Seu atendimento com {nome} é hoje, às {hora}. Estou te esperando."`
- Lembrete pessoal: `"Lembrete do seu assistente IAzen:\n{texto}"` (para o profissional).

Datas formatadas em `America/Sao_Paulo` via `Intl.DateTimeFormat` — seguro
independentemente do fuso da runtime (Vercel gru1 é UTC por padrão).

**Depende de:**

- `@/lib/supabase`, `@/lib/zapi/client`, `@/lib/assistant/reminders`,
  `@/lib/notifications/events`
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
