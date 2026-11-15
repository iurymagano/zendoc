import { AgendaSkeleton } from '@/components/agenda/AgendaSkeleton';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageContainer variant="wide" className="gap-4 sm:gap-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="h-11 w-48 rounded-full" />
      </div>
      <AgendaSkeleton toolbar />
    </PageContainer>
  );
}
