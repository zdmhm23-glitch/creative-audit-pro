import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(){
  try{
    const {data:profiles} = await supabaseAdmin.from("profiles").select("*").order("created_at", {ascending:false}).limit(100);
    return NextResponse.json({users: profiles || []});
  } catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
