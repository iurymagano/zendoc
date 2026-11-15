'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Campo de busca: `Input` do shadcn (44px, raio 12) com lupa e botão de limpar.
 * Controlado; `label` vira o `aria-label` (não há rótulo visível).
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder = 'Buscar',
  label = 'Buscar',
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
