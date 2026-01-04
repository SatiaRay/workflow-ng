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
import { createClient, type Session } from "@supabase/supabase-js";
import {
  LogIn,
  FileText,
  LayoutDashboard,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Simple reload to update state
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              به <span className="text-primary">ساتیا فرم</span> خوش آمدید
            </h1>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Show ONLY when NOT logged in */}
        {!session && (
          <>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
                پلتفرم  <span className="text-primary">ساتیا فرم</span>
              </h1>

              <p className="text-xl text-muted-foreground">
                ساخت و مدیریت فرم‌های پیشرفته با قابلیت ارتباط بین فرم‌های مختلف
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="bg-card border rounded-lg p-4 space-y-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">فرم‌ساز پویا</h3>
                  <p className="text-sm text-muted-foreground">
                    ایجاد فرم‌های سفارشی با انواع فیلدهای مختلف
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-4 space-y-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <LinkIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">ارتباط فرم‌ها</h3>
                  <p className="text-sm text-muted-foreground">
                    ایجاد رابطه هوشمند بین فرم‌های مختلف و داده‌های مرتبط
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-4 space-y-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">مدیریت پیشرفته</h3>
                  <p className="text-sm text-muted-foreground">
                    مشاهده، ویرایش و تحلیل داده‌های جمع‌آوری شده
                  </p>
                </div>
              </div>
              
              <p className="text-lg leading-relaxed pt-4">
                ساتیا فرم یک پلتفرم کامل برای طراحی، ساخت و مدیریت فرم‌های پویا است. 
                امکان ایجاد ارتباط بین فرم‌های مختلف را فراهم کرده و به شما اجازه می‌دهد 
                سیستم‌های فرم‌بندی پیچیده و هوشمندی ایجاد کنید.
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
                درباره ساتیا فرم
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
        {session && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center text-3xl">
                <LayoutDashboard className="h-7 w-7" />
                خوش برگشتی!
              </CardTitle>
              <CardDescription className="text-lg">
                شما با این حساب وارد شده‌اید:{" "}
                <span className="font-semibold">{session.user.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-muted-foreground text-center">
                  دسترسی سریع به پلتفرم فرم‌سازی
                </h3>
                <div className="space-y-3">
                  <Link to="/form">
                    <Button
                      className="w-full justify-between group p-6"
                      variant="outline"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">
                            ساخت و مدیریت فرم‌ها
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ایجاد فرم‌های پویا با قابلیت ارتباط بین فرم‌های مختلف
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  onClick={() => navigate('/form/generator')}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  ساخت فرم جدید
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1"
                >
                  خروج از حساب
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-12 border-t border-gray-800">
          <p className="text-sm text-muted-foreground">
            {session
              ? "از پنل مدیریت فرم‌های پویا استفاده کنید. قابلیت ارتباط بین فرم‌ها را امتحان کنید."
              : "ساتیا فرم - پلتفرم پیشرفته ساخت فرم‌های پویا با قابلیت ارتباط بین فرم‌های مختلف"}
          </p>
        </div>
      </div>
    </div>
  );
}