import { Link } from "react-router-dom";

const services = [
  {
    title: "ساخت فرم‌های پویا",
    description: "طراحی و پیاده‌سازی فرم‌های کاملاً پویا با قابلیت سفارشی‌سازی انواع فیلدها و اعتبارسنجی پیشرفته.",
    icon: "📋"
  },
  {
    title: "ارتباط بین فرم‌ها",
    description: "ایجاد ارتباط هوشمند بین فرم‌های مختلف برای ایجاد سیستم‌های فرم‌بندی یکپارچه و پیچیده.",
    icon: "🔗"
  },
  {
    title: "مدیریت داده‌ها",
    description: "سیستم مدیریت و تحلیل پیشرفته داده‌های جمع‌آوری شده از طریق فرم‌ها با گزارش‌گیری لحظه‌ای.",
    icon: "📊"
  },
  {
    title: "امنیت و دسترسی",
    description: "پیاده‌سازی سطوح مختلف دسترسی و مکانیزم‌های امنیتی پیشرفته برای محافظت از داده‌های حساس.",
    icon: "🔒"
  },
  {
    title: "یکپارچه‌سازی",
    description: "امکان اتصال و یکپارچه‌سازی با سیستم‌های موجود و APIهای مختلف برای جریان داده‌های یکپارچه.",
    icon: "🔄"
  },
  {
    title: "پشتیبانی و آموزش",
    description: "پشتیبانی فنی تخصصی و ارائه آموزش‌های کاربردی برای استفاده بهینه از پلتفرم گردش کار ساتیا.",
    icon: "🎓"
  }
];

export default function ServicesPage() {
  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight">خدمات گردش کار ساتیا</h1>
            <p className="text-lg text-muted-foreground">
              طیف کامل خدمات ما برای ایجاد سیستم‌های فرم‌بندی هوشمند و پویا
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl border border-gray-800 bg-card hover:border-primary/50 transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="flex flex-col space-y-4 h-full">
                  <div className="text-3xl mb-2">{service.icon}</div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-semibold">{service.title}</h3>
                    <p className="text-foreground/80 text-sm leading-relaxed">{service.description}</p>
                  </div>
                  <div className="pt-2">
                    <div className="w-full h-1 bg-primary/20 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mt-8">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold">💡 راهکارهای سفارشی</h3>
              <p className="text-foreground/80 max-w-2xl mx-auto">
                علاوه بر خدمات استاندارد، ما راهکارهای سفارشی متناسب با نیازهای خاص کسب‌وکار شما ارائه می‌دهیم. 
                از فرم‌های پیچیده چندمرحله‌ای تا سیستم‌های یکپارچه مدیریت داده.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center text-primary hover:underline"
            >
              ← بازگشت به صفحه اصلی
            </Link>
            <div className="flex gap-3">
              <Link 
                to="/form/generator" 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                شروع ساخت فرم
              </Link>
              <Link 
                to="/about" 
                className="px-6 py-3 border border-gray-700 rounded-lg font-medium hover:bg-accent transition-colors"
              >
                درباره ما
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}