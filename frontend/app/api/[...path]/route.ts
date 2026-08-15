import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.INTERNAL_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : "";

  const targetUrl = `${BACKEND_URL}/${targetPath}${queryString}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  // Preserve tenant slug header if available
  const tenantSlug = request.headers.get("x-tenant-slug") || request.cookies.get("tenant_slug")?.value;
  if (tenantSlug) {
    headers.set("x-tenant-slug", tenantSlug);
  }

  try {
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.blob()
        : undefined;

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

    const res = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Proxy connection error to backend" },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
