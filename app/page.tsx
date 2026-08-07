import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#0a0a0b]">
      {/* NAV */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#D4FF32] rounded-lg flex items-center justify-center font-black text-black">C</div><span className="font-black">CREATIVE.AUDIT</span></div>
        <Link href="/auth" className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold">دخول / تسجيل</Link>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs mb-6">🔥 أكثر من 1,200 كرياتيف تم تحليله هذا الشهر</div>
        <h1 className="text-5xl md:text-7xl font-black leading-[1.1]">حلّل كرياتيف إعلانك<br/><span className="text-[#D4FF32]">قبل ما تخسر 100$</span></h1>
        <p className="text-zinc-400 mt-6 max-w-2xl mx-auto text-lg">90% من الإعلانات تفشل بسبب كرياتيف ضعيف. أداتنا تحلل صورتك أو فيديوك بالذكاء الاصطناعي وتعطيك سكور، أخطاء، وتوصيات بلهجة جزائرية في 10 ثواني.</p>
        <div className="flex gap-3 justify-center mt-8">
          <Link href="/auth" className="bg-[#D4FF32] text-black font-black px-8 py-4 rounded-full text-lg">جرّب مجانا - 3 تحليلات</Link>
          <a href="#pricing" className="bg-zinc-900 border border-zinc-800 px-8 py-4 rounded-full font-bold">شوف الأسعار</a>
        </div>
        <div className="mt-12 bg-[#141416] border border-zinc-800 rounded-[24px] p-3 max-w-4xl mx-auto"><div className="bg-[#0a0a0b] rounded-[16px] h-[420px] flex items-center justify-center text-zinc-600">🎬 فيديو توضيحي / صورة للداشبورد هنا</div></div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-4">
        {[
          {t:"تحليل الهوك", d:"نقيس قوة أول 3 ثواني، هل تشد الانتباه؟"},
          {t:"فحص النصوص", d:"نتأكد نسبة النص أقل من 20% حسب سياسات فيسبوك"},
          {t:"توصيات جزائرية", d:"نعطيك هوكات و CTAs بلهجة DZ ترفع الـ CTR"},
          {t:"حفظ التحليلات", d:"كل تحليلاتك محفوظة وتقدر تقارن A/B"},
          {t:"امتثال المنصات", d:"نكشف الكلمات الممنوعة والـ Before/After"},
          {t:"سريع ورخيص", d:"10 ثواني فقط وتكلفة 0.01$ للتحليل"},
        ].map((f,i)=><div key={i} className="bg-[#141416] border border-zinc-800 rounded-2xl p-6"><h3 className="font-bold">{f.t}</h3><p className="text-sm text-zinc-500 mt-2">{f.d}</p></div>)}
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-black text-center mb-12">سعر قهوة.. وتوفر 100$ إعلانات</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#141416] border border-zinc-800 rounded-[20px] p-7">
            <h3>مجاني</h3><p className="text-3xl font-black mt-3">0 دج</p><ul className="text-sm text-zinc-400 mt-6 space-y-2"><li>✓ 3 تحليلات مجانا</li><li>✓ حفظ التحليلات</li><li>✓ هوكات مقترحة</li></ul>
            <Link href="/auth" className="block text-center mt-6 bg-zinc-900 border border-zinc-800 py-3 rounded-full font-bold">ابدأ مجانا</Link>
          </div>
          <div className="bg-[#D4FF32] text-black rounded-[20px] p-7 scale-105">
            <div className="bg-black text-white text-xs px-3 py-1 rounded-full inline-block">الأكثر طلبا</div><h3 className="font-black mt-3">برو - شهري</h3><p className="text-4xl font-black mt-3">1900 دج</p><p className="text-sm opacity-70">~ 12$ فقط</p><ul className="text-sm mt-6 space-y-2 font-medium"><li>✓ تحليلات غير محدودة</li><li>✓ مقارنة A/B</li><li>✓ تصدير PDF</li><li>✓ دعم واتساب</li></ul>
            <Link href="/auth" className="block text-center mt-6 bg-black text-white py-3 rounded-full font-bold">اشترك الآن</Link>
            <p className="text-[11px] mt-3 text-center">دفع عبر BaridiMob أو LemonSqueezy</p>
          </div>
          <div className="bg-[#141416] border border-zinc-800 rounded-[20px] p-7">
            <h3>وكالات</h3><p className="text-3xl font-black mt-3">5900 دج</p><ul className="text-sm text-zinc-400 mt-6 space-y-2"><li>✓ 5 حسابات</li><li>✓ API خاص</li><li>✓ White-label</li></ul>
            <a href="https://wa.me/213000000000" className="block text-center mt-6 bg-zinc-900 border border-zinc-800 py-3 rounded-full font-bold">تواصل معنا</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-600">© 2026 Creative Audit Pro - Made in Constantine, DZ</footer>
    </main>
  );
}
