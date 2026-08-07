import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// supabaseAdmin يجب أن يُستخدم فقط على السيرفر (API routes).
// الشرط التالي يمنع فشل التطبيق في المتصفح (Client) حيث
// لا يكون SUPABASE_SERVICE_ROLE_KEY متاحاً إطلاقاً لأسباب أمنية.
export const supabaseAdmin = typeof window === "undefined"
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : (null as any);
