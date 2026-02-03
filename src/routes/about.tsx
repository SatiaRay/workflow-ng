import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">درباره گردش کار ساتیا</h1>
            <p className="text-lg text-muted-foreground">
              با پلتفرم پیشرفته ساخت فرم‌های پویا و هوشمند بیشتر آشنا شوید.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">ماموریت ما</h2>
              <p className="text-foreground/80">
                ما متعهد به ایجاد یک پلتفرم قدرتمند و انعطاف‌پذیر برای ساخت فرم‌های پویا هستیم که امکان ایجاد ارتباط هوشمند بین داده‌های مختلف را فراهم می‌کند.
              </p>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">چشم‌انداز ما</h2>
              <p className="text-foreground/80">
                تبدیل شدن به برترین پلتفرم فرم‌سازی پویا در منطقه، با ارائه راهکارهای هوشمند برای مدیریت و ارتباط داده‌های فرم‌محور.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">قابلیت‌های کلیدی</h2>
            <ul className="grid gap-3">
              {[
                "ساخت فرم‌های پویا با انواع فیلدهای سفارشی",
                "ایجاد ارتباط هوشمند بین فرم‌های مختلف",
                "مدیریت پیشرفته پاسخ‌ها و داده‌ها",
                "پشتیبانی از فرم‌های چندمرحله‌ای و شرطی",
                "خروجی‌گیری داده‌ها در قالب‌های مختلف",
                "امنیت بالا و دسترسی‌های سطح‌بندی شده"
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">کاربردهای گردش کار ساتیا</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold mb-2">📋 سیستم‌های نظرسنجی</h3>
                <p className="text-sm text-muted-foreground">
                  ایجاد نظرسنجی‌های پیشرفته با گزارش‌گیری لحظه‌ای
                </p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🏢 مدیریت فرآیندها</h3>
                <p className="text-sm text-muted-foreground">
                  خودکارسازی فرآیندهای اداری و کاری با فرم‌های هوشمند
                </p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold mb-2">📊 جمع‌آوری داده</h3>
                <p className="text-sm text-muted-foreground">
                  جمع‌آوری و تحلیل داده‌های سازمانی با فرم‌های مرتبط
                </p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🔗 سیستم‌های یکپارچه</h3>
                <p className="text-sm text-muted-foreground">
                  ایجاد ارتباط بین سیستم‌های مختلف با فرم‌های رابط
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800">
            <Link 
              to="/" 
              className="inline-flex items-center text-primary hover:underline"
            >
              ← بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}