import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest){
  try{
    const {code, userId} = await req.json();
    if(!code || !userId) return NextResponse.json({error:"بيانات ناقصة"}, {status:400});

    const {data:coupon} = await supabaseAdmin.from("coupons").select("*").eq("code", code.toUpperCase()).eq("is_active", true).single();
    if(!coupon) return NextResponse.json({error:"الكوبون غير صالح"}, {status:404});
    if(coupon.expires_at && new Date(coupon.expires_at) < new Date()) return NextResponse.json({error:"الكوبون منتهي"}, {status:400});
    if(coupon.used_count >= coupon.max_uses) return NextResponse.json({error:"الكوبون استهلك"}, {status:400});

    const {data:profile} = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
    let update:any = {};
    let message="";

    if(coupon.type==="credits"){
      update.credits = profile.credits + coupon.value;
      message = `تمت إضافة ${coupon.value} محاولات!`;
    } else if(coupon.type==="subscription"){
      const expires = new Date();
      expires.setDate(expires.getDate() + coupon.value);
      update.subscription_status = "pro";
      update.subscription_expires_at = expires.toISOString();
      message = `تم تفعيل اشتراك برو لمدة ${coupon.value} يوم!`;
    }

    await supabaseAdmin.from("profiles").update(update).eq("id", userId);
    await supabaseAdmin.from("coupons").update({used_count: coupon.used_count + 1}).eq("id", coupon.id);

    const {data:newProfile} = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
    return NextResponse.json({message, credits:newProfile.credits, subscription_status:newProfile.subscription_status, expires_at:newProfile.subscription_expires_at});
  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
