import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export const middleware = withAuth(
  function middleware(req) {
    // Allow access to public routes without auth
    const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

    // If on public route, allow access
    if (publicRoutes.includes(req.nextUrl.pathname)) {
      return NextResponse.next();
    }

    // If on protected route without token, redirect to login
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow unauthenticated access to these routes
        return true; // We handle authorization in the middleware function above
      },
    },
  }
);

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|apple-touch-icon.png|mask-icon.svg).*)',
  ],
};
