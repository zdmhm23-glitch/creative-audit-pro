"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard(){
  const [user,setUser]=useState<any>(null);
  const [profile,setProfile]=useState<any>(null);
  const [image,setImage]=useState<string|null>(null);
  const [platform,setPlatform]=useState("فيسبوك");
  const [goal,setGoal]=useState("مبيعات");
  const [niche,setNiche]=useState("متجر الكتروني");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<any>(null);
  const [history,setHistory]=useState<any[]>([]);
  const [coupon,setCoupon]=useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(()=>{
    supabase.auth.getUser().then(async ({data})=>{
      if(!data.user) return router.push("/auth");
      setUser(data.user);
      const {data:prof} = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      setProfile(prof);
      const {data:hist} = await supabase.from("analyses").select("*").eq("user_id", data.user.id).order("created_at",{ascending:false}).limit(10);
      if(hist) setHistory(hist);
    });
  },[]);

  const handleFile = (e:any)=>{
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>setImage(r.result as string); r.readAsDataURL(f);
  };

  const analyze = async ()=>{
    if(!image) return alert("ارفع الكرياتيف");
    if(profile?.subscription_status!=="pro" && profile?.credits<=0) return alert("انتهت محاولاتك المجانية! جدد الاشتراك بـ 1900 دج");
    setLoading(true); setResult(null);
    try{
      const res=await fetch("/api/analyze",{method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({imageBase64:image, platform, goal, niche, userId:user.id})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error || "خطأ");
      setResult(data.analysis);
      // تحديث
      setProfile((p:any)=>({...p, credits: data.remainingCredits, subscription_status:data.subscription_status}));
      const {data:hist} = await supabase.from("analyses").select("*").eq("user_id", user.id).order("created_at",{ascending:false}).limit(10);
      if(hist) setHistory(hist);
    } catch(e:any){ alert(e.message) } finally { setLoading(false) }
  };

  const applyCoupon = async ()=>{
    if(!coupon) return;
    const res=await fetch("/api/coupon",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({code:coupon, userId:user.id})});
    const data=await res.json();
    if(!res.ok) return alert(data.error);
    alert(data.message);
    setProfile((p:any)=>({...p, credits: data.credits, subscription_status:data.subscription_status, subscription_expires_at:data.expires_at}));
    setCoupon("");
  };

  if(!profile) return <div className="p-10 text-center">جاري التحميل...</div>;

  const isPro = profile.subscription_status==="pro" && new Date(profile.subscription_expires_at) > new Date();

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#D4FF32] rounded-lg flex items-center justify-center font-black text-black">C</div><span className="font-black">DASHBOARD</span><span className={`text-xs px-2 py-1 rounded-full ${isPro ? "bg-[#D4FF32] text-black":"bg-zinc-800"}`}>{isPro ? "PRO" : `${profile.credits} محاولات`}</span></div>
        <button onClick={async()=>{await supabase.auth.signOut(); router.push("/")}} className="text-xs bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full">خروج</button>
      </header>

      {!isPro && (
        <div className="bg-[#D4FF32] text-black rounded-2xl p-4 flex justify-between items-center mb-6">
          <div><b>انتهت محاولاتك المجانية؟</b> <span className="text-sm">اشترك بـ 1900 دج / شهر تحليلات غير محدودة</span></div>
          <div className="flex gap-2"><a href="#pay" className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold">ادفع عبر BaridiMob</a></div>
        </div>
      )}

      <div className="grid md:grid-cols-[380px_1fr_280px] gap-5">
        {/* UPLOAD */}
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 h-fit">
          <h3 className="font-bold mb-3">ارفع الكرياتيف</h3>
          <div onClick={()=>fileRef.current?.click()} className="border-2 border-dashed border-zinc-700 rounded-xl h-[220px] flex flex-col items-center justify-center cursor-pointer bg-[#0a0a0b] overflow-hidden">
            {image ? <img src={image} className="w-full h-full object-contain"/> : <><span className="text-3xl">+</span><span className="text-xs text-zinc-500">PNG, JPG, MP4</span></>}
            <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleFile}/>
          </div>
          <select value={platform} onChange={e=>setPlatform(e.target.value)} className="w-full mt-3 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm"><option>فيسبوك</option><option>تيك توك</option><option>انستغرام</option></select>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <select value={goal} onChange={e=>setGoal(e.target.value)} className="bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm"><option>مبيعات</option><option>رسائل</option></select>
            <select value={niche} onChange={e=>setNiche(e.target.value)} className="bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm"><option>متجر الكتروني</option><option>تجميلي</option><option>عقارات</option></select>
          </div>
          <button onClick={analyze} disabled={loading} className="w-full mt-3 bg-[#D4FF32] text-black font-black py-3 rounded-xl">{loading?"جاري التحليل...":"حلل الآن ⚡"}</button>

          <div className="mt-6 border-t border-zinc-800 pt-4">
            <p className="text-xs font-bold mb-2">عندك كوبون؟</p>
            <div className="flex gap-2"><input value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="HATEM50" className="flex-1 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-2.5 text-sm"/><button onClick={applyCoupon} className="bg-white text-black px-4 rounded-xl text-sm font-bold">تفعيل</button></div>
          </div>

          <div id="pay" className="mt-6 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3">
            <p className="text-xs font-bold">💳 الدفع:</p>
            <p className="text-[11px] text-zinc-400 mt-2">BaridiMob: 00799999 0000000000<br/>CCP: 123456 clé 12<br/>بعد الدفع ابعث وصل في واتساب: 0550 00 00 00<br/>وسنفعل اشتراكك في أقل من ساعة</p>
            <a href="https://app.lemonsqueezy.com/checkout" target="_blank" className="block text-center mt-3 bg-zinc-800 py-2 rounded-full text-xs">دفع دولي عبر LemonSqueezy</a>
          </div>
        </div>

        {/* RESULT */}
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 min-h-[500px]">
          {!result && !loading && <div className="text-center py-24 text-zinc-500 text-sm">النتائج ستظهر هنا</div>}
          {loading && <div className="text-center py-24"><div className="animate-spin w-8 h-8 border-2 border-[#D4FF32] border-t-transparent rounded-full mx-auto mb-3"></div><p className="text-sm">نحلل بالذكاء الاصطناعي...</p></div>}
          {result && (
            <div>
              <div className="flex gap-4 items-center mb-6"><div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-2xl font-black border-4 border-[#D4FF32]">{result.overall_score}</div><div><h2 className="font-black text-xl">{result.verdict}</h2><p className="text-xs text-zinc-500">{result.overall_score>=80?"جاهز للإطلاق":"يحتاج تعديلات"}</p></div></div>
              <div className="grid grid-cols-3 gap-2 mb-6">{Object.entries(result.metrics||{}).map(([k,v]:any)=><div key={k} className="bg-[#0a0a0b] border border-zinc-800 rounded-lg p-3 text-center"><div className="text-[10px] text-zinc-500">{k}</div><div className="font-black">{v}/10</div></div>)}</div>
              <div className="space-y-3 text-sm"><div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3"><b className="text-red-300 text-xs">🚨 مشاكل:</b><ul className="mt-1">{result.critical_issues?.map((x:string,i:number)=><li key={i}>• {x}</li>)}</ul></div><div className="bg-lime-950/20 border border-lime-900/30 rounded-xl p-3"><b className="text-lime-300 text-xs">💡 توصيات:</b><ul className="mt-1">{result.recommendations?.map((x:string,i:number)=><li key={i}>• {x}</li>)}</ul></div><div className="bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3"><b className="text-xs">🔥 هوكات:</b><div className="mt-2 space-y-1">{result.hooks?.map((h:string,i:number)=><div key={i} className="bg-[#141416] p-2 rounded-lg text-xs">• {h}</div>)}</div></div></div>
            </div>
          )}
        </div>

        {/* HISTORY */}
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-4">📜 آخر تحليلاتك</h3>
          <div className="space-y-2">{history.length===0 && <p className="text-xs text-zinc-600">لا يوجد بعد</p>}{history.map((h:any)=><div key={h.id} className="bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3"><div className="flex justify-between text-xs"><span>{h.platform}</span><span className="font-black text-[#D4FF32]">{h.overall_score}/100</span></div><div className="text-[11px] text-zinc-500 mt-1">{new Date(h.created_at).toLocaleDateString("ar-DZ")}</div></div>)}</div>
        </div>
      </div>
    </main>
  );
}
