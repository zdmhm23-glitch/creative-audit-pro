import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, frames, mediaType, platform, goal, niche, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "غير مسجل" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "البروفايل غير موجود" }, { status: 404 });
    }

    const now = new Date();
    const isPro =
      profile.subscription_status === "pro" &&
      profile.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > now;

    if (!isPro && profile.credits <= 0) {
      return NextResponse.json(
        { error: "انتهت محاولاتك المجانية. اشترك بـ 1900 دج" },
        { status: 403 }
      );
    }

    const isVideo = mediaType === "video";
    const imagesToSend: string[] = isVideo
      ? Array.isArray(frames)
        ? frames.slice(0, 6)
        : []
      : imageBase64
      ? [imageBase64]
      : [];

    if (imagesToSend.length === 0) {
      return NextResponse.json(
        { error: "لا توجد صورة أو لقطات فيديو صالحة للتحليل" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const prompt = isVideo
      ? `أنت خبير تحليل إعلانات فيديو. حلل فقط ما يظهر بوضوح في هذه اللقطات المتتالية من فيديو إعلاني. لا تخمّن ولا تفترض عناصر غير موجودة. إذا لم يكن هناك نص واضح فلا تقل إن النص كثير. إذا لم يوجد CTA واضح فاذكر أنه غير ظاهر. إذا كانت المعلومة غير مؤكدة ضع null بدل التخمين. أرجع JSON فقط بهذا الشكل:
{
  "overall_score": 0,
  "verdict": "",
  "has_text": false,
  "text_density": null,
  "cta_present": false,
  "metrics": {
    "hook": 0,
    "clarity": 0,
    "text": null,
    "cta": null,
    "compliance": 0,
    "quality": 0
  },
  "critical_issues": [],
  "recommendations": [],
  "hooks": []
}`
      : `أنت خبير تحليل إعلانات صور. حلل فقط ما يظهر بوضوح في الصورة. لا تخمّن ولا تفترض عناصر غير موجودة. إذا لم يكن هناك نص واضح فلا تقل إن النص كثير. إذا لم يوجد CTA واضح فاذكر أنه غير ظاهر. إذا كانت المعلومة غير مؤكدة ضع null بدل التخمين. أرجع JSON فقط بهذا الشكل:
{
  "overall_score": 0,
  "verdict": "",
  "has_text": false,
  "text_density": null,
  "cta_present": false,
  "metrics": {
    "hook": 0,
    "clarity": 0,
    "text": null,
    "cta": null,
    "compliance": 0,
    "quality": 0
  },
  "critical_issues": [],
  "recommendations": [],
  "hooks": []
}`;

    const content: any[] = [{ type: "text", text: prompt }];
    for (const img of imagesToSend) {
      content.push({ type: "image_url", image_url: { url: img } });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        max_tokens: 800,
      }),
    });

    const rawOpenAI = await openaiRes.text();

    let openaiData: any;
    try {
      openaiData = JSON.parse(rawOpenAI);
    } catch {
      return NextResponse.json(
        { error: `استجابة OpenAI غير صالحة: ${rawOpenAI.slice(0, 300)}` },
        { status: 502 }
      );
    }

    if (!openaiRes.ok) {
      const msg = openaiData?.error?.message || "فشل تحليل OpenAI";

      if (msg.toLowerCase().includes("incorrect api key")) {
        return NextResponse.json(
          { error: "مفتاح OpenAI غير صحيح. تحقق من OPENAI_API_KEY في Vercel." },
          { status: 502 }
        );
      }

      if (
        msg.toLowerCase().includes("insufficient_quota") ||
        msg.toLowerCase().includes("billing") ||
        msg.toLowerCase().includes("quota")
      ) {
        return NextResponse.json(
          { error: "خدمة التحليل متوقفة مؤقتًا: لا يوجد رصيد أو billing غير مفعّل في OpenAI." },
          { status: 502 }
        );
      }

      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const rawContent = openaiData?.choices?.[0]?.message?.content || "";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(
        { error: "لم يرجع OpenAI تحليلاً صالحًا بصيغة JSON" },
        { status: 502 }
      );
    }

    let analysis: any;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "تعذر قراءة JSON القادم من OpenAI" },
        { status: 502 }
      );
    }

    const { error: insertError } = await supabaseAdmin.from("analyses").insert({
      user_id: userId,
      platform,
      goal,
      niche,
      overall_score: analysis.overall_score,
      result: analysis,
      media_type: isVideo ? "video" : "image",
    });

    if (insertError) {
      return NextResponse.json({ error: "فشل حفظ التحليل في قاعدة البيانات" }, { status: 500 });
    }

    let remainingCredits = profile.credits;
    if (!isPro) {
      remainingCredits = Math.max(profile.credits - 1, 0);
      await supabaseAdmin.from("profiles").update({ credits: remainingCredits }).eq("id", userId);
    }

    return NextResponse.json({
      analysis,
      remainingCredits,
      subscription_status: isPro ? "pro" : profile.subscription_status,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
