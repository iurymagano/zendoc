import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

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
      if (account?.provider === 'google' && user.email) {
        const { data: existing } = await supabase.auth.admin.listUsers();
        const found = existing.users.find((u) => u.email === user.email);
        if (!found) {
          await supabase.auth.admin.createUser({
            email: user.email,
            email_confirm: true,
            user_metadata: { name: user.name, provider: 'google' },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      if (token.email && !token.sub) {
        const { data } = await supabase.auth.admin.listUsers();
        const found = data.users.find((u) => u.email === token.email);
        if (found) token.sub = found.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
