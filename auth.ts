import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// Procura o usuário do Supabase Auth pelo e-mail (paginando: o listUsers
// devolve no máximo `perPage` por chamada).
async function findSupabaseUserIdByEmail(email: string): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error('Erro ao listar usuários do Supabase:', error);
      return null;
    }
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

// Garante que existe um usuário no Supabase Auth para o e-mail e devolve o id
// dele. É esse id (e não o id aleatório que o NextAuth gera para o Google) que
// vai em `professionals.user_id` (FK para auth.users).
async function ensureSupabaseUserId(email: string, name?: string | null): Promise<string | null> {
  const existing = await findSupabaseUserIdByEmail(email);
  if (existing) return existing;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, provider: 'google' },
  });
  if (error || !data.user) {
    console.error('Erro ao criar usuário do Supabase:', error);
    return null;
  }
  return data.user.id;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        });
        if (error || !data.user) return null;
        return { id: data.user.id, email: data.user.email! };
      },
    }),
  ],
  pages: { signIn: '/login', newUser: '/onboarding/step-1' },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        const id = await ensureSupabaseUserId(user.email, user.name);
        return id !== null;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Login por e-mail/senha: o id já é o do Supabase.
      if (user && account?.provider === 'credentials') {
        token.sub = user.id;
        token.supabaseUser = true;
      }
      // Login com Google (e tokens antigos, emitidos antes desta correção, que
      // traziam o id aleatório do NextAuth): troca pelo id do Supabase Auth.
      if (!token.supabaseUser && token.email) {
        const id = await ensureSupabaseUserId(token.email, token.name);
        if (id) {
          token.sub = id;
          token.supabaseUser = true;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
