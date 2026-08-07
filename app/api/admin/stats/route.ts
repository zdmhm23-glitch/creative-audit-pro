import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(){
  try{
    const {count: totalUsers} = await supabaseAdmin.from("profiles").select("*", {count:"exact", head:true});
    const {count: proUsers} = await supabaseAdmin.from("profiles").select("*", {count:"exact", head:true}).eq("subscription_status","pro");
    const {count: totalAnalyses} = await supabaseAdmin.from("analyses").select("*", {count:"exact", head:true});
    const today = new Date().toISOString().split("T")[0];
    const {count: todayAnalyses} = await supabaseAdmin.from("analyses").select("*", {count:"exact", head:true}).gte("created_at", today);

    return NextResponse.json({stats:{totalUsers, proUsers, totalAnalyses, todayAnalyses}});
  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}

export async function POST(req: NextRequest){
  try{
    const {password} = await req.json();
    if(password !== process.env.ADMIN_PASSWORD) return NextResponse.json({error:"كلمة السر خاطئة"}, {status:401});
    return NextResponse.json({ok:true});
  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
