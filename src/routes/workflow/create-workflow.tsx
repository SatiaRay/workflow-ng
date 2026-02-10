// pages/workflow-create.tsx
import { useCallback, useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  AlertCircle,
  FileText,
  Workflow,
  CirclePlay,
  Cpu,
  GitBranch,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseService } from "@/services/supabase.service";
import WorkflowEditor from "@/components/workflow/workflow-editor";

interface FormData {
  name: string;
  description: string;
  trigger_form_id: string;
  status: string;
  schema: any;
}

interface FormErrors {
  name?: string;
  trigger_form_id?: string;
  general?: string;
}

export default function CreateWorkflow() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    trigger_form_id: "",
    status: "draft",
    schema: { nodes: [], edges: [] },
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Load available forms
  useEffect(() => {
    const loadForms = async () => {
      try {
        // You'll need to implement getForms in your supabaseService
        // const formsData = await supabaseService.getForms();
        // setForms(formsData);

        // For now, mock data
        setForms([
          { id: 1, title: "فرم ثبت نام" },
          { id: 2, title: "فرم درخواست" },
          { id: 3, title: "فرم بازخورد" },
        ]);
      } catch (error) {
        console.error("Error loading forms:", error);
        toast.error("بارگذاری لیست فرم‌ها ناموفق بود");
      } finally {
        setLoadingForms(false);
      }
    };

    loadForms();
  }, []);

  // Handle workflow editor changes
  const handleWorkflowChange = useCallback((schema: any) => {
    setFormData((prev) => {
      // Only update if schema actually changed
      if (JSON.stringify(prev.schema) === JSON.stringify(schema)) {
        return prev;
      }
      return {
        ...prev,
        schema,
      };
    });
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "نام گردش کار الزامی است";
    }

    if (!formData.trigger_form_id) {
      newErrors.trigger_form_id = "انتخاب فرم ماشه الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("لطفاً خطاهای فرم را برطرف کنید");
      return;
    }

    // Validate workflow schema has at least a start and end node
    const hasStartNode = formData.schema.nodes.some(
      (node: any) => node.type === "start",
    );
    const hasEndNode = formData.schema.nodes.some(
      (node: any) => node.type === "end",
    );

    if (!hasStartNode) {
      toast.error("گردش کار باید حداقل یک گره شروع داشته باشد");
      return;
    }

    if (!hasEndNode) {
      toast.warning(
        "گردش کار شما گره پایان ندارد. آیا مطمئن هستید که می‌خواهید ادامه دهید؟",
      );
      if (
        !confirm(
          "گردش کار شما گره پایان ندارد. آیا مطمئن هستید که می‌خواهید ادامه دهید؟",
        )
      ) {
        return;
      }
    }

    setLoading(true);

    try {
      // Create workflow
      const workflowData = {
        name: formData.name,
        description: formData.description || null,
        trigger_form_id: parseInt(formData.trigger_form_id),
        schema: formData.schema,
        status: formData.status,
      };

      const createdWorkflow =
        await supabaseService.createWorkflow(workflowData);

      toast.success("گردش کار با موفقیت ایجاد شد");

      // Navigate to workflows list or edit page
      navigate("/workflows", { state: { refresh: true } });
    } catch (error: any) {
      console.error("Error creating workflow:", error);

      let errorMessage = "ایجاد گردش کار ناموفق بود";
      if (error.message?.includes("unique constraint")) {
        errorMessage = "گردش کاری با این نام از قبل وجود دارد";
      } else if (error.message?.includes("foreign key")) {
        errorMessage = "فرم انتخاب شده وجود ندارد";
      } else {
        errorMessage = error.message || errorMessage;
      }

      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get node statistics
  const getNodeStats = () => {
    const stats = {
      total: formData.schema.nodes.length,
      start: formData.schema.nodes.filter((n: any) => n.type === "start")
        .length,
      process: formData.schema.nodes.filter((n: any) => n.type === "process")
        .length,
      decision: formData.schema.nodes.filter((n: any) => n.type === "decision")
        .length,
      end: formData.schema.nodes.filter((n: any) => n.type === "end").length,
      connections: formData.schema.edges.length,
    };

    return stats;
  };

  const nodeStats = getNodeStats();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/workflows")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت به لیست گردش‌کارها
          </Button>

          <h1 className="text-3xl font-bold mb-2">ایجاد گردش کار جدید</h1>
          <p className="text-muted-foreground">
            یک گردش کار جدید ایجاد کنید و فرآیندهای کسب‌وکار خود را اتوماتیک
            کنید
          </p>
        </div>

        {/* Error Alert */}
        {errors.general && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {/* Main Content - Stacked Layout */}
        <div className="space-y-6">
          {/* Workflow Editor Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>طراحی گردش کار</CardTitle>
                  <CardDescription>
                    گره‌ها را بکشید و ارتباط بین آن‌ها را ایجاد کنید
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {nodeStats.total} گره • {nodeStats.connections} ارتباط
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5">
              <div className="h-[600px] min-h-[600px]">
                <WorkflowEditor onChange={handleWorkflowChange} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Guide Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Workflow className="w-4 h-4" />
                راهنمای سریع گردش کار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center text-center p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <CirclePlay className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-700">گره شروع</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    نقطه آغاز فرآیند. هر گردش کار باید یک گره شروع داشته باشد.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <Cpu className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-blue-700">گره فرآیند</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    عملیات یا وظیفه‌ای که باید انجام شود.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                    <GitBranch className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold text-yellow-700">گره تصمیم</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    انشعاب شرطی با چندین خروجی بر اساس شرایط.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                    <Square className="w-6 h-6 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-red-700">گره پایان</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    پایان فرآیند. توصیه می‌شود هر گردش کار گره پایان داشته باشد.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">نکات مهم:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></span>
                        برای حذف یک گره، آن را انتخاب کرده و کلید Delete را
                        بفشارید
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></span>
                        برای ایجاد ارتباط بین گره‌ها، نقطه اتصال را بکشید و به
                        گره هدف متصل کنید
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></span>
                        برای ویرایش گره، روی آن کلیک کرده و اطلاعات را در پنل
                        سمت راست تغییر دهید
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">گره‌های فعلی:</div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-green-600">
                          شروع: {nodeStats.start}
                        </span>
                        <span className="text-blue-600">
                          فرآیند: {nodeStats.process}
                        </span>
                        <span className="text-yellow-600">
                          تصمیم: {nodeStats.decision}
                        </span>
                        <span className="text-red-600">
                          پایان: {nodeStats.end}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات گردش کار</CardTitle>
              <CardDescription>
                مشخصات اصلی گردش کار را تعیین کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Workflow Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      نام گردش کار <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="مثال: فرآیند تایید درخواست"
                      disabled={loading}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Trigger Form */}
                  <div className="space-y-2">
                    <Label htmlFor="trigger_form_id">
                      فرم ماشه <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.trigger_form_id}
                      onValueChange={(value) =>
                        handleInputChange("trigger_form_id", value)
                      }
                      disabled={loading || loadingForms}
                    >
                      <SelectTrigger id="trigger_form_id">
                        <FileText className="w-4 h-4 ml-2" />
                        <SelectValue placeholder="انتخاب فرم ماشه" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingForms ? (
                          <div className="p-4 text-center">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                          </div>
                        ) : forms.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            فرمی موجود نیست
                          </div>
                        ) : (
                          forms.map((form) => (
                            <SelectItem
                              key={form.id}
                              value={form.id.toString()}
                            >
                              {form.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.trigger_form_id && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.trigger_form_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      این فرم هنگام ارسال، گردش کار را فعال می‌کند
                    </p>
                  </div>

                  {/* Description - Full width */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">توضیحات</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="توضیحی کوتاه درباره هدف و عملکرد این گردش کار"
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">وضعیت</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                      disabled={loading}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="انتخاب وضعیت" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">پیش‌نویس</SelectItem>
                        <SelectItem value="active">فعال</SelectItem>
                        <SelectItem value="inactive">غیرفعال</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      وضعیت پیش‌فرض: پیش‌نویس (پس از تکمیل طراحی می‌توانید فعال
                      کنید)
                    </p>
                  </div>

                  {/* Stats Summary */}
                  <div className="space-y-2">
                    <Label>آمار فعلی</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Workflow className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-blue-600">
                            {nodeStats.total}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            کل گره‌ها
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <GitBranch className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-bold text-green-600">
                            {nodeStats.connections}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ارتباطات
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={loading || loadingForms || forms.length === 0}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                        در حال ایجاد...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        ایجاد گردش کار
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
