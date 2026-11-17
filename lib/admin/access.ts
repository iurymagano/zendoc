// Acesso ao painel /admin: só os e-mails listados em ADMIN_EMAILS (separados
// por vírgula) entram. Lista vazia ou ausente = ninguém é admin.

/** true se o e-mail está em ADMIN_EMAILS (sem diferenciar maiúsculas nem espaços). */
export function isAdminEmail(
  email?: string | null,
  adminEmails: string | undefined = process.env.ADMIN_EMAILS,
): boolean {
  const target = email?.trim().toLowerCase();
  if (!target || !adminEmails) return false;
  return adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(target);
}

/**
 * Guarda de servidor das páginas /admin: exige sessão de admin e devolve a
 * sessão. Quem não é admin (ou não está logado) recebe 404, para não revelar
 * que a página existe. Os imports são dinâmicos para o módulo continuar
 * testável sem o NextAuth/Next carregados.
 */
export async function requireAdmin() {
  const { auth } = await import('@/auth');
  const { notFound } = await import('next/navigation');
  const session = await auth();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) notFound();
  return session;
}
