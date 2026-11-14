/** Títulos/tratamentos ignorados ao escolher o primeiro nome (sem ponto, minúsculos). */
const TITLES = new Set([
  'dr',
  'dra',
  'doutor',
  'doutora',
  'prof',
  'profa',
  'professor',
  'professora',
]);

/**
 * Primeiro nome "de verdade" para saudações, pulando títulos:
 * "Dra. Teste QA" → "Teste"; "Prof. João Silva" → "João".
 * Se o nome for só título (ou vazio), devolve a primeira palavra como está.
 */
export function firstNameSkippingTitle(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const name = words.find((w) => !TITLES.has(w.replace(/\./g, '').toLowerCase()));
  return name ?? words[0] ?? '';
}
