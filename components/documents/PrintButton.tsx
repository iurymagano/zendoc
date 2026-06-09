'use client';

import { Button } from '@/components/ui/button';

/**
 * Barra de ações de um documento imprimível. Fica escondida na impressão
 * (classe `print:hidden`) — só o documento em si sai no PDF/papel.
 */
export function PrintButton({ backHref }: { backHref?: string }) {
  return (
    <div className="print:hidden flex items-center gap-3">
      {backHref && (
        <Button variant="outline" onClick={() => (window.location.href = backHref)}>
          Voltar
        </Button>
      )}
      <Button onClick={() => window.print()}>Imprimir / Salvar PDF</Button>
    </div>
  );
}
