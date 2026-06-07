# app/(dashboard)/configuracoes/

Route group com as páginas de configuração do consultório (protegidas por login).

## Subpastas

- [disponibilidade/](./disponibilidade/) — rotina semanal de atendimento.
- [excecoes/](./excecoes/) — folgas, horários atípicos e dias extras pontuais
  (sobrescrevem a rotina semanal).
- [whatsapp/](./whatsapp/) — pareamento com a instância Evolution (QR Code +
  status + desconectar).
- [testar-ia/](./testar-ia/) — chat de teste que simula um paciente e roda a IA
  sem WhatsApp (consome `POST /api/ai/test`).
- [assinatura/](./assinatura/) — status do plano + assinar/gerenciar (Stripe).

**Futuras telas:**

- `conta/` — dados pessoais, cancelamento.
