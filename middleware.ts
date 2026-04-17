import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  const isDashboard =
    path.startsWith('/dashboard') ||
    path.startsWith('/agenda') ||
    path.startsWith('/configuracoes') ||
    path.startsWith('/onboarding');

  const isAuth = path.startsWith('/login') || path.startsWith('/register');

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuth && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
