"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type MediaType = "image" | "video" | null;

async function extractVideoFrames(file: File, count = 6): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = async () => {
      try {
        const duration = Math.max(video.duration || 0, 1);
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("فشل إنشاء canvas");

        const frames: string[] = [];
        const positions = Array.from({ length: count }, (_, i) => {
          if (count === 1) return 0.5;
          const ratio = i / (count - 1);
          return Math.min(duration - 0.1, Math.max(0.1, ratio * duration));
        });

        const seekTo = (time: number) =>
          new Promise<void>((resolveSeek, rejectSeek) => {
            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              video.removeEventListener("error", onError);
              resolveSeek();
            };
            const onError = () => {
              video.removeEventListener("seeked", onSeeked);
              video.removeEventListener("error", onError);
              rejectSeek(new Error("تعذر قراءة إطار من الفيديو"));
            };
            video.addEventListener("seeked", onSeeked, { once: true });
            video.addEventListener("error", onError, { once: true });
            video.currentTime = time;
          });

        for (const t of positions) {
          await seekTo(t);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg", 0.82));
        }

        cleanup();
        resolve(frames);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("فشل تحميل الفيديو"));
    };
  });
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [compareMode, setCompareMode] = useState(false);

  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);

  const [mediaPreviewB, setMediaPreviewB] = useState<string | null>(null);
  const [mediaTypeB, setMediaTypeB] = useState<MediaType>(null);
  const [imageBase64B, setImageBase64B] = useState<string | null>(null);
  const [videoFramesB, setVideoFramesB] = useState<string[]>([]);

  const [platform, setPlatform] = useState("فيسبوك");
  const [goal, setGoal] = useState("مبيعات");
  const [niche, setNiche] = useState("متجر الكتروني");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resultB, setResultB] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [coupon, setCoupon] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const fileRefB = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/auth");
      setUser(data.user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      setProfile(prof);

      const { data: hist } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (hist) setHistory(hist);
    });
  }, [router]);

  const readFile = (
    f: File,
    setPreview: (v: string | null) => void,
    setType: (v: MediaType) => void,
    setImg: (v: string | null) => void,
    setFrames: (v: string[]) => void
  ) => {
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      alert("الملف يجب أن يكون صورة أو فيديو");
      return;
    }

    setFrames([]);
    setImg(null);

    if (isImage) {
      if (f.size > 10 * 1024 * 1024) {
        alert("حجم الصورة كبير جدًا. اختر صورة أقل من 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        setPreview(data);
        setImg(data);
        setType("image");
      };
      reader.readAsDataURL(f);
      return;
    }

    if (f.size > 40 * 1024 * 1024) {
      alert("حجم الفيديو كبير جدًا. اختر فيديو أقل من 40MB");
      return;
    }

    const objectUrl = URL.createObjectURL(f);
    setPreview(objectUrl);
    setType("video");
    extractVideoFrames(f, 6)
      .then(setFrames)
      .catch((err: any) => alert(err.message || "فشل استخراج لقطات من الفيديو"));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setResult(null);
    setComparison(null);
    readFile(f, setMediaPreview, setMediaType, setImageBase64, setVideoFrames);
  };

  const handleFileB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setResultB(null);
    setComparison(null);
    readFile(f, setMediaPreviewB, setMediaTypeB, setImageBase64B, setVideoFramesB);
  };

  const runAnalysis = async (
    type: MediaType,
    img: string | null,
    frames: string[]
  ) => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaType: type,
        imageBase64: img,
        frames: type === "video" ? frames : [],
        platform,
        goal,
        niche,
        userId: user.id,
      }),
    });

    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();
    const data = contentType.includes("application/json") ? JSON.parse(raw) : { error: raw };

    if (!res.ok) {
      throw new Error(data.error || "خطأ أثناء التحليل");
    }
    return data;
  };

  const buildLocalComparison = (a: any, b: any) => {
    if (!a || !b) return null;
    const scoreA = a.overall_score ?? 0;
    const scoreB = b.overall_score ?? 0;
    const winner = scoreA === scoreB ? "تعادل" : scoreA > scoreB ? "الكرياتيف A" : "الكرياتيف B";
    const metricsA = a.metrics || {};
    const metricsB = b.metrics || {};
    const keys = Array.from(
      new Set([...Object.keys(metricsA), ...Object.keys(metricsB)])
    );
    const metricsDiff = keys.map((k) => ({
      metric: k,
      a: metricsA[k] ?? null,
      b: metricsB[k] ?? null,
    }));
    return {
      winner,
      scoreA,
      scoreB,
      metricsDiff,
      note: "هذه مقارنة أولية مبنية على النتائج المتوفرة. سيتم تفعيل اقتراحات ذكاء اصطناعي أعمق لاحقًا.",
    };
  };

  const analyze = async () => {
    if (!mediaType) return alert("ارفع الكرياتيف");
    if (compareMode && !mediaTypeB) return alert("ارفع الكرياتيف الثاني للمقارنة");
    if (profile?.subscription_status !== "pro" && profile?.credits <= 0) {
      return alert("انتهت محاولاتك المجانية! جدد الاشتراك بـ 1900 دج");
    }
    if (mediaType === "image" && !imageBase64) {
      return alert("الصورة غير جاهزة للتحليل");
    }
    if (mediaType === "video" && videoFrames.length === 0) {
      return alert("تعذر تجهيز لقطات الفيديو للتحليل");
    }
    if (compareMode) {
      if (mediaTypeB === "image" && !imageBase64B) {
        return alert("الصورة الثانية غير جاهزة للتحليل");
      }
      if (mediaTypeB === "video" && videoFramesB.length === 0) {
        return alert("تعذر تجهيز لقطات الفيديو الثاني للتحليل");
      }
    }

    setLoading(true);
    setResult(null);
    setResultB(null);
    setComparison(null);

    try {
      const dataA = await runAnalysis(mediaType, imageBase64, videoFrames);
      setResult(dataA.analysis);
      setProfile((p: any) => ({
        ...p,
        credits: dataA.remainingCredits,
        subscription_status: dataA.subscription_status,
      }));

      let analysisB: any = null;
      if (compareMode) {
        const dataB = await runAnalysis(mediaTypeB, imageBase64B, videoFramesB);
        analysisB = dataB.analysis;
        setResultB(analysisB);
        setProfile((p: any) => ({
          ...p,
          credits: dataB.remainingCredits,
          subscription_status: dataB.subscription_status,
        }));
      }

      if (compareMode && analysisB) {
        setComparison(buildLocalComparison(dataA.analysis, analysisB));
      }

      const { data: hist } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (hist) setHistory(hist);
    } catch (e: any) {
      alert(e.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!coupon) return;
    const res = await fetch("/api/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, userId: user.id }),
    });
    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : {};
    if (!res.ok) return alert(data.error || "فشل تفعيل الكوبون");
    alert(data.message);
    setProfile((p: any) => ({
      ...p,
      credits: data.credits,
      subscription_status: data.subscription_status,
      subscription_expires_at: data.expires_at,
    }));
    setCoupon("");
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        جاري التحميل...
      </div>
    );
  }

  const isPro =
    profile.subscription_status === "pro" &&
    new Date(profile.subscription_expires_at) > new Date();

  const renderSmartSuggestions = (smart: any) => {
    const data = smart || {
      repeated_patterns: [],
      priority_actions: [],
      next_creative_ideas: [],
    };
    return (
      <div className="mt-4 space-y-3">
        <p className="text-xs text-zinc-500 font-bold">🧠 اقتراحات ذكية من تحليلاتك السابقة</p>

        <div>
          <p className="text-xs text-zinc-500 mb-2">الأنماط المتكررة</p>
          <div className="space-y-2">
            {(data.repeated_patterns || []).length > 0 ? (
              data.repeated_patterns.map((item: string, i: number) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-300 text-sm">
                  • {item}
                </div>
              ))
            ) : (
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 text-zinc-500">
                لا توجد بيانات كافية بعد لاستخراج نمط متكرر.
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-2">أولويات التحسين</p>
          <div className="space-y-2">
            {(data.priority_actions || []).length > 0 ? (
              data.priority_actions.map((item: string, i: number) => (
                <div
                  key={i}
                  className="bg-lime-950/20 border border-lime-900/30 rounded-xl p-3"
                >
                  • {item}
                </div>
              ))
            ) : (
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 text-zinc-500">
                ستظهر هنا الإجراءات التنفيذية بعد تراكم بعض التحليلات.
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 mb-2">أفكار للكرياتيف القادم</p>
          <div className="space-y-2">
            {(data.next_creative_ideas || []).length > 0 ? (
              data.next_creative_ideas.map((item: string, i: number) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-300 text-sm">
                  • {item}
                </div>
              ))
            ) : (
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 text-zinc-500">
                لا توجد أفكار كافية بعد. حلل المزيد من الإعلانات أولًا.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUploadBox = (
    preview: string | null,
    type: MediaType,
    frames: string[],
    ref: React.RefObject<HTMLInputElement>,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    label: string
  ) => (
    <div>
      <p className="text-xs text-zinc-500 mb-2">{label}</p>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-zinc-700 rounded-xl h-[180px] flex flex-col items-center justify-center cursor-pointer bg-[#0a0a0b] overflow-hidden"
      >
        {preview ? (
          type === "image" ? (
            <img src={preview} alt="preview" className="w-full h-full object-contain" />
          ) : (
            <video src={preview} className="w-full h-full object-contain" controls />
          )
        ) : (
          <p className="text-zinc-500 text-sm">اضغط للرفع</p>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onChange}
      />
      {type === "video" && frames.length > 0 && (
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {frames.map((frame, i) => (
            <img key={i} src={frame} alt={`frame-${i}`} className="w-12 h-12 object-cover rounded" />
          ))}
        </div>
      )}
    </div>
  );

  const renderResultBlock = (label: string, res: any) => (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">
          {label}: {res.verdict}
        </h3>
        <span className="text-2xl font-bold">{res.overall_score}</span>
      </div>
      <p className="text-xs text-zinc-500 mb-3">
        {res.overall_score >= 80 ? "جاهز للإطلاق" : "يحتاج تعديلات"}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {Object.entries(res.metrics || {}).map(([k, v]: any) => (
          <div key={k} className="bg-zinc-900 rounded-lg p-2 text-sm flex justify-between">
            <span className="text-zinc-400">{k}</span>
            <span>{String(v ?? "—")}/10</span>
          </div>
        ))}
      </div>

      <p className="font-bold text-sm mb-1">🚨 مشاكل:</p>
      <ul className="text-sm text-zinc-400 mb-3 space-y-1">
        {(res.critical_issues || []).map((x: string, i: number) => (
          <li key={i}>• {x}</li>
        ))}
      </ul>

      <p className="font-bold text-sm mb-1">💡 توصيات:</p>
      <ul className="text-sm text-zinc-400 space-y-1">
        {(res.recommendations || []).map((x: string, i: number) => (
          <li key={i}>• {x}</li>
        ))}
      </ul>

      {renderSmartSuggestions(res.smartSuggestions)}
    </div>
  );

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4FF32] rounded-lg flex items-center justify-center font-bold text-black">
            C
          </div>
          <div>
            <p className="font-bold">DASHBOARD</p>
            <p className="text-xs text-zinc-500">
              {isPro ? "PRO" : `${profile.credits} محاولات`}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
          }}
          className="text-xs bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full"
        >
          خروج
        </button>
      </header>

      {!isPro && (
        <div className="bg-lime-950/20 border border-lime-900/30 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="font-bold">انتهت محاولاتك المجانية؟</p>
            <p className="text-sm text-zinc-400">اشترك بـ 1900 دج / شهر تحليلات غير محدودة</p>
          </div>
          <a
            href="#pay"
            className="bg-[#D4FF32] text-black font-bold text-sm px-5 py-2 rounded-full text-center"
          >
            ادفع عبر BaridiMob
          </a>
        </div>
      )}

      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">ارفع الكرياتيف</h2>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => {
                  setCompareMode(e.target.checked);
                  setComparison(null);
                  setResultB(null);
                }}
              />
              وضع المقارنة
            </label>
          </div>

          <div className="space-y-4">
            {renderUploadBox(
              mediaPreview,
              mediaType,
              videoFrames,
              fileRef,
              handleFile,
              compareMode ? "الكرياتيف A" : "الكرياتيف"
            )}

            {compareMode && (
              <div>
                {renderUploadBox(
                  mediaPreviewB,
                  mediaTypeB,
                  videoFramesB,
                  fileRefB,
                  handleFileB,
                  "الكرياتيف B (للمقارنة)"
                )}
              </div>
            )}

            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full mt-3 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm"
            >
              <option>فيسبوك</option>
              <option>تيك توك</option>
              <option>انستغرام</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm"
              >
                <option>مبيعات</option>
                <option>رسائل</option>
              </select>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-sm"
              >
                <option>متجر الكتروني</option>
                <option>تجميلي</option>
                <option>عقارات</option>
              </select>
            </div>

            <button
              onClick={analyze}
              disabled={loading}
              className="w-full bg-[#D4FF32] text-black font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? "جاري التحليل..." : compareMode ? "قارن الآن ⚡" : "حلل الآن ⚡"}
            </button>

            <div className="flex gap-2">
              <p className="text-xs text-zinc-500 self-center">عندك كوبون؟</p>
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="HATEM50"
                className="flex-1 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-2.5 text-sm"
              />
              <button
                onClick={applyCoupon}
                className="bg-zinc-800 text-sm px-4 rounded-xl"
              >
                تفعيل
              </button>
            </div>
          </div>

          <div id="pay" className="mt-6 border-t border-zinc-800 pt-4 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm space-y-1">
              <p className="font-bold mb-2">💳 الدفع المحلي:</p>
              <p>BaridiMob: 00799999 0000000000</p>
              <p>CCP: 123456 clé 12</p>
              <p>RIP: 007999992809491134</p>
              <p>WhatsApp: 0779613978</p>
              <p className="text-zinc-400">بعد الدفع ابعث وصل في واتساب: 0779613978</p>
              <p className="text-zinc-400">وسنفعل اشتراكك في أقل من ساعة</p>
            </div>

            <a
              href="https://app.lemonsqueezy.com/checkout"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-zinc-800 text-sm py-3 rounded-xl"
            >
              دفع دولي عبر LemonSqueezy
            </a>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
          {!result && !loading && (
            <p className="text-zinc-500 text-center py-10">النتائج ستظهر هنا</p>
          )}

          {loading && (
            <p className="text-zinc-500 text-center py-10">نحلل بالذكاء الاصطناعي...</p>
          )}

          {result && !compareMode && (
            <div>{renderResultBlock("النتيجة", result)}</div>
          )}

          {result && compareMode && (
            <div className="space-y-4">
              <div>{renderResultBlock("الكرياتيف A", result)}</div>

              {resultB && (
                <div>{renderResultBlock("الكرياتيف B", resultB)}</div>
              )}

              {comparison && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="font-bold mb-3">🤖 اقتراح المقارنة (قريبًا: ذكاء اصطناعي)</h3>
                  <p className="text-sm mb-3">
                    الأفضل حاليًا:{" "}
                    <strong>{comparison.winner}</strong> ({comparison.scoreA} مقابل {comparison.scoreB})
                  </p>
                  <div className="space-y-1 mb-3">
                    {comparison.metricsDiff.map((m: any) => (
                      <div key={m.metric} className="flex justify-between text-sm text-zinc-400">
                        <span>{m.metric}</span>
                        <span>
                          A: {String(m.a ?? "—")} | B: {String(m.b ?? "—")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">{comparison.note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-bold mb-4">📜 آخر تحليلاتك</h2>
        {history.length === 0 && (
          <p className="text-zinc-500 text-sm">لا يوجد بعد</p>
        )}
        <div className="space-y-2">
          {history.map((h: any) => (
            <div
              key={h.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center text-sm"
            >
              <div className="flex gap-3">
                <span>{h.platform}</span>
                <span className="text-zinc-500">{h.overall_score}/100</span>
              </div>
              <span className="text-zinc-500 text-xs">
                {new Date(h.created_at).toLocaleDateString("ar-DZ")}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
