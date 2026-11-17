import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { requireAdmin } from '@/lib/admin/access';
import { getAdminOverview } from '@/lib/admin/metrics';

// Números sempre de agora: nada de cache da rota.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireAdmin(); // quem não é admin recebe 404
  const overview = await getAdminOverview();
  return <AdminDashboard overview={overview} />;
}
