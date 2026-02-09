import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { RoleService } from "@/services/supabase/role-service";

// Import the Role interface
import type { Role } from "@/services/supabase/role-service";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone: string;
  role_id: number | null;
  sendInvitation: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_name?: string;
  phone?: string;
  role_id?: string;
  general?: string;
}

export default function CreateUser() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  // Initialize RoleService
  const roleService = new RoleService();
  
  // States
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    role_id: null,
    sendInvitation: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await roleService.getRoles();
        setRoles(rolesData);
        
        // Set default role to the first one if exists
        if (rolesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            role_id: rolesData[0].id
          }));
        }
      } catch (error: any) {
        console.error("Error fetching roles:", error);
        toast.error("بارگذاری لیست نقش‌ها ناموفق بود");
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

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
    if (!formData.role_id) {
      newErrors.role_id = "انتخاب نقش کاربر الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean | number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
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

    if (!formData.role_id) {
      toast.error("لطفاً یک نقش انتخاب کنید");
      return;
    }

    setLoading(true);

    try {
      // Create user in Auth with role_id
      const authData = await signUp(
        formData.email,
        formData.password,
        formData.full_name,
        formData.phone,
        formData.role_id
      );

      if (!authData.user) {
        throw new Error("ایجاد کاربر در احراز هویت ناموفق بود");
      }

      toast.success("کاربر جدید با موفقیت ایجاد شد");

      // Navigate to users list
      navigate("/users", { state: { refresh: true } });

    } catch (error: any) {
      console.error("Error creating user:", error);

      let errorMessage = "ایجاد کاربر ناموفق بود";
      if (error.message?.includes("already registered") || error.message?.includes("User already registered")) {
        errorMessage = "این ایمیل قبلاً ثبت‌نام کرده است";
        setErrors({ email: "این ایمیل قبلاً در سیستم موجود است" });
      } else if (error.message?.includes("password") || error.message?.includes("Password")) {
        errorMessage = "رمز عبور معتبر نیست";
        setErrors({ password: "رمز عبور قوی‌تری انتخاب کنید" });
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "ایمیل وارد شده معتبر نیست";
        setErrors({ email: "ایمیل معتبر نیست" });
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
                    <Label htmlFor="role_id">
                      نقش کاربر <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.role_id?.toString() || ""}
                      onValueChange={(value) => handleInputChange("role_id", value ? parseInt(value) : null)}
                      disabled={loading || loadingRoles}
                    >
                      <SelectTrigger id="role_id" className="w-full">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {loadingRoles ? (
                            <span className="text-muted-foreground">در حال بارگذاری نقش‌ها...</span>
                          ) : roles.length === 0 ? (
                            <span className="text-muted-foreground">هیچ نقشی موجود نیست</span>
                          ) : (
                            <SelectValue placeholder="انتخاب نقش کاربر" />
                          )}
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {loadingRoles ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="mr-2">در حال بارگذاری...</span>
                          </div>
                        ) : roles.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            هیچ نقشی ایجاد نشده است
                          </div>
                        ) : (
                          roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              <div className="flex flex-col">
                                <span>{role.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ID: {role.id}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.role_id && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.role_id}
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
              </div>

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
                <Button 
                  type="submit" 
                  disabled={loading || loadingRoles || roles.length === 0}
                >
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
          {roles.length === 0 && !loadingRoles && (
            <p className="text-sm text-amber-600 mt-2">
              برای ایجاد کاربر، ابتدا باید از{' '}
              <button 
                type="button"
                onClick={() => navigate("/roles")}
                className="text-primary hover:underline font-medium"
              >
                صفحه مدیریت نقش‌ها
              </button>
              {' '}حداقل یک نقش ایجاد کنید.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}