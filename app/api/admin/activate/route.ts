import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest){
  try{
    const {userId, days, credits} = await req.json();
    if(!userId) return NextResponse.json({error:"userId مطلوب"}, {status:400});

    if(days){
      const expires = new Date();
      expires.setDate(expires.getDate() + days);
      await supabaseAdmin.from("profiles").update({
        subscription_status:"pro",
        subscription_expires_at: expires.toISOString()
      }).eq("id", userId);
      
      // حدث حالة الدفع الى approved
      await supabaseAdmin.from("payments").update({status:"approved"}).eq("user_id", userId).eq("status","pending");

      return NextResponse.json({message: `تم تفعيل ${days} يوم بنجاح ✅`});
    }

    if(credits){
      const {data:profile} = await supabaseAdmin.from("profiles").select("credits").eq("id", userId).single();
      await supabaseAdmin.from("profiles").update({credits: (profile?.credits||0) + credits}).eq("id", userId);
      return NextResponse.json({message: `تمت إضافة ${credits} كريديت ✅`});
    }

    return NextResponse.json({error:"حدد days أو credits"}, {status:400});
  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
