import { NextRequest, NextResponse } from "next/server";

const rawBackendUrl = (
  process.env.INTERNAL_API_URL ||
  (process.env.NODE_ENV === "production" ? "http://backend:8000" : "http://127.0.0.1:8000")
).replace(/\/$/, "");

// Ensure baseHost is a valid absolute URL for server-side fetch
let baseHost = rawBackendUrl;
if (!baseHost.startsWith("http://") && !baseHost.startsWith("https://")) {
  baseHost = "http://127.0.0.1:8000";
}

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : "";

  const targetUrl = `${baseHost}/${targetPath}${queryString}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Exclude hop-by-hop headers and host/content-length
    if (
      lower !== "host" &&
      lower !== "connection" &&
      lower !== "content-length" &&
      lower !== "transfer-encoding"
    ) {
      headers.set(key, value);
    }
  });

  // Preserve tenant slug header if available
  const tenantSlug = request.headers.get("x-tenant-slug") || request.cookies.get("tenant_slug")?.value;
  if (tenantSlug) {
    headers.set("x-tenant-slug", tenantSlug);
  }

  try {
    let body: Buffer | undefined = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        body = Buffer.from(arrayBuffer);
      }
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Forward all response headers including set-cookie
      if (key.toLowerCase() === "set-cookie") {
        responseHeaders.append(key, value);
      } else {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Proxy Error] ${request.method} ${targetUrl}:`, error?.cause || error);
    return NextResponse.json(
      { detail: "No se pudo establecer conexión con el servidor. Por favor intenta más tarde." },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
