import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(){
  const {data} = await supabaseAdmin.from("payments").select("*").eq("status","pending").order("created_at", {ascending:false});
  return NextResponse.json({payments: data || []});
}
