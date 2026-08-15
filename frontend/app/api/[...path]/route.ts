import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.INTERNAL_API_URL ||
  (process.env.NODE_ENV === "production" ? "http://backend:8000" : "http://127.0.0.1:8000")
).replace(/\/$/, "");

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : "";

  const targetUrl = `${BACKEND_URL}/${targetPath}${queryString}`;

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
    const msg = error?.cause?.message || error?.message || "Proxy connection error to backend";
    return NextResponse.json(
      { detail: `Proxy error to ${targetUrl}: ${msg}` },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
