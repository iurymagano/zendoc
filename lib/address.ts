/**
 * Endereço de atendimento: montagem/leitura do texto salvo em
 * `professionals.address` e consulta de CEP no ViaCEP (chamada do navegador).
 * Módulo puro (sem React) — `fetch` injetável nos testes.
 */
import { maskCep, onlyDigits } from '@/lib/masks';

export interface AddressParts {
  cep: string; // mascarado (00000-000) ou ''
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string; // UF
}

export const EMPTY_ADDRESS: AddressParts = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const clean = (s: string) => s.trim().replace(/\s+/g, ' ');

/**
 * Monta o texto único salvo no banco, omitindo partes vazias:
 * `Rua X, 123, complemento - Bairro, Cidade/UF, CEP 00000-000`.
 * Tudo vazio → `''`.
 */
export function buildAddress(parts: AddressParts): string {
  const street = [parts.street, parts.number, parts.complement]
    .map(clean)
    .filter(Boolean)
    .join(', ');
  const neighborhood = clean(parts.neighborhood);
  const head = street && neighborhood ? `${street} - ${neighborhood}` : street || neighborhood;
  const city = clean(parts.city);
  const uf = clean(parts.state).toUpperCase();
  const cityUf = city && uf ? `${city}/${uf}` : city || uf;
  const cepDigits = onlyDigits(parts.cep);
  const cep = cepDigits ? `CEP ${maskCep(cepDigits)}` : '';
  return [head, cityUf, cep].filter(Boolean).join(', ');
}

/**
 * Tenta separar um endereço salvo nas partes do formulário. Só reconhece o
 * formato gerado por `buildAddress` com rua + número + bairro + cidade/UF + CEP
 * (sem complemento); qualquer outra coisa → `null` (o chamador mostra o texto
 * num campo livre, sem perder nada). Garante `buildAddress(parse(x)) === x`.
 */
export function parseAddress(text: string): AddressParts | null {
  const m = text
    .trim()
    .match(/^([^,\-]+), ([^,\-]+) - ([^,]+), ([^,/]+)\/([A-Z]{2}), CEP (\d{5}-\d{3})$/);
  if (!m) return null;
  const parts: AddressParts = {
    street: m[1],
    number: m[2],
    complement: '',
    neighborhood: m[3],
    city: m[4],
    state: m[5],
    cep: m[6],
  };
  return buildAddress(parts) === text.trim() ? parts : null;
}

export type CepLookup =
  | { ok: true; street: string; neighborhood: string; city: string; state: string }
  | { ok: false; reason: 'invalid' | 'not_found' | 'network' };

/**
 * Consulta o CEP no ViaCEP. Nunca lança: erro de rede, resposta inesperada ou
 * abort viram `{ ok: false, reason: 'network' }`.
 */
export async function lookupCep(
  cep: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<CepLookup> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return { ok: false, reason: 'invalid' };
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: opts.signal,
    });
    if (res.status === 400) return { ok: false, reason: 'invalid' };
    if (!res.ok) return { ok: false, reason: 'network' };
    const data = (await res.json()) as Record<string, unknown>;
    if (data.erro === true || data.erro === 'true') return { ok: false, reason: 'not_found' };
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    return {
      ok: true,
      street: str(data.logradouro),
      neighborhood: str(data.bairro),
      city: str(data.localidade),
      state: str(data.uf).toUpperCase(),
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
