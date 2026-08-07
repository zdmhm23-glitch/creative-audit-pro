"use client";
import { useState, useEffect } from "react";

export default function AdminPage(){
  const [auth,setAuth]=useState(false);
  const [pass,setPass]=useState("");
  const [users,setUsers]=useState<any[]>([]);
  const [payments,setPayments]=useState<any[]>([]);
  const [stats,setStats]=useState<any>({});
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(false);

  const login = async ()=>{
    const res = await fetch("/api/admin/stats", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({password:pass})});
    if(res.ok){ setAuth(true); loadData(); } else { alert("كلمة السر خاطئة"); }
  };

  const loadData = async ()=>{
    setLoading(true);
    const [uRes, pRes, sRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/payments"),
      fetch("/api/admin/stats")
    ]);
    const u = await uRes.json(); const p = await pRes.json(); const s = await sRes.json();
    if(u.users) setUsers(u.users);
    if(p.payments) setPayments(p.payments);
    if(s.stats) setStats(s.stats);
    setLoading(false);
  };

  const activate = async (userId:string, days:number)=>{
    if(!confirm(`تفعيل اشتراك ${days} يوم؟`)) return;
    const res = await fetch("/api/admin/activate", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId, days})});
    const data = await res.json();
    if(res.ok){ alert(data.message); loadData(); } else alert(data.error);
  };

  const addCredits = async (userId:string)=>{
    const amount = prompt("عدد الكريديت؟", "10");
    if(!amount) return;
    const res = await fetch("/api/admin/activate", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId, credits: parseInt(amount)})});
    const data = await res.json();
    if(res.ok){ alert(data.message); loadData(); } else alert(data.error);
  };

  const filteredUsers = users.filter((u:any)=> u.email?.toLowerCase().includes(search.toLowerCase()));

  if(!auth){
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0b]">
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
          <h1 className="font-black text-xl text-center">🔐 لوحة تحكم Admin</h1>
          <p className="text-xs text-zinc-500 text-center mt-2">ادخل كلمة سر الإدارة</p>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="ADMIN_PASSWORD" className="w-full mt-6 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm" />
          <button onClick={login} className="w-full mt-3 bg-[#D4FF32] text-black font-black py-3 rounded-xl">دخول</button>
          <p className="text-[10px] text-zinc-600 mt-4 text-center">كلمة السر موجودة في .env.local > ADMIN_PASSWORD</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-[#0a0a0b] max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black">👑 لوحة تحكم Creative Audit</h1>
        <button onClick={()=>setAuth(false)} className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full text-xs">خروج</button>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5"><div className="text-xs text-zinc-500">إجمالي المستخدمين</div><div className="text-2xl font-black mt-1">{stats.totalUsers || 0}</div></div>
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5"><div className="text-xs text-zinc-500">مشتركين Pro</div><div className="text-2xl font-black mt-1 text-[#D4FF32]">{stats.proUsers || 0}</div></div>
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5"><div className="text-xs text-zinc-500">تحليلات اليوم</div><div className="text-2xl font-black mt-1">{stats.todayAnalyses || 0}</div></div>
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5"><div className="text-xs text-zinc-500">إجمالي التحليلات</div><div className="text-2xl font-black mt-1">{stats.totalAnalyses || 0}</div></div>
      </div>

      <div className="grid md:grid-cols-[1fr_340px] gap-6">
        {/* USERS */}
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">👥 المستخدمين</h2>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالإيميل..." className="bg-[#0a0a0b] border border-zinc-800 rounded-full px-4 py-1.5 text-xs w-48" />
          </div>
          <div className="space-y-2 max-h-[600px] overflow-auto">
            {filteredUsers.map((u:any)=>(
              <div key={u.id} className="bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                <div><div className="text-sm font-bold">{u.email}</div><div className="text-[11px] text-zinc-500">{u.credits} كريديت • {u.subscription_status} {u.subscription_expires_at ? "• ينتهي "+ new Date(u.subscription_expires_at).toLocaleDateString("ar-DZ") : ""}</div></div>
                <div className="flex gap-1">
                  <button onClick={()=>activate(u.id,30)} className="bg-[#D4FF32] text-black text-[11px] font-black px-3 py-1.5 rounded-full">30 يوم</button>
                  <button onClick={()=>activate(u.id,90)} className="bg-white text-black text-[11px] font-bold px-3 py-1.5 rounded-full">90 يوم</button>
                  <button onClick={()=>addCredits(u.id)} className="bg-zinc-800 text-white text-[11px] px-3 py-1.5 rounded-full">+ كريديت</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENTS & ACTIONS */}
        <div className="space-y-6">
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5">
            <h2 className="font-bold text-sm mb-3">💳 مدفوعات BaridiMob المعلقة</h2>
            {payments.length===0 ? <p className="text-xs text-zinc-600">لا يوجد مدفوعات معلقة</p> : payments.map((p:any)=>(
              <div key={p.id} className="bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 mb-2">
                <div className="text-xs font-bold">{p.user_email || p.user_id}</div>
                <div className="text-[11px] text-zinc-500">{p.amount} دج • {new Date(p.created_at).toLocaleDateString()}</div>
                <div className="flex gap-1 mt-2"><button onClick={()=>activate(p.user_id,30)} className="flex-1 bg-[#D4FF32] text-black text-xs font-black py-1.5 rounded-full">تفعيل 30 يوم</button></div>
              </div>
            ))}
          </div>

          <div className="bg-[#D4FF32] text-black rounded-2xl p-5">
            <h3 className="font-black text-sm">🚀 تفعيل سريع</h3>
            <p className="text-xs mt-2">العميل يبعثلك وصل BaridiMob في واتساب، تبحث عن إيميله فوق وتضغط <b>30 يوم</b> - يتفعل فورا وينقص من العداد تلقائيا!</p>
            <div className="mt-3 bg-black text-[#D4FF32] rounded-xl p-2 text-[11px] font-mono">BaridiMob: 0079 9999 XXX<br/>CCP: 00XXXXXX</div>
          </div>
        </div>
      </div>
    </main>
  );
}
