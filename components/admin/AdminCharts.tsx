import type { AdminOverview } from '@/lib/admin/types';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { BarChart } from './BarChart';
import { formatInt } from './format';

const sum = (points: { value: number }[]) => points.reduce((acc, p) => acc + p.value, 0);

/** Três gráficos de barras dos últimos 30 dias: cadastros, ativos e visitas à landing. */
export function AdminCharts({ series }: { series: AdminOverview['series'] }) {
  const avgActive = series.activeUsers.length > 0 ? sum(series.activeUsers) / series.activeUsers.length : 0;

  return (
    <section aria-label="Gráficos dos últimos 30 dias" className="flex flex-col gap-3">
      <SectionHeader title="Últimos 30 dias, dia a dia" />
      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <BarChart
          title="Cadastros por dia"
          data={series.signups}
          summaryValue={formatInt(sum(series.signups))}
          summaryLabel="contas criadas no período"
          unit={['cadastro', 'cadastros']}
          emptyText="Nenhuma conta criada nos últimos 30 dias."
        />
        <BarChart
          title="Usuários ativos por dia"
          data={series.activeUsers}
          summaryValue={avgActive.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          summaryLabel="por dia, em média"
          unit={['usuário ativo', 'usuários ativos']}
          emptyText="Ninguém abriu o painel nos últimos 30 dias."
        />
        <BarChart
          title="Visitas à landing por dia"
          data={series.landingVisits}
          summaryValue={formatInt(sum(series.landingVisits))}
          summaryLabel="visitas no período"
          unit={['visita', 'visitas']}
          emptyText="Nenhuma visita registrada nos últimos 30 dias."
        />
      </div>
    </section>
  );
}
