import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FieldItem from "./field-item";
import { Plus, Copy, Download, Save, RefreshCw, Link } from "lucide-react";
import { toast } from "sonner";
import { supabaseService } from "@/services/supabase";
import type { FormSchema, FormField } from "@/types/form";

// Export types for external use
export type { FormSchema, FormField };

export default function FormGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get workflow params from URL
  const workflowId = searchParams.get("workflow");
  const isTriggerForm = searchParams.get("type_trigger_form") === "true";

  const [form, setForm] = useState<FormSchema>({
    title: "نظرسنجی مشتریان",
    description: "یک فرم ساده برای جمع‌آوری نظرات مشتریان",
    fields: [
      {
        id: "field_001",
        type: "text",
        label: "نام",
        required: true,
        placeholder: "نام را وارد کنید ...",
      },
    ],
  });

  const [saving, setSaving] = useState(false);

  const addField = () => {
    const newId = `field_${Date.now()}`;
    const newField: FormField = {
      id: newId,
      type: "text",
      label: "فیلد جدید",
      required: false,
      placeholder: "",
    };

    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    }));
  };

  const removeField = (id: string) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== id),
    }));
  };

  const generateJSON = () => {
    return JSON.stringify(form, null, 2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateJSON());
    toast.success("JSON در کلیپ‌بورد کپی شد!");
  };

  const downloadJSON = () => {
    const blob = new Blob([generateJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "form-schema.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON دانلود شد!");
  };

  const handleSaveToDatabase = async () => {
    if (!form.title.trim()) {
      toast.error("لطفاً عنوان فرم را وارد کنید");
      return;
    }

    if (form.fields.length === 0) {
      toast.error("لطفاً حداقل یک فیلد به فرم اضافه کنید");
      return;
    }

    // Validate that select/radio fields have options
    const invalidFields = form.fields.filter(
      (field) =>
        (field.type === "select" || field.type === "radio") &&
        (!field.options || field.options.length === 0),
    );

    if (invalidFields.length > 0) {
      toast.error(
        `لطفاً گزینه‌هایی به ${invalidFields.length} ${
          invalidFields.length === 1 ? "فیلد" : "فیلد"
        } اضافه کنید: ${invalidFields.map((f) => f.label).join(", ")}`,
      );
      return;
    }

    setSaving(true);
    try {
      // Prepare the form data for Supabase
      const formData = {
        title: form.title,
        description: form.description || null,
        schema: form, // Store the complete form schema directly as JSON
      };

      // Create the form
      const result = await supabaseService.createForm(formData);

      if (result) {
        toast.success("فرم با موفقیت در پایگاه داده ذخیره شد!");

        // If workflowId is present in URL, associate the form to the workflow
        if (workflowId) {
          // Associate form to workflow
          await supabaseService.associateFormToWorkflow(workflowId, result);

          // If this is a trigger form, update the workflow's trigger_form_id
          if (isTriggerForm) {
            await supabaseService.updateWorkflow(workflowId, {
              trigger_form: {
                id: result.id,
              },
            });
            toast.success("فرم به عنوان فرم آغازگر گردش کار تنظیم شد!");
          } else {
            toast.success("فرم به گردش کار متصل شد!");
          }

          // Navigate to workflow detail page
          navigate(`/workflows/${workflowId}`);
        } else navigate("/form");
      } else {
        toast.error("ذخیره فرم ناموفق بود - هیچ پاسخی دریافت نشد");
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`ذخیره فرم ناموفق بود: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Render preview input based on field type
  const renderPreviewInput = (field: FormField) => {
    switch (field.type) {
      case "relation":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link className="w-4 h-4" />
              <span>
                مرتبط با: {field.relationConfig?.formTitle || "فرم مرتبط"}
              </span>
            </div>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="از فرم مرتبط انتخاب کنید..." />
              </SelectTrigger>
            </Select>
          </div>
        );

      case "textarea":
        return <Textarea placeholder={field.placeholder} disabled />;

      case "select":
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue
                placeholder={field.placeholder || "یک گزینه انتخاب کنید"}
              />
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
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`preview-${field.id}-${index}`}
                  name={`preview-${field.id}`}
                  disabled
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`preview-${field.id}-${index}`}
                  className="font-normal"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`preview-${field.id}`}
              disabled
              className="h-4 w-4"
            />
            <Label htmlFor={`preview-${field.id}`} className="font-normal">
              {field.placeholder || "این گزینه را انتخاب کنید"}
            </Label>
          </div>
        );

      case "date":
        return <Input type="date" placeholder={field.placeholder} disabled />;

      default:
        return (
          <Input type={field.type} placeholder={field.placeholder} disabled />
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">سازنده فرم</h1>
          <p className="text-muted-foreground">
            فرم‌ها را بصری بسازید و به عنوان JSON خروجی بگیرید یا در پایگاه داده
            ذخیره کنید
            {workflowId && (
              <span className="block mt-1 text-primary">
                در حال ایجاد فرم برای گردش کار #{workflowId}
                {isTriggerForm && " (فرم آغازگر)"}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات فرم</CardTitle>
              <CardDescription>
                عنوان و توضیحات فرم خود را پیکربندی کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان فرم *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="عنوان فرم را وارد کنید"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  این عنوان هنگام پر کردن فرم به کاربران نمایش داده می‌شود
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">توضیحات (اختیاری)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="توضیحات فرم را وارد کنید"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  زمینه یا دستورالعمل‌های اضافی برای کاربران ارائه دهید
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>فیلدهای فرم</CardTitle>
                  <CardDescription>
                    فیلدهای فرم را اضافه و پیکربندی کنید
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {form.fields.length} فیلد
                  {form.fields.length !== 1 ? "" : ""}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.fields.map((field) => (
                  <FieldItem
                    key={field.id}
                    field={field}
                    onUpdate={updateField}
                    onRemove={removeField}
                  />
                ))}
              </div>

              <Button
                onClick={addField}
                variant="outline"
                className="w-full mt-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                افزودن فیلد جدید
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions, Preview & JSON Output */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>عملیات</CardTitle>
              <CardDescription>
                فرم خود را ذخیره یا خروجی بگیرید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={handleSaveToDatabase}
                  className="w-full"
                  disabled={saving || form.fields.length === 0}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      ذخیره در پایگاه داده
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="w-full"
                    disabled={form.fields.length === 0}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    کپی JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadJSON}
                    className="w-full"
                    disabled={form.fields.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    دانلود JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Preview */}
          <Card>
            <CardHeader>
              <CardTitle>پیش‌نمایش فرم</CardTitle>
              <CardDescription>
                فرم شما چگونه برای کاربران نمایش داده خواهد شد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{form.title}</h3>
                  {form.description && (
                    <p className="text-sm text-muted-foreground">
                      {form.description}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {form.fields.length === 0 ? (
                    <div className="text-center py-4 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        هنوز فیلدی اضافه نشده است
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        برای مشاهده پیش‌نمایش فیلد اضافه کنید
                      </p>
                    </div>
                  ) : (
                    form.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`preview-${field.id}`}>
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        {renderPreviewInput(field)}
                      </div>
                    ))
                  )}
                </div>

                {form.fields.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Button variant="outline" disabled>
                      ارسال
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* JSON Output */}
          <Card>
            <CardHeader>
              <CardTitle>خروجی JSON</CardTitle>
              <CardDescription>
                این JSON را برای استفاده در برنامه‌های خود خروجی بگیرید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-2">
                  این همان ساختاری است که ذخیره خواهد شد:
                </div>
                {form.fields.length > 0 ? (
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[400px]">
                    {generateJSON()}
                  </pre>
                ) : (
                  <div className="bg-muted p-4 rounded-md text-center">
                    <p className="text-muted-foreground">
                      برای تولید JSON فیلد اضافه کنید
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
