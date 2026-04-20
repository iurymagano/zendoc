# components/

Componentes React. Organizado por domínio:

- [ui/](./ui/) — primitivas shadcn/ui (botão, input, select, etc.)
- [brand/](./brand/) — logo e elementos de marca IAzen
- [dashboard/](./dashboard/) — shell do dashboard (navbar, cabeçalho de página)
- [onboarding/](./onboarding/) — componentes do fluxo de onboarding
- [availability/](./availability/) — componentes da tela de disponibilidade
- [billing/](./billing/) — banner de status do plano (e futuros componentes
  de Stripe)

**Regra:** para qualquer componente de UI, use shadcn/ui (via `ui/`) antes de
escrever markup próprio. Ver [ui/README.md](./ui/README.md).
