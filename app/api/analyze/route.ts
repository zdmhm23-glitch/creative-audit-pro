import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest){
  try{
    const { imageBase64, frames, mediaType, platform, goal, niche, userId } = await req.json();
    if(!userId) return NextResponse.json({error:"غير مسجل"}, {status:401});

    // جيب البروفايل
    const {data:profile} = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
    if(!profile) return NextResponse.json({error:"البروفايل غير موجود"}, {status:404});

    const now = new Date();
    const isPro = profile.subscription_status==="pro" && profile.subscription_expires_at && new Date(profile.subscription_expires_at) > now;
    if(!isPro && profile.credits<=0){
      return NextResponse.json({error:"انتهت محاولاتك المجانية. اشترك بـ 1900 دج"}, {status:403});
    }

    // جهز الصور المرسلة للتحليل (صورة واحدة أو عدة لقطات من فيديو)
    const isVideo = mediaType === "video";
    const imagesToSend: string[] = isVideo
      ? (Array.isArray(frames) ? frames.slice(0, 6) : [])
      : (imageBase64 ? [imageBase64] : []);

    if(imagesToSend.length===0){
      return NextResponse.json({error:"لا توجد صورة أو لقطات فيديو صالحة للتحليل"}, {status:400});
    }

    // تحليل OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) return NextResponse.json({error:"OPENAI_API_KEY missing"}, {status:500});

    const prompt = isVideo
      ? `أنت خبير إعلانات. حلل هذه اللقطات المتتالية من فيديو إعلاني (تمثل بداية ومنتصف ونهاية الفيديو). المنصة:${platform} الهدف:${goal} المجال:${niche} أرجع JSON فقط: {overall_score, metrics:{hook,clarity,text,cta,compliance,quality}, critical_issues:[], recommendations:[], hooks:[بلهجة جزائرية], verdict}`
      : `أنت خبير إعلانات. حلل الكرياتيف. المنصة:${platform} الهدف:${goal} المجال:${niche} أرجع JSON فقط: {overall_score, metrics:{hook,clarity,text,cta,compliance,quality}, critical_issues:[], recommendations:[], hooks:[بلهجة جزائرية], verdict}`;

    const content: any[] = [{type:"text", text:prompt}];
    for(const img of imagesToSend){
      content.push({type:"image_url", image_url:{url: img}});
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json"},
      body: JSON.stringify({
        model:"gpt-4o-mini",
        messages:[{role:"user", content}],
        max_tokens:800
      })
    });

    if(!openaiRes.ok){
      const errText = await openaiRes.text();
      return NextResponse.json({error:`فشل تحليل OpenAI: ${errText.slice(0,200)}`}, {status:502});
    }

    const openaiData = await openaiRes.json();
    const rawContent = openaiData.choices?.[0]?.message?.content || "";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
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
