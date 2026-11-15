/**
 * Máscaras de campo (telefone, CPF, CEP, valor em R$). Funções puras — usáveis
 * no client e no server. O valor mascarado é só para exibição: na hora de
 * enviar/validar, limpar com `normalizePhoneBR`, `normalizeCpf`, `onlyDigits`
 * ou `parseCurrencyToCents`.
 */
import { maskCpfInput } from '@/lib/patients/cpf';

/** Remove tudo que não for dígito. */
export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

const PHONE_MAX_LOCAL = 11; // DDD + número (celular)
const PHONE_MAX_INTL = 15; // limite E.164

/**
 * Máscara progressiva de telefone, sem o DDI: `(48) 98506-9930` (celular, 11
 * dígitos) ou `(48) 3333-4444` (fixo, 10).
 * - Aceita o formato salvo no banco: `5548985069930` vira `(48) 98506-9930`
 *   (o `55` só é tratado como DDI quando sobram mais de 11 dígitos, então o
 *   DDD 55 do RS continua funcionando).
 * - Número internacional (mais de 11 dígitos e sem `55`) fica como `+<dígitos>`,
 *   para não adulterar o telefone ao editar um cliente estrangeiro.
 * - `prev` (valor mascarado anterior) evita que um 12º dígito digitado depois
 *   de um telefone completo seja confundido com DDI.
 */
export function maskPhone(raw: string, prev?: string): string {
  let d = onlyDigits(raw).replace(/^0+/, '');

  if (prev !== undefined && !prev.startsWith('+')) {
    const prevLen = onlyDigits(prev).length;
    if (prevLen >= PHONE_MAX_LOCAL && d.length === prevLen + 1) return prev;
  }

  if (d.length > PHONE_MAX_LOCAL) {
    if (d.startsWith('55')) d = d.slice(2, 2 + PHONE_MAX_LOCAL);
    else return `+${d.slice(0, PHONE_MAX_INTL)}`;
  }

  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Máscara progressiva de CPF: `000.000.000-00`. */
export function maskCpf(raw: string): string {
  return maskCpfInput(raw);
}

/** Máscara progressiva de CEP: `00000-000`. */
export function maskCep(raw: string): string {
  const d = onlyDigits(raw).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const CURRENCY_MAX_DIGITS = 10; // até R$ 99.999.999,99

/**
 * Máscara de valor em reais, estilo "digita os centavos": os dígitos entram
 * pela direita (`1` → `R$ 0,01`, `150` → `R$ 1,50`, `15000` → `R$ 150,00`).
 * Vazio continua vazio (campo opcional). Com `prev`, apagar até zerar limpa o
 * campo em vez de ficar preso em `R$ 0,00`.
 */
export function maskCurrency(raw: string, prev?: string): string {
  const digits = onlyDigits(raw).replace(/^0+(?=\d)/, '').slice(0, CURRENCY_MAX_DIGITS);
  if (!digits) return '';
  const cents = Number(digits);
  if (cents === 0 && prev !== undefined && raw.length < prev.length) return '';
  const padded = digits.padStart(3, '0');
  const int = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${int},${padded.slice(-2)}`;
}

/** Centavos → texto mascarado (`15000` → `R$ 150,00`). `null`/inválido → `''`. */
export function formatCentsBRL(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents) || cents < 0) return '';
  return maskCurrency(String(Math.round(cents)));
}

/**
 * Texto de um campo de valor → centavos. Aceita o formato mascarado
 * (`R$ 1.234,56`) e digitado solto (`150`, `150,5`, `150.50`). Vazio → `null`.
 */
export function parseCurrencyToCents(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.]/g, '');
  if (!cleaned) return null;
  // Com vírgula: ela é o separador decimal e os pontos são milhar.
  // Sem vírgula: ponto seguido de 1–2 dígitos no fim é decimal; senão, milhar.
  let normalized: string;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/\.\d{1,2}$/.test(cleaned)) {
    normalized = cleaned.replace(/\.(?=.*\.)/g, '');
  } else {
    normalized = cleaned.replace(/\./g, '');
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/**
 * Posição do cursor logo depois do `n`-ésimo dígito de `masked` (0 → início).
 * Usado para manter o cursor no lugar certo depois de reaplicar a máscara.
 */
export function caretAfterDigits(masked: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < masked.length; i++) {
    if (/\d/.test(masked[i])) {
      seen++;
      if (seen === n) return i + 1;
    }
  }
  return masked.length;
}
