"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage(){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [loading,setLoading]=useState(false); const [mode,setMode]=useState<"login"|"signup">("signup");
  const router = useRouter();

  const handleAuth = async ()=>{
    setLoading(true);
    try{
      if(mode==="signup"){
        const {error} = await supabase.auth.signUp({email, password:pass});
        if(error) throw error;
        alert("تم إنشاء الحساب! تفقد إيميلك، ثم سجل دخول");
        setMode("login");
      } else {
        const {error} = await supabase.auth.signInWithPassword({email, password:pass});
        if(error) throw error;
        router.push("/dashboard");
      }
    } catch(e:any){ alert(e.message) } finally { setLoading(false) }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#141416] border border-zinc-800 rounded-[20px] p-8 w-full max-w-sm">
        <h1 className="text-2xl font-black text-center">مرحبا بك 👋</h1>
        <p className="text-sm text-zinc-500 text-center mt-2">سجل واحصل على 3 تحليلات مجانا</p>
        <div className="flex bg-[#0a0a0b] rounded-full p-1 mt-6">
          <button onClick={()=>setMode("signup")} className={`flex-1 py-2 rounded-full text-sm font-bold ${mode==="signup" ? "bg-white text-black":"text-zinc-500"}`}>تسجيل</button>
          <button onClick={()=>setMode("login")} className={`flex-1 py-2 rounded-full text-sm font-bold ${mode==="login" ? "bg-white text-black":"text-zinc-500"}`}>دخول</button>
        </div>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" className="w-full mt-6 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm" />
        <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="كلمة السر" className="w-full mt-3 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm" />
        <button onClick={handleAuth} disabled={loading} className="w-full mt-4 bg-[#D4FF32] text-black font-black py-3 rounded-xl">{loading?"جاري...": mode==="signup" ? "إنشاء حساب مجاني" : "تسجيل دخول"}</button>
        <p className="text-[11px] text-zinc-600 text-center mt-4">بالتسجيل توافق على الشروط والأحكام</p>
      </div>
    </main>
  );
}
