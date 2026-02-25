import { useCallback, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  ChevronRight,
  ChevronLeft,
  CirclePlay,
  Cpu,
  GitBranch,
  Square,
  CheckCircle,
  Trash2,
  Eye,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseService } from "@/services/supabase.service";
import WorkflowEditor from "@/components/workflow/diagram/workflow-editor";
import { Stepper } from "@/components/ui/stepper";

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

interface WorkflowData {
  id: number;
  name: string;
  description?: string;
  trigger_form_id: number;
  status: string;
  schema: any;
  form?: {
    id: number;
    title: string;
  };
}

// Stepper steps
const steps = [
  {
    title: "اطلاعات پایه",
    description: "تنظیمات اولیه",
  },
  {
    title: "طراحی گردش کار",
    description: "ویرایش فرآیند",
  },
  {
    title: "مرور و به‌روزرسانی",
    description: "تایید نهایی",
  },
];

export default function EditWorkflow() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const workflowId = parseInt(id || "0");

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    trigger_form_id: "",
    status: "draft",
    schema: { nodes: [], edges: [] },
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (workflowId) {
      loadWorkflowData();
    }
  }, [workflowId]);

  const loadWorkflowData = async () => {
    try {
      setLoadingData(true);
      
      // Load forms
      const formsData = await supabaseService.getForms();
      setForms(formsData);

      // Load workflow
      const workflowData = await supabaseService.getWorkflow(workflowId);
      
      if (!workflowData) {
        toast.error("گردش کار مورد نظر یافت نشد");
        navigate("/workflows");
        return;
      }

      setWorkflow(workflowData);
      
      // Set form data
      setFormData({
        name: workflowData.name,
        description: workflowData.description || "",
        trigger_form_id: workflowData.trigger_form_id.toString(),
        status: workflowData.status,
        schema: workflowData.schema || { nodes: [], edges: [] },
      });

    } catch (error) {
      console.error("Error loading workflow data:", error);
      toast.error("بارگذاری اطلاعات گردش کار ناموفق بود");
      navigate("/workflows");
    } finally {
      setLoadingData(false);
    }
  };

  const handleWorkflowChange = useCallback((schema: any) => {
    setFormData((prev) => {
      if (JSON.stringify(prev.schema) === JSON.stringify(schema)) {
        return prev;
      }
      return {
        ...prev,
        schema,
      };
    });
  }, []);

  const validateStep1 = (): boolean => {
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

  const validateStep2 = (): boolean => {
    const hasStartNode = formData.schema.nodes.some(
      (node: any) => node.type === "start",
    );

    if (!hasStartNode) {
      toast.error("گردش کار باید حداقل یک گره شروع داشته باشد");
      return false;
    }

    return true;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!validateStep1()) {
        return;
      }
    } else if (currentStep === 1) {
      if (!validateStep2()) {
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const toggleWorkflowStatus = async () => {
    if (!workflow) return;

    const newStatus = workflow.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'فعال' : 'غیرفعال';

    if (!confirm(`آیا مطمئن هستید که می‌خواهید این گردش کار را ${action} کنید؟`)) {
      return;
    }

    try {
      setLoading(true);
      const updatedWorkflow = await supabaseService.updateWorkflow(workflowId, {
        status: newStatus
      });

      setWorkflow(updatedWorkflow);
      setFormData(prev => ({ ...prev, status: newStatus }));
      
      toast.success(`گردش کار با موفقیت ${action} شد`);
    } catch (error) {
      console.error("Error toggling workflow status:", error);
      toast.error(`تغییر وضعیت گردش کار ناموفق بود`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Final validation
    if (!validateStep1()) {
      setCurrentStep(0);
      toast.error("لطفاً خطاهای فرم را برطرف کنید");
      return;
    }

    if (!validateStep2()) {
      setCurrentStep(1);
      return;
    }

    const hasEndNode = formData.schema.nodes.some(
      (node: any) => node.type === "end",
    );

    if (!hasEndNode) {
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
      // Update workflow
      const workflowData = {
        name: formData.name,
        description: formData.description || null,
        trigger_form_id: parseInt(formData.trigger_form_id),
        schema: formData.schema,
        status: formData.status,
      };

      const updatedWorkflow = await supabaseService.updateWorkflow(
        workflowId,
        workflowData
      );

      toast.success("گردش کار با موفقیت به‌روزرسانی شد");

      // Navigate to workflows list
      navigate("/workflows", { state: { refresh: true } });
    } catch (error: any) {
      console.error("Error updating workflow:", error);

      let errorMessage = "به‌روزرسانی گردش کار ناموفق بود";
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

  const handleDelete = async () => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این گردش کار را حذف کنید؟ این عمل غیرقابل برگشت است.")) {
      return;
    }

    try {
      setLoading(true);
      await supabaseService.deleteWorkflow(workflowId);
      
      toast.success("گردش کار با موفقیت حذف شد");
      navigate("/workflows", { state: { refresh: true } });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("حذف گردش کار ناموفق بود");
      setLoading(false);
    }
  };

  const getNodeStats = () => {
    const stats = {
      total: formData.schema.nodes.length,
      start: formData.schema.nodes.filter((n: any) => n.type === "start").length,
      assign: formData.schema.nodes.filter((n: any) => n.type === "assign-task").length,
      fillform: formData.schema.nodes.filter((n: any) => n.type === "fill-form").length,
      condition: formData.schema.nodes.filter((n: any) => n.type === "condition").length,
      changeStatus: formData.schema.nodes.filter((n: any) => n.type === "change-status").length,
      end: formData.schema.nodes.filter((n: any) => n.type === "end").length,
      connections: formData.schema.edges.length,
    };

    return stats;
  };

  const nodeStats = getNodeStats();

  // Render step content
  const renderStepContent = () => {
    if (loadingData) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>در حال بارگذاری اطلاعات گردش کار...</p>
          </CardContent>
        </Card>
      );
    }

    switch (currentStep) {
      case 0: // Step 1: Basic Information
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>اطلاعات گردش کار</CardTitle>
                  <CardDescription>
                    مشخصات اصلی گردش کار را ویرایش کنید
                  </CardDescription>
                </div>
                {workflow && (
                  <div className="flex gap-2">
                    <Button
                      variant={workflow.status === 'active' ? "default" : "outline"}
                      size="sm"
                      onClick={toggleWorkflowStatus}
                      disabled={loading}
                    >
                      {workflow.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 ml-2" />
                          غیرفعال کردن
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 ml-2" />
                          فعال کردن
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Workflow Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    نام گردش کار <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
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

                {/* Description */}
                <div className="space-y-2">
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
                    disabled={loading}
                  >
                    <SelectTrigger id="trigger_form_id">
                      <FileText className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="انتخاب فرم ماشه" />
                    </SelectTrigger>
                    <SelectContent>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id.toString()}>
                          {form.title}
                          {form.id === workflow?.trigger_form_id && " (فعلی)"}
                        </SelectItem>
                      ))}
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
                    در صورت فعال بودن، گردش کار قابل اجرا خواهد بود
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 1: // Step 2: Workflow Design
        return (
          <div className="space-y-6">
            {/* Quick Guide Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Workflow className="w-4 h-4" />
                  راهنمای ویرایش گردش کار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center text-center p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <CirclePlay className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-green-700 text-sm">
                      گره شروع
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      نقطه آغاز فرآیند
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <Cpu className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-blue-700 text-sm">
                      گره فرآیند
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      عملیات یا وظیفه
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                      <GitBranch className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h4 className="font-semibold text-yellow-700 text-sm">
                      گره تصمیم
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      انشعاب شرطی
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-2">
                      <Square className="w-5 h-5 text-red-600" />
                    </div>
                    <h4 className="font-semibold text-red-700 text-sm">
                      گره پایان
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      پایان فرآیند
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-2">نکات ویرایش:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1"></span>
                          برای حذف گره: انتخاب + کلید Delete
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1"></span>
                          برای ایجاد ارتباط: نقطه اتصال را بکشید
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1"></span>
                          برای ویرایش گره: روی آن کلیک کنید
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1"></span>
                          تغییرات به صورت خودکار ذخیره نمی‌شوند
                        </li>
                      </ul>
                    </div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">آمار فعلی:</div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className="text-green-600 text-xs">شروع: {nodeStats.start}</span>
                        </div>
                        <div>
                          <span className="text-blue-600 text-xs">تخصیص: {nodeStats.assign}</span>
                        </div>
                        <div>
                          <span className="text-cyan-600 text-xs">فرم: {nodeStats.fillform}</span>
                        </div>
                        <div>
                          <span className="text-orange-600 text-xs">شرط: {nodeStats.condition}</span>
                        </div>
                        <div>
                          <span className="text-indigo-600 text-xs">تغییر وضعیت: {nodeStats.changeStatus}</span>
                        </div>
                        <div>
                          <span className="text-red-600 text-xs">پایان: {nodeStats.end}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Editor Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>ویرایش گردش کار</CardTitle>
                    <CardDescription>
                      گره‌ها را ویرایش و ارتباط بین آن‌ها را تغییر دهید
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
                  <WorkflowEditor 
                    onChange={handleWorkflowChange} 
                    workflowData={formData.schema}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2: // Step 3: Review and Update
        return (
          <div className="space-y-6">
            {/* Review Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>مرور تغییرات</CardTitle>
                <CardDescription>
                  تغییرات اعمال شده را بررسی و تأیید کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">
                      اطلاعات پایه
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          نام گردش کار
                        </Label>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{formData.name}</p>
                          {formData.name !== workflow?.name && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              تغییر کرده
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          توضیحات
                        </Label>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {formData.description || "بدون توضیحات"}
                          </p>
                          {formData.description !== workflow?.description && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              تغییر کرده
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          فرم ماشه
                        </Label>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {forms.find(
                              (f) => f.id.toString() === formData.trigger_form_id,
                            )?.title || "-"}
                          </p>
                          {parseInt(formData.trigger_form_id) !== workflow?.trigger_form_id && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              تغییر کرده
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          وضعیت
                        </Label>
                        <div className="flex items-center gap-2">
                          {formData.status === "active" ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span>فعال</span>
                            </div>
                          ) : formData.status === "inactive" ? (
                            <div className="flex items-center gap-1 text-amber-600">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              <span>غیرفعال</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                              <span>پیش‌نویس</span>
                            </div>
                          )}
                          {formData.status !== workflow?.status && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              تغییر کرده
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Stats */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">
                      آمار گردش کار
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 text-center">
                          {nodeStats.total}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          کل گره‌ها
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 text-center">
                          {nodeStats.connections}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          ارتباطات
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 text-center">
                          {nodeStats.assign}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          تخصیص وظیفه
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 text-center">
                          {nodeStats.condition}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          شرط
                        </div>
                      </div>
                    </div>

                    {/* Validation Status */}
                    <div className="space-y-3 mt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm">اطلاعات پایه تکمیل شده</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {nodeStats.start > 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-sm">
                          گره شروع:{" "}
                          {nodeStats.start > 0 ? "وجود دارد" : "وجود ندارد"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {nodeStats.end > 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        <span className="text-sm">
                          گره پایان:{" "}
                          {nodeStats.end > 0 ? "وجود دارد" : "اختیاری"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Notes */}
                <div className="mt-6 pt-6 border-t">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      پس از به‌روزرسانی، تغییرات اعمال شده و گردش کار قابل اجرا خواهد بود.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/workflows")}
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              بازگشت به لیست گردش‌کارها
            </Button>

            {workflow && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/workflows/${workflowId}`)}
                >
                  <Eye className="w-4 h-4 ml-2" />
                  مشاهده
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading || loadingData}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">ویرایش گردش کار</h1>
          <p className="text-muted-foreground">
            ویرایش گردش کار: {workflow?.name}
          </p>
        </div>

        {/* Stepper */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={(step) => {
                if (step < currentStep) {
                  setCurrentStep(step);
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep} disabled={loading || loadingData}>
                <ChevronLeft className="w-4 h-4 ml-2" />
                مرحله قبل
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} disabled={loading || loadingData}>
                مرحله بعد
                <ChevronRight className="w-4 h-4 mr-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || loadingData}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    در حال به‌روزرسانی...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    به‌روزرسانی گردش کار
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}