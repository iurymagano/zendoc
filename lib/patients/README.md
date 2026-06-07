# lib/patients/

Utilitários de domínio do paciente.

---

## cpf.ts

**O que faz:** normaliza, valida (com dígitos verificadores) e formata CPF.
Usado nos endpoints (`/api/patients`, `/api/patients/[id]`, `/api/appointments`)
e nos formulários de `/pacientes` e `/agenda`.

**Exporta:**

- `normalizeCpf(raw: string): string` — remove tudo que não for dígito.
- `isValidCpf(raw: string): boolean` — `true` se tiver 11 dígitos e checksum
  válido. Rejeita sequências repetidas (ex.: `111…`). Aceita com ou sem máscara.
- `formatCpf(raw: string): string` — formata 11 dígitos como `000.000.000-00`;
  devolve a entrada crua se não tiver 11 dígitos.
- `maskCpfInput(raw: string): string` — máscara progressiva para input, formata
  enquanto o usuário digita (limita a 11 dígitos).

**Depende de:** nada (funções puras).

**Notas:** o CPF é persistido **apenas com dígitos** no banco (sem máscara). A
máscara existe só na camada de UI. Campo opcional — vazio vira `null`.
