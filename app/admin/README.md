# app/admin/

Painel do dono do IAzen (`/admin`): contas, pagantes, acessos e uso. Fora do route group `(dashboard)`: layout próprio, claro, sem sidebar.

---

## layout.tsx

**O que faz:** barra de topo com logo, "Admin" e o link "Voltar ao painel" (`/dashboard`); define o título da aba "Admin · IAzen" e `robots: noindex`.

**Depende de:** `components/brand/Logo`, `components/ui/button`.

## page.tsx

**O que faz:** server component `force-dynamic`. Chama `requireAdmin()` (404 para quem não é admin) e `getAdminOverview()` e entrega o resultado a `<AdminDashboard>`.

**Depende de:** `lib/admin/access.ts`, `lib/admin/metrics.ts`, `components/admin/AdminDashboard`.

**Notas:** o login é exigido também pelo `proxy.ts`; o acesso é pela env `ADMIN_EMAILS`.
