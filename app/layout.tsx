import "./globals.css";
export const metadata = { title: "Creative Audit Pro - حلل إعلانك قبل ما تخسر", description: "أداة ذكية تحلل كرياتيف إعلانك بالذكاء الاصطناعي" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet" /></head>
      <body>{children}</body>
    </html>
  );
}
