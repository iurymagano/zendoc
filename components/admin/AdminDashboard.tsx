import { TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import type { AdminOverview } from '@/lib/admin/types';
import { AdminCharts } from './AdminCharts';
import { AdminFunnel } from './AdminFunnel';
import { AdminKpis } from './AdminKpis';
import { AdminUsage } from './AdminUsage';
import { AdminUsersTable } from './AdminUsersTable';
import { formatTime } from './format';

/**
 * Página /admin inteira, a partir do contrato `AdminOverview`. Recebe tudo por props
 * (nenhuma busca aqui): quem busca é `app/admin/page.tsx`.
 */
export function AdminDashboard({ overview }: { overview: AdminOverview }) {
  return (
    <PageContainer variant="wide" className="gap-8 sm:gap-10">
      <PageHeader
        title="Visão do negócio"
        description="Contas, pagantes, acessos e uso do IAzen, em tempo real."
      />

      {overview.warnings.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl bg-status-pending-soft px-4 py-3 text-sm text-status-pending"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              {overview.warnings.length === 1
                ? 'Um dado não pôde ser lido.'
                : 'Alguns dados não puderam ser lidos.'}{' '}
              Os números abaixo podem estar incompletos.
            </p>
            <ul className="list-disc pl-4">
              {overview.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <AdminKpis kpis={overview.kpis} />
      <AdminFunnel funnel={overview.funnel30d} />
      <AdminCharts series={overview.series} />
      <AdminUsage usage={overview.usage} />
      <AdminUsersTable users={overview.users} generatedAt={overview.generatedAt} />

      <p className="text-sm text-muted-foreground">
        Atualizado às{' '}
        <span className="font-mono text-[13px]">{formatTime(overview.generatedAt)}</span>. Recarregue a
        página para ver os números de agora.
      </p>
    </PageContainer>
  );
}
