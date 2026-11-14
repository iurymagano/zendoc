// Filtros `ilike` do Postgres tratam `%` e `_` como curingas e `\` como escape.
// Para casar um nome digitado pelo usuário LITERALMENTE (sem "Jo%" virar "todo
// mundo que começa com Jo"), escapamos os três. PURO — sem imports.

/** Escapa `\`, `%` e `_` para uso em `.ilike(coluna, valor)`. */
export function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}
