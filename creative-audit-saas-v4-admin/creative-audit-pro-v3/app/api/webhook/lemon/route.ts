import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// يربط مع LemonSqueezy Webhook
export async function POST(req: NextRequest){
  try{
    const body = await req.json();
    // LemonSqueezy يرسل email العميل
    const email = body.data?.attributes?.user_email || body.meta?.custom_data?.email;
    if(!email) return NextResponse.json({ok:true});

    // فعل الاشتراك 30 يوم
    const expires = new Date(); expires.setDate(expires.getDate()+30);
    await supabaseAdmin.from("profiles").update({subscription_status:"pro", subscription_expires_at: expires.toISOString()}).eq("email", email);

    return NextResponse.json({ok:true});
  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
