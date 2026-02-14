import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns-jalali";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Send,
  RefreshCw,
  AlertCircle,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { supabaseService } from "@/services/supabase.service";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: number;
  step: {
    id: string;
    type: string;
    label: string;
    form_id?: number;
    role_id?: number;
    [key: string]: any;
  };
  assigned_to: string | null;
  created_by: string | null;
  status: any; // Dynamic status object from database
  form_id: number | null;
  task_data: any;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  form?: {
    id: number;
    title: string;
    schema?: any;
  };
  responses?: Array<{
    id: number;
    data: any;
    created_at: string;
    created_by: string;
  }>;
}

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export default function TaskDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const taskId = parseInt(id || "0");
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, FormField>>({});
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAssignedToMe = task?.assigned_to === user?.id;
  const isFillFormTask = task?.step?.type === 'fill-form';
  const canFillForm = isAssignedToMe && isFillFormTask;

  useEffect(() => {
    if (taskId) {
      loadTaskData();
    }
  }, [taskId]);

  const loadTaskData = async () => {
    setLoading(true);
    try {
      const taskData = await supabaseService.tasks.getTaskWithResponses(taskId);

      if (!taskData) {
        toast.error("وظیفه مورد نظر یافت نشد");
        navigate("/cartable");
        return;
      }

      setTask(taskData);

      // Parse form schema and create field mapping
      if (taskData.form?.schema) {
        const schema =
          typeof taskData.form.schema === "string"
            ? JSON.parse(taskData.form.schema)
            : taskData.form.schema;

        const fields = schema?.fields || [];
        setFormFields(fields);

        const mapping: Record<string, FormField> = {};
        fields.forEach((field: FormField) => {
          mapping[field.id] = field;
        });
        setFieldMapping(mapping);

        // Initialize form data
        const initialData: Record<string, any> = {};
        fields.forEach((field: FormField) => {
          switch (field.type) {
            case "checkbox":
              initialData[field.id] = false;
              break;
            case "select":
            case "radio":
              initialData[field.id] = "";
              break;
            default:
              initialData[field.id] = "";
          }
        });
        setFormData(initialData);
      }

      // Load users for assignee/creator info
      const profilesResponse = await supabaseService.users.getProfiles(1, 100);
      setUsers(profilesResponse.data);
    } catch (error) {
      console.error("Error loading task:", error);
      toast.error("بارگذاری اطلاعات وظیفه ناموفق بود");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    formFields.forEach((field: FormField) => {
      const value = formData[field.id];

      if (field.required) {
        if (field.type === "checkbox") {
          if (!value) {
            newErrors[field.id] = `${field.label} الزامی است`;
          }
        } else if (
          field.type === "select" ||
          field.type === "radio"
        ) {
          if (!value || value.toString().trim() === "") {
            newErrors[field.id] = `لطفاً یک گزینه برای ${field.label} انتخاب کنید`;
          }
        } else if (!value || value.toString().trim() === "") {
          newErrors[field.id] = `${field.label} الزامی است`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task || !task.form) return;

    if (!validateForm()) {
      toast.error("لطفاً خطاهای موجود در فرم را برطرف کنید");
      return;
    }

    setSubmitting(true);
    try {
      // Use form_id from step or from task
      const formId = task.step?.form_id || task.form?.id;
      
      if (!formId) {
        throw new Error("شناسه فرم یافت نشد");
      }

      const response = await supabaseService.responses.submitFormResponse(
        formId,
        formData
      );

      if (!response) {
        throw new Error("پاسخی دریافت نشد");
      }

      await supabaseService.tasks.createTaskResponse(task.id, response.id);

      // Update local state
      const updatedTask = { ...task };
      updatedTask.responses = [...(task.responses || []), response];
      updatedTask.updated_at = new Date().toISOString();

      setTask(updatedTask);

      // Reset form
      const resetData: Record<string, any> = {};
      formFields.forEach((field: FormField) => {
        switch (field.type) {
          case "checkbox":
            resetData[field.id] = false;
            break;
          case "select":
          case "radio":
            resetData[field.id] = "";
            break;
          default:
            resetData[field.id] = "";
        }
      });
      setFormData(resetData);

      toast.success("فرم با موفقیت ارسال شد!");
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(`ارسال فرم ناموفق بود: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const fieldValue = formData[field.id] || "";
    const isRequired = field.required;

    const baseProps = {
      id: field.id,
      required: isRequired,
      placeholder: field.placeholder || "",
      className: fieldError ? "border-red-500 focus-visible:ring-red-500" : "",
    };

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleInputChange(field.id, e.target.value)
            }
            rows={4}
          />
        );

      case "select":
        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleInputChange(field.id, value)}
          >
            <SelectTrigger
              className={`w-full ${fieldError ? "border-red-500" : ""}`}
            >
              <SelectValue placeholder={field.placeholder || "یک گزینه انتخاب کنید"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <RadioGroup
            value={fieldValue}
            onValueChange={(value) => handleInputChange(field.id, value)}
            className="space-y-2"
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem
                  value={option}
                  id={`${field.id}-${index}`}
                  className={fieldError ? "border-red-500" : ""}
                />
                <Label
                  htmlFor={`${field.id}-${index}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id={field.id}
              checked={!!fieldValue}
              onCheckedChange={(checked) =>
                handleInputChange(field.id, checked)
              }
              className={fieldError ? "border-red-500" : ""}
            />
            <Label
              htmlFor={field.id}
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {field.placeholder || field.label}
              {isRequired && <span className="text-red-500 mr-1">*</span>}
            </Label>
          </div>
        );

      case "date":
        return (
          <Input
            type="date"
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(field.id, e.target.value)
            }
          />
        );

      case "number":
        return (
          <Input
            type="number"
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(field.id, e.target.value)
            }
          />
        );

      case "email":
        return (
          <Input
            type="email"
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(field.id, e.target.value)
            }
          />
        );

      default:
        return (
          <Input
            type="text"
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(field.id, e.target.value)
            }
          />
        );
    }
  };

  // Get status badge directly from the status object
  const getStatusBadge = (status: any) => {
    if (!status) return null;
    
    // If it's a string (fallback), use default styling
    if (typeof status === 'string') {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
          {status}
        </Badge>
      );
    }

    // Use the status object directly from the database
    const backgroundColor = status.color || status.statusColor || '#6b7280';
    const textColor = '#fff';
    
    return (
      <Badge
        style={{
          backgroundColor,
          color: textColor,
          borderColor: backgroundColor,
        }}
        className="border"
      >
        {status.label || status.statusLabel || status.status || 'وضعیت'}
      </Badge>
    );
  };

  const getStepTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; color: string }> = {
      'fill-form': { label: 'فرم', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
      'assign-task': { label: 'تخصیص', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      'change-status': { label: 'تغییر وضعیت', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
      'condition': { label: 'شرط', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      'start': { label: 'شروع', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'end': { label: 'پایان', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };

    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };

    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    );
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "سیستم";
    const profile = users.find((u) => u.id === userId);
    return profile?.name || profile?.full_name || profile?.email || userId;
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "yyyy/MM/dd HH:mm");
    } catch {
      return date;
    }
  };

  const getFieldLabel = (fieldId: string): string => {
    const field = fieldMapping[fieldId];
    return field?.label || fieldId;
  };

  const formatFieldValue = (fieldId: string, value: any): string => {
    const field = fieldMapping[fieldId];

    if (value === null || value === undefined) return "-";

    switch (field?.type) {
      case "date":
        try {
          return format(new Date(value), "yyyy/MM/dd");
        } catch {
          return value;
        }
      case "checkbox":
        return value ? "بله" : "خیر";
      case "select":
      case "radio":
        if (field.options) {
          const option = field.options.find(
            (opt: any) => opt === value
          );
          return option || value;
        }
        return value;
      default:
        return String(value);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/cartable")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به کارتابل
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {task.step?.label || 'بدون عنوان'}
                </h1>
                {getStepTypeBadge(task.step?.type)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                <FileText className="h-4 w-4" />
                <span>شناسه وظیفه: {task.id}</span>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4" />
                <span>ایجاد: {formatDateTime(task.created_at)}</span>
                {task.form && (
                  <>
                    <span className="mx-2">•</span>
                    <FileText className="h-4 w-4" />
                    <span>{task.form.title}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(task.status)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Details & Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات وظیفه</CardTitle>
                <CardDescription>
                  جزئیات و اطلاعات مربوط به این وظیفه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      واگذار شده به
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(getUserName(task.assigned_to))}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {getUserName(task.assigned_to)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      ایجاد شده توسط
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(getUserName(task.created_by))}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {getUserName(task.created_by)}
                      </span>
                    </div>
                  </div>

                  {task.due_date && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        مهلت انجام
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={
                            new Date(task.due_date) < new Date() &&
                            task.status !== "completed"
                              ? "text-red-500 font-medium"
                              : ""
                          }
                        >
                          {formatDateTime(task.due_date)}
                        </span>
                      </div>
                    </div>
                  )}

                  {task.completed_at && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        تاریخ تکمیل
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{formatDateTime(task.completed_at)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {task.task_data?.description && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">
                      توضیحات
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {task.task_data.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Responses Card - Always show if there are responses */}
            {task.responses && task.responses.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>پاسخ‌های قبلی</CardTitle>
                  </div>
                  <CardDescription>
                    پاسخ‌های ثبت شده قبلی برای این فرم
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {task.responses.map((response, index) => (
                    <div key={response.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          پاسخ {index + 1}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(response.created_at)}
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(response.data || {}).map(
                            ([fieldId, value]) => {
                              const fieldLabel = getFieldLabel(fieldId);
                              const formattedValue = formatFieldValue(
                                fieldId,
                                value,
                              );

                              return (
                                <div key={fieldId} className="space-y-1">
                                  <div className="text-xs text-muted-foreground">
                                    {fieldLabel}
                                  </div>
                                  <div className="text-sm bg-secondary text-secondary-foreground p-2 rounded-md border border-border">
                                    {formattedValue}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end text-xs text-muted-foreground">
                        ثبت شده توسط: {getUserName(response.created_by)}
                      </div>
                      {index < (task.responses?.length || 0) - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Current Form Card - Always show if user can fill form */}
            {canFillForm && (
              <Card>
                <CardHeader>
                  <CardTitle>فرم جدید</CardTitle>
                  <CardDescription>
                    لطفاً فرم زیر را تکمیل کنید
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleFormSubmit}>
                  <CardContent className="space-y-6">
                    {formFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        {field.type !== "checkbox" && (
                          <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 mr-1">*</span>
                            )}
                          </Label>
                        )}

                        {renderField(field)}

                        {errors[field.id] && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors[field.id]}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                          در حال ارسال...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 ml-2" />
                          ارسال پاسخ جدید
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Task Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">اطلاعات گام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">شناسه گام:</span>
                  <span className="font-mono text-xs">{task.step?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نوع گام:</span>
                  <Badge variant="outline" className="text-xs">
                    {task.step?.type}
                  </Badge>
                </div>
                {task.step?.form_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">شناسه فرم گام:</span>
                    <span className="font-mono text-xs">{task.step.form_id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تعداد پاسخ‌ها:</span>
                  <span className="font-mono">{task.responses?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">شناسه فرم:</span>
                  <span className="font-mono">{task.form_id || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخرین به‌روزرسانی:</span>
                  <span>{formatDateTime(task.updated_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Info Card - Shows when no previous responses */}
            {!task.responses?.length && canFillForm && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                        اولین پاسخ شما
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        شما اولین نفری هستید که به این فرم پاسخ می‌دهید. پاسخ شما به عنوان مرجع برای مراحل بعدی استفاده خواهد شد.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}