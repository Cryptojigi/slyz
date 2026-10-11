import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { category, subject, message, contact, wallet, pageUrl } = body;

    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "Please select an inquiry category" }, { status: 400 });
    }
    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json({ error: "Please provide a subject line" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a detailed description (at least 10 characters)" },
        { status: 400 }
      );
    }

    const cleanCategory = category.trim().slice(0, 50);
    const cleanSubject = subject.trim().slice(0, 150);
    const cleanMessage = message.trim().slice(0, 3000);
    const cleanContact = typeof contact === "string" ? contact.trim().slice(0, 100) : null;
    const cleanWallet = typeof wallet === "string" ? wallet.trim().slice(0, 64) : null;
    const cleanPageUrl = typeof pageUrl === "string" ? pageUrl.trim().slice(0, 200) : null;

    // 1. Archive feedback record in Supabase
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from("feedback").insert({
        category: cleanCategory,
        subject: cleanSubject,
        message: cleanMessage,
        contact: cleanContact,
        wallet: cleanWallet,
        page_url: cleanPageUrl,
      });
    } catch (dbErr: any) {
      console.warn("Feedback archiving note:", dbErr?.message || "Skipped storage");
    }

    // 2. Dispatch alert directly to Telegram channel / group if configured
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const categoryMap: Record<string, string> = {
        technical_issue: "🛠 Technical Issue / Bug",
        transaction_inquiry: "💳 Transaction / Gifting Issue",
        user_experience: "💡 User Experience / Feedback",
        general_inquiry: "📋 General Inquiry",
      };
      const readableCategory = categoryMap[cleanCategory] || cleanCategory;

      const telegramText =
        `📬 *New Feedback / Support Inquiry*\n\n` +
        `*Category:* ${readableCategory}\n` +
        `*Subject:* ${cleanSubject}\n\n` +
        `*Message:*\n${cleanMessage}\n\n` +
        (cleanContact ? `*Contact:* \`${cleanContact}\`\n` : `*Contact:* None provided\n`) +
        (cleanWallet ? `*Wallet:* \`${cleanWallet}\`\n` : "") +
        (cleanPageUrl ? `*Page:* ${cleanPageUrl}\n` : "") +
        `*Time:* ${new Date().toUTCString()}`;

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramText,
            parse_mode: "Markdown",
            disable_web_page_preview: true,
          }),
        });
        if (!tgRes.ok) {
          const errText = await tgRes.text();
          console.warn("Telegram dispatch notification:", errText);
        }
      } catch (tgErr: any) {
        console.warn("Telegram webhook exception:", tgErr?.message);
      }
    }

    const directTelegramUrl =
      process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL?.trim() || "https://t.me/Useslyz";

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      telegramDirectUrl: directTelegramUrl,
    });
  } catch (err: any) {
    console.error("Feedback endpoint error:", err?.message || "Internal error");
    return NextResponse.json({ error: "Failed to process feedback. Please try again." }, { status: 500 });
  }
}
