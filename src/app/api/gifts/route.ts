import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { encryptGiftSecret, decryptGiftSecret } from "@/lib/crypto";
import { verifyWalletSignature } from "@/lib/walletAuth";
import { generateGiftClaimUrl, GiftClaimPayload } from "@/lib/gifting";

/**
 * POST /api/gifts
 * Creates a gift row with status 'awaiting_signature' before wallet prompt.
 * Encrypts secretKeyBase58 with GIFT_SECRET_KEY. Never logs or echoes the secret.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      sender,
      vault,
      secretKeyBase58,
      symbol,
      mint,
      rawAmount,
      estimatedUsd,
      note,
      unlockAt,
      expiresAt,
    } = body;

    // 1. Validate required fields
    if (!id || !sender || !vault || !secretKeyBase58 || !symbol || !mint || !rawAmount) {
      return NextResponse.json({ error: "Missing required gift creation parameters" }, { status: 400 });
    }

    // 2. Authenticate that the request comes from the sender
    const walletAddress = req.headers.get("x-wallet-address") || sender;
    const signatureBase58 = req.headers.get("x-wallet-signature") || "";
    const timestampStr = req.headers.get("x-wallet-timestamp") || "";

    if (walletAddress.toLowerCase() !== sender.toLowerCase()) {
      return NextResponse.json({ error: "Sender address mismatch in authentication header" }, { status: 403 });
    }

    const auth = verifyWalletSignature({ walletAddress, signatureBase58, timestampStr });
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized wallet signature" }, { status: 401 });
    }

    // 3. Encrypt the secret key with AES-256-GCM
    const secretEncrypted = encryptGiftSecret(secretKeyBase58);

    // 4. Insert into Supabase using server admin client
    const supabase = getSupabaseAdminClient();
    const { error: insertError } = await supabase.from("gifts").insert({
      id,
      sender,
      vault,
      secret_encrypted: secretEncrypted,
      symbol,
      mint,
      raw_amount: rawAmount,
      estimated_usd: estimatedUsd || 0,
      note: note || "",
      unlock_at: unlockAt || null,
      expires_at: expiresAt || null,
      status: "awaiting_signature",
      signature: null,
    });

    if (insertError) {
      // Intentionally do NOT log the payload or secret
      console.error("Insert error in POST /api/gifts:", insertError.message);
      return NextResponse.json({ error: "Unable to initialize gift session" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id,
      status: "awaiting_signature",
    });
  } catch (err: any) {
    console.error("POST /api/gifts handler error:", err?.message || "Internal error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/gifts
 * Updates gift status (e.g. submitted, funded, claimed, reclaimed, failed, unknown) and tx signature.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, signature } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing gift id or target status" }, { status: 400 });
    }

    const validStatuses = [
      "awaiting_signature",
      "submitted",
      "funded",
      "claimed",
      "reclaimed",
      "failed",
      "unknown",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const walletAddress = req.headers.get("x-wallet-address") || "";
    const signatureBase58 = req.headers.get("x-wallet-signature") || "";
    const timestampStr = req.headers.get("x-wallet-timestamp") || "";

    const isClaimStatusWithTxSignature =
      status === "claimed" && typeof signature === "string" && signature.length >= 64;

    if (!isClaimStatusWithTxSignature) {
      const auth = verifyWalletSignature({ walletAddress, signatureBase58, timestampStr });
      if (!auth.isValid) {
        return NextResponse.json({ error: auth.error || "Unauthorized wallet signature" }, { status: 401 });
      }
    }

    const supabase = getSupabaseAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("gifts")
      .select("id, sender, status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Gift record not found" }, { status: 404 });
    }

    // Sender permissions
    const isSender = walletAddress
      ? existing.sender.toLowerCase() === walletAddress.toLowerCase()
      : false;
    if (!isSender && status !== "claimed") {
      return NextResponse.json({ error: "Only the gift sender can perform this status transition" }, { status: 403 });
    }

    const updatePayload: Record<string, any> = { status };
    if (signature) {
      updatePayload.signature = signature;
    }
    // Secure link destruction: permanently wipe encrypted vault secret key on claim or reclaim
    if (status === "claimed" || status === "reclaimed") {
      updatePayload.secret_encrypted = null;
    }

    const { error: updateError } = await supabase
      .from("gifts")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("Storage update error in PATCH /api/gifts:", updateError.message);
      return NextResponse.json({ error: "Failed to update gift status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, status });
  } catch (err: any) {
    console.error("PATCH /api/gifts handler error:", err?.message || "Internal error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/gifts?id=<giftId>
 * Discards an un-submitted draft (status awaiting_signature).
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing gift id parameter" }, { status: 400 });
    }

    const walletAddress = req.headers.get("x-wallet-address") || "";
    const signatureBase58 = req.headers.get("x-wallet-signature") || "";
    const timestampStr = req.headers.get("x-wallet-timestamp") || "";

    const auth = verifyWalletSignature({ walletAddress, signatureBase58, timestampStr });
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized wallet signature" }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("gifts")
      .select("id, sender, status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Gift record not found" }, { status: 404 });
    }

    if (existing.sender.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Only the gift sender can discard this draft" }, { status: 403 });
    }

    // Only awaiting_signature drafts can be deleted
    if (existing.status !== "awaiting_signature") {
      return NextResponse.json({ error: "Cannot delete a gift that has already been submitted to the blockchain" }, { status: 400 });
    }

    const { error: deleteError } = await supabase.from("gifts").delete().eq("id", id);
    if (deleteError) {
      return NextResponse.json({ error: "Failed to discard draft" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("DELETE /api/gifts handler error:", err?.message || "Internal error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/gifts?sender=<address>
 * Returns gifts sent by the caller. Authenticated via wallet signature.
 * Decrypts secretKeyBase58 ONLY for active submitted/funded gifts to build claimUrl.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sender = searchParams.get("sender");

    if (!sender) {
      return NextResponse.json({ error: "Missing sender query parameter" }, { status: 400 });
    }

    const walletAddress = req.headers.get("x-wallet-address") || sender;
    const signatureBase58 = req.headers.get("x-wallet-signature") || "";
    const timestampStr = req.headers.get("x-wallet-timestamp") || "";

    if (walletAddress.toLowerCase() !== sender.toLowerCase()) {
      return NextResponse.json({ error: "Sender address mismatch in authentication header" }, { status: 403 });
    }

    const auth = verifyWalletSignature({ walletAddress, signatureBase58, timestampStr });
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized wallet signature" }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: rows, error: selectError } = await supabase
      .from("gifts")
      .select("*")
      .eq("sender", sender)
      .order("created_at", { ascending: false });

    if (selectError) {
      console.error("Storage query error in GET /api/gifts:", selectError.message);
      return NextResponse.json({ error: "Failed to query gifts" }, { status: 500 });
    }

    const results = (rows || []).map((row: any) => {
      let claimUrl: string | undefined = undefined;
      let secretKeyBase58: string | undefined = undefined;

      // Only decrypt for submitted or funded gifts where secret is still needed by sender
      if ((row.status === "submitted" || row.status === "funded") && row.secret_encrypted) {
        try {
          const decrypted = decryptGiftSecret(row.secret_encrypted);
          secretKeyBase58 = decrypted;
          const payload: GiftClaimPayload = {
            id: row.id,
            symbol: row.symbol,
            shareAmount: 0,
            rawAmountString: row.raw_amount,
            estimatedUsd: Number(row.estimated_usd || 0),
            senderName: "A Friend",
            senderPublicKey: row.sender,
            note: row.note || "",
            unlockTimestamp: row.unlock_at ? Math.floor(new Date(row.unlock_at).getTime() / 1000) : 0,
            expiryTimestamp: row.expires_at ? Math.floor(new Date(row.expires_at).getTime() / 1000) : 0,
            theme: "gold",
            secretKeyBase58: decrypted,
            vaultPublicKey: row.vault,
          };
          claimUrl = generateGiftClaimUrl(payload);
        } catch (decryptErr) {
          console.error("Failed to decrypt gift secret for gift id:", row.id);
        }
      }

      return {
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
        signature: row.signature,
        status: row.status,
        createdAt: row.created_at,
        claimUrl,
        secretKeyBase58: row.status === "funded" || row.status === "submitted" ? secretKeyBase58 : undefined,
      };
    });

    return NextResponse.json({ gifts: results });
  } catch (err: any) {
    console.error("GET /api/gifts handler error:", err?.message || "Internal error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
