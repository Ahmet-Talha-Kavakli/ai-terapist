import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Protected routes — with and without locale prefix
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', '/tr/dashboard(.*)',
  '/session(.*)',   '/tr/session(.*)',
  '/history(.*)',   '/tr/history(.*)',
  '/profile(.*)',   '/tr/profile(.*)',
  '/onboarding(.*)','\/tr/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Protect private routes — redirect unauthenticated users to sign-in
  if (isProtectedRoute(req) && !userId) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // Signed-in user hitting the root → redirect to dashboard
  if (userId && (pathname === '/' || pathname === '/tr')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/tr' ? '/tr/dashboard' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // Skip intl middleware for API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Let next-intl handle locale routing
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|glb|gltf|bin)).*)',
    '/(api|trpc)(.*)',
  ],
};
