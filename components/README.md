# components/

Componentes React. Organizado por domínio:

- [ui/](./ui/) — primitivas shadcn/ui (botão, input, select, etc.)
- [brand/](./brand/) — logo (símbolo e wordmark em SVG) e geometria da marca IAzen
- [landing/](./landing/) — seções da landing escura (hero, mock, demo, treinamento, recursos, painel, preço, FAQ) e o balão do auth
- [layout/](./layout/) — peças de página do painel (contêiner, título de seção, métrica, busca, filtros, carregamento)
- [appointments/](./appointments/) — status do atendimento (fonte única), `StatusBadge` e `AppointmentCard`
- [dashboard/](./dashboard/) — shell do dashboard (navbar, cabeçalho de página)
- [dashboard/home/](./dashboard/home/) — blocos da página inicial `/dashboard` (dia, próximos, atenção, semana, vagas, conversas, configuração)
- [notifications/](./notifications/) — sino de notificações do painel (provider com polling, lista, popover/sheet)
- [onboarding/](./onboarding/) — componentes do fluxo de onboarding
- [availability/](./availability/) — componentes da tela de disponibilidade
- [agenda/](./agenda/) — calendário visual (vistas Mês e Semana) da página /agenda
- [documents/](./documents/) — apoio a documentos imprimíveis (declaração de comparecimento)

Componentes de UI transversais: `ui/skeleton.tsx` (placeholder de carregamento)
e `dashboard/EmptyState.tsx` (estado vazio padronizado: ícone + título + ação).
- [billing/](./billing/) — banner de status do plano (e futuros componentes
  de Stripe)

**Regra:** para qualquer componente de UI, use shadcn/ui (via `ui/`) antes de
escrever markup próprio. Ver [ui/README.md](./ui/README.md).
