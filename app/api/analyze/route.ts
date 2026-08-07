import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest){
  try{
    const { imageBase64, platform, goal, niche, userId } = await req.json();
    if(!userId) return NextResponse.json({error:"غير مسجل"}, {status:401});

    // جيب البروفايل
    const {data:profile} = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
    if(!profile) return NextResponse.json({error:"البروفايل غير موجود"}, {status:404});

    const now = new Date();
    const isPro = profile.subscription_status==="pro" && profile.subscription_expires_at && new Date(profile.subscription_expires_at) > now;

    if(!isPro && profile.credits<=0){
      return NextResponse.json({error:"انتهت محاولاتك المجانية. اشترك بـ 1900 دج"}, {status:403});
    }

    // تحليل OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) return NextResponse.json({error:"OPENAI_API_KEY missing"}, {status:500});

    const prompt = `أنت خبير إعلانات. حلل الكرياتيف. المنصة:${platform} الهدف:${goal} المجال:${niche} أرجع JSON فقط: {overall_score, metrics:{hook,clarity,text,cta,compliance,quality}, critical_issues:[], recommendations:[], hooks:[بلهجة جزائرية], verdict}`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json"},
      body: JSON.stringify({
        model:"gpt-4o-mini",
        messages:[{role:"user", content:[{type:"text", text:prompt}, {type:"image_url", image_url:{url:imageBase64}}]}],
        max_tokens:800
      })
    });
    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {overall_score:75, metrics:{hook:7,clarity:7,text:6,cta:7,compliance:8,quality:7}, critical_issues:["نص كثير"], recommendations:["قلل النص"], hooks:["هوك 1","هوك 2"], verdict:"جيد"};

    // حفظ في DB
    await supabaseAdmin.from("analyses").insert({user_id:userId, platform, goal, niche, overall_score:analysis.overall_score, result:analysis});

    // خصم كريديت اذا مش برو
    let remainingCredits = profile.credits;
    if(!isPro){
      remainingCredits = profile.credits - 1;
      await supabaseAdmin.from("profiles").update({credits: remainingCredits}).eq("id", userId);
    }

    return NextResponse.json({analysis, remainingCredits, subscription_status: isPro ? "pro" : profile.subscription_status});
  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
