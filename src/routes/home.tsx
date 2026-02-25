import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LogIn,
  FileText,
  LayoutDashboard,
  ArrowRight,
  Link as LinkIcon,
  GitMerge,
  CheckSquare,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const navigate = useNavigate();

  const { logout, user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Show ONLY when NOT logged in */}
        {!isAuthenticated() && (
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
                اتوماسیون فرآیندهاست. با استفاده از فرم‌های پویا به عنوان
                گره‌های یک گردش‌کار، می‌توانید سناریوهای دلخواه خود را
                پیاده‌سازی کرده و پس از فعال‌سازی، فرآیندهای سازمانی را در قالب
                وظایف مشخص مدیریت و پیگیری کنید.
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
        )}

        {/* Show Welcome Back card when user IS logged in */}
        {isAuthenticated() && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center text-3xl">
                <LayoutDashboard className="h-7 w-7" />
                خوش برگشتی!
              </CardTitle>
              <CardDescription className="text-lg">
                شما با این حساب وارد شده‌اید:{" "}
                <span className="font-semibold">{user?.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-muted-foreground text-center">
                  دسترسی سریع به بخش‌های اصلی
                </h3>

                <div className="space-y-3 flex flex-col">
                  {/* فرم‌ها */}
                  <Link to="/form">
                    <Button
                      className="w-full justify-between group p-6"
                      variant="outline"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5" />
                        <div className="text-right">
                          <div className="font-semibold text-right">
                            مدیریت فرم‌ها
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ساخت و ویرایش فرم‌های پویا
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>

                  {/* گردش‌کارها */}
                  <Link to="/workflows">
                    <Button
                      className="w-full justify-between group p-6"
                      variant="outline"
                    >
                      <div className="flex items-center gap-3">
                        <GitMerge className="h-5 w-5" />
                        <div className="text-right">
                          <div className="font-semibold">گردش‌کارها</div>
                          <div className="text-sm text-muted-foreground">
                            طراحی و مدیریت فرآیندهای سازمانی
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>

                  {/* وظایف */}
                  <Link to="/tasks">
                    <Button
                      className="w-full justify-between group p-6"
                      variant="outline"
                    >
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-5 w-5" />
                        <div className="text-right">
                          <div className="font-semibold">وظایف من</div>
                          <div className="text-sm text-muted-foreground">
                            مشاهده و پیگیری وظایف محول شده
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4">
                <Button
                  onClick={() => navigate("/form/generator")}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 ml-2" />
                  فرم جدید
                </Button>

                <Button
                  onClick={() => navigate("/workflows/create")}
                  variant="outline"
                  className="flex-1"
                >
                  <GitMerge className="h-4 w-4 ml-2" />
                  گردش‌کار جدید
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1"
                >
                  خروج
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-12 border-t border-gray-800">
          <p className="text-sm text-muted-foreground">
            {isAuthenticated()
              ? "فرآیندهای سازمانی خود را با گردش‌کارهای هوشمند طراحی و مدیریت کنید. وظایف را بین کاربران توزیع و پیگیری نمایید."
              : "گردش کار ساتیا - پلتفرم اتوماسیون فرآیندها با قابلیت طراحی گردش‌کار و مدیریت وظایف با استفاده از فرم‌های پویا"}
          </p>
        </div>
      </div>
    </div>
  );
}
