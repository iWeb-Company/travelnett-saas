import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join("/");

  // 1. Intentar backend local primero (http://127.0.0.1:8000/data/...)
  const localUrl = `http://127.0.0.1:8000/data/${targetPath}`;
  try {
    const localRes = await fetch(localUrl);
    if (localRes.ok) {
      return new NextResponse(localRes.body, {
        status: localRes.status,
        headers: localRes.headers,
      });
    }
  } catch (err) {
    // Continuar al VPS si falla local
  }

  // 2. Fallback al VPS de producción (https://tranett.com/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/data/...)
  const vpsUrl = `https://tranett.com/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/data/${targetPath}`;
  try {
    const vpsRes = await fetch(vpsUrl);
    if (vpsRes.ok) {
      const headers = new Headers(vpsRes.headers);
      return new NextResponse(vpsRes.body, {
        status: vpsRes.status,
        headers,
      });
    }
  } catch (err) {
    console.error("[Asset Proxy Error] Failed to fetch from VPS:", err);
  }

  return new NextResponse("Not Found", { status: 404 });
}
