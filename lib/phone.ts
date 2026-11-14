/**
 * Telefones brasileiros: padrão do projeto = só dígitos, DDI 55 + DDD + número
 * (ex.: `5511911112222`). Módulo puro — pode ser usado no client e no server.
 */

/**
 * Normaliza um telefone digitado pelo usuário para o padrão do projeto.
 * - remove tudo que não for dígito e zeros à esquerda (prefixo de tronco "0");
 * - 10 ou 11 dígitos (DDD + número, sem DDI) → prefixa `55`;
 * - 12 ou 13 dígitos → mantém (já tem DDI; também aceita números de outros países);
 * - qualquer outro tamanho → devolve só os dígitos (falha em `isValidPhoneBR`).
 *
 * NÃO usar em identificadores vindos do WhatsApp (webhook): lá o número já
 * chega com DDI e pode ser internacional ou `@lid`.
 */
export function normalizePhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/** `true` se o telefone (já normalizado) tem 12 ou 13 dígitos (DDI + DDD + número). */
export function isValidPhoneBR(normalized: string): boolean {
  return /^\d{12,13}$/.test(normalized);
}

/** Formata para exibição: `+55 (11) 91111-2222`. Devolve a entrada crua se não reconhecer. */
export function formatPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 13) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 12) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  }
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  return raw;
}
