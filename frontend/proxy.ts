import { NextRequest, NextResponse } from 'next/server';

export function extractSubdomain(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0].toLowerCase();

  // Ignorar hosts locales directos o IPs
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split('.');

  // Soporte para subdominio en desarrollo local (ej: ruta86.localhost)
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }

  // Subdominios en producción: {slug}.tranett.com
  if (parts.length >= 3) {
    const sub = parts[0];
    const reserved = ['www', 'api', 'ops', 'operations', 'admin', 'panel', 'mail', 'data'];
    if (reserved.includes(sub)) {
      return null;
    }
    return sub;
  }

  return null;
}

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

  const host = request.headers.get('host');
  const slug = extractSubdomain(host);

  const requestHeaders = new Headers(request.headers);
  if (slug) {
    requestHeaders.set('x-tenant-slug', slug);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (slug) {
    response.cookies.set('tenant_slug', slug, { path: '/', sameSite: 'lax' });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Excluir rutas estáticas, API, favicons e imágenes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)',
  ],
};
