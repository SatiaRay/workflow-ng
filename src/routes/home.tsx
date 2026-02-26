import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogIn,
  GitMerge,
  CheckSquare,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const navigate = useNavigate();

  const { user, session, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) navigate("/tasks");
  }, [user, session]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Show ONLY when NOT logged in */}
        <>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              پلتفرم <span className="text-primary">گردش کار ساتیا</span>
            </h1>

            <p className="text-xl text-muted-foreground">
              از فرم‌های پویا تا گردش‌کارهای هوشمند: فرآیندهای سازمانی خود را
              خودکار کنید
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <GitMerge className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">طراح گردش‌کار</h3>
                <p className="text-sm text-muted-foreground">
                  ایجاد فرآیندهای دلخواه با استفاده از فرم‌های پویا به عنوان
                  گره‌های گردش‌کار
                </p>
              </div>

              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <CheckSquare className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">مدیریت وظایف</h3>
                <p className="text-sm text-muted-foreground">
                  توزیع و پیگیری وظایف بین کاربران با امکان تعیین وضعیت و
                  اولویت‌بندی
                </p>
              </div>

              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">تحلیل فرآیندها</h3>
                <p className="text-sm text-muted-foreground">
                  گزارش‌گیری و مانیتورینگ پیشرفت گردش‌کارها و عملکرد تیم
                </p>
              </div>
            </div>

            <p className="text-lg leading-relaxed pt-4">
              گردش‌کار ساتیا فراتر از یک ابزار ساده فرم‌ساز، یک پلتفرم قدرتمند
              اتوماسیون فرآیندهاست. با استفاده از فرم‌های پویا به عنوان گره‌های
              یک گردش‌کار، می‌توانید سناریوهای دلخواه خود را پیاده‌سازی کرده و
              پس از فعال‌سازی، فرآیندهای سازمانی را در قالب وظایف مشخص مدیریت و
              پیگیری کنید.
            </p>
          </div>

          {/* Action Buttons - Only show when NOT logged in */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <a
              href="/auth/login"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex flex-row align-middle justify-center"
            >
              <LogIn className="mr-2 h-4 w-4 mt-1" />
              <span>ورود و شروع استفاده</span>
            </a>
            <a
              href="/about"
              className="px-6 py-3 border border-gray-700 rounded-lg font-medium hover:bg-accent transition-colors"
            >
              درباره گردش کار ساتیا
            </a>

            <a
              href="/services"
              className="px-6 py-3 border border-gray-700 rounded-lg font-medium hover:bg-accent transition-colors"
            >
              قابلیت‌های پلتفرم
            </a>
          </div>
        </>

        <div className="pt-12 border-t border-gray-800">
          <p className="text-sm text-muted-foreground">
            گردش کار ساتیا - پلتفرم اتوماسیون فرآیندها با قابلیت طراحی گردش‌کار
            و مدیریت وظایف با استفاده از فرم‌های پویا
          </p>
        </div>
      </div>
    </div>
  );
}
