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

export function proxy(request: NextRequest) {
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
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .png, .jpg, .jpeg, .gif, .svg, .webp (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)',
  ],
};

