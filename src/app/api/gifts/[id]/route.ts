import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

/**
 * GET /api/gifts/[id]
 * Public metadata endpoint for the claim page.
 * NEVER returns secret_encrypted or any private key material.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing gift id" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: row, error } = await supabase
      .from("gifts")
      .select("id, sender, vault, symbol, mint, raw_amount, estimated_usd, note, unlock_at, expires_at, status, signature, created_at")
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    return NextResponse.json({
      gift: {
        id: row.id,
        sender: row.sender,
        vault: row.vault,
        symbol: row.symbol,
        mint: row.mint,
        rawAmount: row.raw_amount,
        estimatedUsd: Number(row.estimated_usd || 0),
        note: row.note || "",
        unlockAt: row.unlock_at,
        expiresAt: row.expires_at,
        status: row.status,
        signature: row.signature,
        createdAt: row.created_at,
      },
    });
  } catch (err: any) {
    console.error("GET /api/gifts/[id] error:", err?.message || "Internal error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
