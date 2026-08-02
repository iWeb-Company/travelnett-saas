import { NextRequest, NextResponse } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token');

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Si la ruta es el root '/'
  if (pathname === '/') {
    if (token && token.value) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Si no hay token y se intenta acceder a una ruta protegida
  if ((!token || !token.value) && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si ya hay token y se intenta acceder a /login
  if (token && token.value && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Excluir rutas estáticas, API, favicons e imágenes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)',
  ],
};
