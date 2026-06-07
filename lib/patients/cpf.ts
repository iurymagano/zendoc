// Utilitários de CPF — normalização, validação (checksum) e máscara.
// Usado nos endpoints de pacientes/agendamentos e nos formulários da UI.

/** Remove tudo que não for dígito. */
export function normalizeCpf(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Valida um CPF: 11 dígitos + dígitos verificadores corretos.
 * Aceita string com ou sem máscara. Rejeita sequências repetidas (ex.: 111…).
 */
export function isValidCpf(raw: string): boolean {
  const cpf = normalizeCpf(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map(Number);
  for (let check = 9; check < 11; check++) {
    let sum = 0;
    for (let i = 0; i < check; i++) {
      sum += digits[i] * (check + 1 - i);
    }
    let verifier = (sum * 10) % 11;
    if (verifier === 10) verifier = 0;
    if (verifier !== digits[check]) return false;
  }
  return true;
}

/** Formata 11 dígitos como `000.000.000-00`. Devolve a entrada crua se não tiver 11 dígitos. */
export function formatCpf(raw: string): string {
  const cpf = normalizeCpf(raw);
  if (cpf.length !== 11) return raw;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

/** Máscara progressiva para input — formata enquanto o usuário digita, até 11 dígitos. */
export function maskCpfInput(raw: string): string {
  const cpf = normalizeCpf(raw).slice(0, 11);
  const parts = [
    cpf.slice(0, 3),
    cpf.slice(3, 6),
    cpf.slice(6, 9),
    cpf.slice(9, 11),
  ].filter(Boolean);
  if (parts.length <= 1) return parts.join('');
  if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
  if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
}
