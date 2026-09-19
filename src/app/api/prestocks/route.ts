import { NextResponse } from "next/server";

/**
 * Server-side proxy for the PreStocks catalog.
 *
 * WHY THIS EXISTS
 * ---------------
 * `https://prestocks.com/api/prestocks` returns HTTP 200 with valid JSON, but it
 * sends NO `Access-Control-Allow-Origin` header. Browsers therefore block the
 * response and the client throws:
 *
 *     TypeError: Failed to fetch
 *
 * That is a CORS rule enforced by the browser and cannot be worked around from
 * client-side code (env vars, retries, or URL tweaks make no difference).
 *
 * Server-side fetches are NOT subject to CORS. This route fetches upstream from
 * the server and re-serves the payload from our own origin, so the browser can
 * read it as a normal same-origin response.
 *
 * Upstream is configurable with the server-only `PRESTOCKS_API_URL` env var.
 * Do NOT use a NEXT_PUBLIC_ var here — that would leak back into the client
 * bundle and re-introduce the original problem.
 */

const UPSTREAM =
  process.env.PRESTOCKS_API_URL || "https://prestocks.com/api/prestocks";

// Cache the upstream payload for 60s (ISR), and let the CDN serve stale data
// for up to 5 minutes while revalidating in the background.
export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetch(UPSTREAM, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream responded with ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Upstream returned an empty or malformed payload" },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Upstream fetch failed",
      },
      { status: 502 }
    );
  }
}
