import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { PageContainer } from '@/components/layout/PageContainer';

export default function Loading() {
  return (
    <PageContainer variant="default">
      <LoadingSkeleton variant="list" />
    </PageContainer>
  );
}
