# components/

Componentes React. Organizado por domínio:

- [ui/](./ui/) — primitivas shadcn/ui (botão, input, select, etc.)
- [onboarding/](./onboarding/) — componentes do fluxo de onboarding
- [availability/](./availability/) — componentes da tela de disponibilidade

**Regra:** para qualquer componente de UI, use shadcn/ui (via `ui/`) antes de
escrever markup próprio. Ver [ui/README.md](./ui/README.md).
