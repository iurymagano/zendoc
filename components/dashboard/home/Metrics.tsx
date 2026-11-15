import { CalendarCheck, CalendarClock, Sparkles, Users } from 'lucide-react';
import { MetricCard } from '@/components/layout/MetricCard';
import { formatTime } from '@/lib/assistant/datetime';
import type { DashboardData } from '@/lib/dashboard/load';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Os quatro números do topo, todos reais (nada inventado): atendimentos de hoje,
 * os que vêm pela frente, clientes cadastrados e quantos a IA já marcou. Cada um
 * leva à tela com o detalhe.
 */
export function Metrics({ data, whatsappConnected }: { data: DashboardData; whatsappConnected: boolean }) {
  const { today, upcomingCount, pendingCount, newClients, aiTotal, metrics } = data;
  const focus = today.current ?? today.next;

  const todayHint = focus
    ? `${today.current ? 'Agora' : 'Próximo'}: ${formatTime(focus.starts_at)} ${focus.patient_name}`
    : today.clientCount > 0
      ? 'Nada mais por hoje'
      : 'Dia livre';

  const upcomingHint =
    pendingCount > 0
      ? `${plural(pendingCount, 'aguarda', 'aguardam')} sua aprovação`
      : upcomingCount > 0
        ? 'A partir de agora'
        : 'Nada marcado à frente';

  const clientsHint =
    newClients.week > 0
      ? `${plural(newClients.week, 'novo', 'novos')} esta semana`
      : newClients.total > 0
        ? 'Nenhum novo esta semana'
        : 'Ainda sem cadastros';

  const aiHint =
    aiTotal > 0
      ? `${metrics.byAi} nesta semana`
      : whatsappConnected
        ? 'A IA ainda não marcou nenhum'
        : 'Conecte o WhatsApp para começar';

  return (
    <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Hoje"
        value={today.clientCount}
        hint={<span className="block truncate">{todayHint}</span>}
        icon={CalendarCheck}
        href="/agenda"
      />
      <MetricCard
        label="Próximos"
        value={upcomingCount}
        hint={upcomingHint}
        icon={CalendarClock}
        href="/agenda"
      />
      <MetricCard label="Clientes" value={newClients.total} hint={clientsHint} icon={Users} href="/clientes" />
      <MetricCard
        label="Pela IA"
        value={aiTotal}
        hint={aiHint}
        icon={Sparkles}
        href={whatsappConnected ? '/conversas' : '/configuracoes/whatsapp'}
      />
    </section>
  );
}
