// Dados legais exibidos na /privacidade. Vêm do ambiente (Vercel) para nunca
// irem ao ar como texto provisório: sem a variável, a página omite a linha em
// vez de mostrar um campo "[a preencher]".
export interface PrivacyContact {
  controller: string | null; // razão social ou nome do responsável
  document: string | null; // CNPJ, CPF ou MEI, já formatado
  email: string | null; // contato do encarregado de dados (DPO)
}

function clean(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

export function getPrivacyContact(env: Record<string, string | undefined> = process.env): PrivacyContact {
  return {
    controller: clean(env.PRIVACY_CONTROLLER_NAME),
    document: clean(env.PRIVACY_CONTROLLER_DOC),
    email: clean(env.PRIVACY_CONTACT_EMAIL),
  };
}

// Linha "Operadora: ..." da seção 1; null quando não há nada a mostrar.
export function formatOperatorLine(c: PrivacyContact): string | null {
  const parts = [c.controller, c.document, c.email && `contato: ${c.email}`].filter(Boolean);
  return parts.length ? `Operadora: ${parts.join(', ')}.` : null;
}
