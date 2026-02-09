import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle,
  Mail,
  Phone,
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone: string;
  role: string;
  sendInvitation: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_name?: string;
  phone?: string;
  role?: string;
  general?: string;
}

const roleOptions = [
  { value: "user", label: "کاربر عادی", description: "دسترسی پایه به سیستم" },
  { value: "viewer", label: "بیننده", description: "فقط مشاهده اطلاعات" },
  { value: "editor", label: "ویرایشگر", description: "ویرایش و مدیریت محتوا" },
  { value: "admin", label: "مدیر سیستم", description: "دسترسی کامل به تمام بخش‌ها" },
];

export default function CreateUser() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    role: "user",
    sendInvitation: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "ایمیل الزامی است";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "فرمت ایمیل معتبر نیست";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "رمز عبور الزامی است";
    } else if (formData.password.length < 6) {
      newErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "رمز عبور و تکرار آن مطابقت ندارند";
    }

    // Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "نام و نام خانوادگی الزامی است";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "نام باید حداقل ۲ کاراکتر باشد";
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone.trim() && !/^[\d\s+()-]{10,20}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "شماره تلفن معتبر نیست";
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = "انتخاب نقش کاربر الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    // Fill the rest
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData((prev) => ({
      ...prev,
      password: password,
      confirmPassword: password,
    }));
    
    toast.success("رمز عبور تصادفی ایجاد شد");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("لطفاً خطاهای فرم را برطرف کنید");
      return;
    }

    setLoading(true);

    try {
      // Create user in Auth
      const authData = await signUp(
        formData.email,
        formData.password,
        formData.full_name,
        formData.phone
      );

      if (!authData.user) {
        throw new Error("ایجاد کاربر در احراز هویت ناموفق بود");
      }

      // Create user profile in database
      const profileData = {
        id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone.trim() || null,
        role: formData.role,
        is_active: true,
        email_confirmed_at: formData.sendInvitation ? null : new Date().toISOString(),
      };

      // TODO: You'll need to implement this function in your supabaseService
      // to insert the user profile data into your profiles table
      // Example:
      // await supabaseService.createUserProfile(profileData);

      // Prepare success message
      let successMessage = "کاربر جدید با موفقیت ایجاد شد";
      if (formData.sendInvitation) {
        successMessage += " و لینک فعال‌سازی به ایمیل کاربر ارسال شد";
      }

      toast.success(successMessage);

      // Navigate to users list
      navigate("/users", { state: { refresh: true } });

    } catch (error: any) {
      console.error("Error creating user:", error);

      // Handle specific Supabase errors
      let errorMessage = "ایجاد کاربر ناموفق بود";
      if (error.message?.includes("already registered")) {
        errorMessage = "این ایمیل قبلاً ثبت‌نام کرده است";
        setErrors({ email: "این ایمیل قبلاً در سیستم موجود است" });
      } else if (error.message?.includes("password")) {
        errorMessage = "رمز عبور معتبر نیست";
        setErrors({ password: "رمز عبور قوی‌تری انتخاب کنید" });
      } else {
        errorMessage = error.message || errorMessage;
      }

      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/users")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت به لیست کاربران
          </Button>

          <h1 className="text-3xl font-bold mb-2">ایجاد کاربر جدید</h1>
          <p className="text-muted-foreground">
            اطلاعات کاربر جدید را وارد کرده و دسترسی‌های مناسب را تعیین کنید
          </p>
        </div>

        {/* Error Alert */}
        {errors.general && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات کاربر</CardTitle>
            <CardDescription>
              تمام فیلدهای ضروری را پر کنید و پس از تأیید، کاربر ایجاد خواهد شد
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  اطلاعات شخصی
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      نام و نام خانوادگی <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        placeholder="مثال: علی محمدی"
                        className="pr-9"
                        dir="rtl"
                        disabled={loading}
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      آدرس ایمیل <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="example@domain.com"
                        className="pr-9"
                        dir="ltr"
                        disabled={loading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">شماره تلفن</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="0912 345 6789"
                        className="pr-9"
                        dir="ltr"
                        disabled={loading}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      شماره تلفن اختیاری است
                    </p>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      نقش کاربر <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange("role", value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="role" className="w-full">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <SelectValue placeholder="انتخاب نقش کاربر" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.role}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    تنظیمات رمز عبور
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomPassword}
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    ایجاد رمز تصادفی
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      رمز عبور <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="حداقل ۶ کاراکتر"
                        className="pr-9"
                        dir="ltr"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-3 top-2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      تکرار رمز عبور <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="تکرار رمز عبور"
                        className="pr-9"
                        dir="ltr"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-3 top-2 h-8 w-8"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-sm font-medium">راهنمای رمز عبور قوی:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>حداقل ۶ کاراکتر (ترجیحاً ۸ کاراکتر یا بیشتر)</li>
                    <li>ترکیبی از حروف بزرگ و کوچک انگلیسی</li>
                    <li>استفاده از اعداد</li>
                    <li>استفاده از کاراکترهای خاص مانند !@#$%^&*</li>
                  </ul>
                </div>
              </div>

              {/* Invitation Settings */}
              {/* <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start space-x-2 space-x-reverse">
                  <Checkbox
                    id="sendInvitation"
                    checked={formData.sendInvitation}
                    onCheckedChange={(checked) => handleInputChange("sendInvitation", checked as boolean)}
                    disabled={loading}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="sendInvitation" className="font-medium cursor-pointer">
                      ارسال ایمیل دعوت‌نامه به کاربر
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      در صورت فعال بودن، لینک فعال‌سازی حساب به ایمیل کاربر ارسال می‌شود.
                      در غیر این صورت، حساب کاربری بلافاصله فعال خواهد شد.
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Form Actions */}
              <div className="pt-6 border-t flex flex-col sm:flex-row gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/users")}
                  disabled={loading}
                >
                  لغو
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      در حال ایجاد کاربر...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      ایجاد کاربر
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            پس از ایجاد کاربر، می‌توانید جزئیات بیشتری را در صفحه ویرایش کاربر تنظیم کنید.
          </p>
        </div>
      </div>
    </div>
  );
}