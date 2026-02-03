// LoginPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { GalleryVerticalEnd, Mail, Lock, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If user is already logged in, redirect to intended page or home
      if (session) {
        const redirectUrl = searchParams.get("redirect") || "/";
        navigate(redirectUrl, { replace: true });
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const redirectUrl = searchParams.get("redirect") || "/";
        navigate(redirectUrl, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("با موفقیت وارد شدید!");
        // Navigation will be handled by the auth state change listener
      }
    } catch (error: any) {
      toast.error(error.message || "خطایی رخ داده است");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className={cn("flex flex-col gap-6 w-full max-w-md")}>
        <form onSubmit={handleLogin}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <h1 className="text-xl font-bold">به گردش کار ساتیا خوش آمدید</h1>
              <FieldDescription>
                برای ورود اطلاعات حساب کاربری خود را وارد کنید
              </FieldDescription>
            </div>
            
            <Field>
              <FieldLabel htmlFor="email">ایمیل</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </Field>
            
            <Field>
              <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </Field>
            
            <Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال ورود...
                  </>
                ) : (
                  "ورود"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
        
        <FieldDescription className="px-6 text-center">
          با ادامه دادن، شما با{" "}
          <a href="#" className="text-primary hover:underline">
            شرایط استفاده
          </a>{" "}
          و{" "}
          <a href="#" className="text-primary hover:underline">
            سیاست حفظ حریم خصوصی
          </a>{" "}
          ما موافقت می‌کنید.
        </FieldDescription>
      </div>
    </div>
  );
}