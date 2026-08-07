# Creative Audit Pro V4 - مع لوحة تحكم Admin

## الجديد V4
- ✅ لوحة تحكم /admin
- ✅ تفعيل اشتراكات BaridiMob بضغطة زر
- ✅ إضافة كريديت يدوي
- ✅ إحصائيات: مستخدمين، برو، تحليلات
- ✅ بحث بالإيميل
- ✅ حماية بكلمة سر ADMIN_PASSWORD

## التركيب

### 1. Supabase SQL (نفس السابق)
شغل supabase-schema.sql

### 2. .env.local
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=sk-...
ADMIN_PASSWORD=HatemAdmin2026
```

### 3. تشغيل
npm install
npm run dev

### 4. لوحة التحكم
ادخل: http://localhost:3000/admin
كلمة السر: HatemAdmin2026 (تقدر تغيرها في .env)

### طريقة العمل مع BaridiMob:
1. العميل يدفع 1900 دج لـ BaridiMob تاعك
2. يبعثلك وصل في واتساب + إيميله
3. تدخل /admin > تبحث عن إيميله > تضغط "30 يوم"
4. يتفعل تلقائيا ويستلم إشعار أنه أصبح PRO

### إنشاء دفعة يدوية (اختياري):
في Supabase > payments > Insert:
- user_id: انسخه من profiles
- amount: 1900
- method: baridimob
- status: pending

ستظهر في لوحة التحكم في قسم المدفوعات المعلقة.

مبروك! عندك SaaS جزائري كامل مع إدارة!
