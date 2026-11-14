# app/api/reminders/

Endpoints do sistema de lembretes de consultas. Os lembretes são criados
automaticamente pelo trigger `create_appointment_reminders` sempre que um
appointment entra em status `scheduled`/`confirmed` (24h e 2h antes).

## Subpastas

- [dispatch/](./dispatch/) — `POST|GET /api/reminders/dispatch`, chamado pelo
  cron-job.org a cada 1 minuto (fora do `vercel.json`: o plano grátis só aceita cron diário).
