import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, X, Link, AlertCircle, Info, Loader2 } from "lucide-react";
import type { FormField, FieldType } from "@/types/form";
import { supabaseService } from "@/services/supabase.service";

interface FieldItemProps {
  field: FormField;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onRemove: (id: string) => void;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "text", label: "متن" },
  { value: "email", label: "ایمیل" },
  { value: "number", label: "عدد" },
  { value: "textarea", label: "متن چند خطی" },
  { value: "select", label: "لیست کشویی" },
  { value: "radio", label: "دکمه رادیویی" },
  { value: "checkbox", label: "چک باکس" },
  { value: "date", label: "تاریخ" },
  { value: "relation", label: "ارتباط فرم" },
];

export default function FieldItem({ field, onUpdate, onRemove }: FieldItemProps) {
  const [newOption, setNewOption] = useState("");
  const [forms, setForms] = useState<any[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [relatedFormFields, setRelatedFormFields] = useState<Array<{ id: string; label: string; type: string }>>([]);
  const [loadingRelatedFields, setLoadingRelatedFields] = useState(false);

  // Fetch forms for relation configuration
  useEffect(() => {
    if (field.type === 'relation') {
      fetchForms();
    }
  }, [field.type]);

  // Fetch related form fields when form is selected
  useEffect(() => {
    if (field.type === 'relation' && field.relationConfig?.formId) {
      fetchRelatedFormFields(field.relationConfig.formId);
    } else {
      setRelatedFormFields([]);
    }
  }, [field.type, field.relationConfig?.formId]);

  const fetchForms = async () => {
    setLoadingForms(true);
    try {
      const fetchedForms = await supabaseService.getForms();
      setForms(fetchedForms);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoadingForms(false);
    }
  };

  const fetchRelatedFormFields = async (formId: string) => {
    setLoadingRelatedFields(true);
    try {
      const form = await supabaseService.getFormById(formId);
      if (form && form.schema) {
        let schema;
        try {
          schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
        } catch (e) {
          console.error("Error parsing form schema:", e);
          return;
        }

        if (schema && schema.fields && Array.isArray(schema.fields)) {
          const fields = schema.fields.map((f: any) => ({
            id: f.id,
            label: f.label || `فیلد ${f.id}`,
            type: f.type
          }));
          setRelatedFormFields(fields);
        }
      }
    } catch (error) {
      console.error("Error fetching related form fields:", error);
    } finally {
      setLoadingRelatedFields(false);
    }
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      const currentOptions = field.options || [];
      onUpdate(field.id, {
        options: [...currentOptions, newOption.trim()]
      });
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = field.options || [];
    const updatedOptions = currentOptions.filter((_, i) => i !== index);
    onUpdate(field.id, { options: updatedOptions });
  };

  const handleOptionChange = (index: number, value: string) => {
    const currentOptions = field.options || [];
    const updatedOptions = [...currentOptions];
    updatedOptions[index] = value;
    onUpdate(field.id, { options: updatedOptions });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newOption.trim()) {
      e.preventDefault();
      handleAddOption();
    }
  };

  const handleRelationConfigChange = (key: string, value: string) => {
    const currentConfig = field.relationConfig || {};
    const updates: any = {
      ...currentConfig,
      [key]: value
    };

    // When form changes, reset display field
    if (key === 'formId') {
      const selectedForm = forms.find(f => f.id === value);
      updates.formTitle = selectedForm?.title || "فرم بدون عنوان";
      updates.displayField = ""; // Reset display field
      // Value is always the form ID
      updates.valueField = value;
    }

    onUpdate(field.id, { relationConfig: updates });
  };

  const getSelectedForm = () => {
    return forms.find(f => f.id === field.relationConfig?.formId);
  };

  const getFieldDisplayName = (fieldId: string) => {
    const field = relatedFormFields.find(f => f.id === fieldId);
    return field ? `${field.label}` : fieldId;
  };

  // Helper function to check if placeholder should be shown for current field type
  const shouldShowPlaceholder = () => {
    const placeholderTypes = ['text', 'email', 'number', 'textarea', 'select'];
    return placeholderTypes.includes(field.type);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-4">
          {/* Field Type Selection */}
          <div className="space-y-2">
            <Label htmlFor={`type-${field.id}`}>نوع فیلد</Label>
            <Select
              value={field.type}
              onValueChange={(value: FieldType) => {
                const updates: Partial<FormField> = { type: value };
                // Clear relation config if changing from relation type
                if (field.type === 'relation' && value !== 'relation') {
                  updates.relationConfig = undefined;
                }
                // Clear options if changing from select/radio to non-option type
                if ((field.type === 'select' || field.type === 'radio') && 
                    !['select', 'radio'].includes(value)) {
                  updates.options = undefined;
                }
                onUpdate(field.id, updates);
              }}
            >
              <SelectTrigger id={`type-${field.id}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label Input */}
          <div className="space-y-2">
            <Label htmlFor={`label-${field.id}`}>برچسب</Label>
            <Input
              id={`label-${field.id}`}
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              placeholder="برچسب فیلد را وارد کنید"
              className="w-full"
            />
          </div>

          {/* Placeholder Input (for text-based fields) */}
          {shouldShowPlaceholder() && (
            <div className="space-y-2">
              <Label htmlFor={`placeholder-${field.id}`}>نوشته راهنما</Label>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder || ""}
                onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder="نوشته راهنما را وارد کنید"
                className="w-full"
              />
            </div>
          )}

          {/* Relation Configuration */}
          {field.type === 'relation' && (
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5 dark:bg-primary/10">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-primary" />
                <Label className="font-medium">تنظیمات ارتباط</Label>
              </div>
              
              <div className="space-y-3">
                {/* Related Form Selection */}
                <div className="space-y-2">
                  <Label htmlFor={`relation-form-${field.id}`}>فرم مرتبط</Label>
                  <Select
                    value={field.relationConfig?.formId || ""}
                    onValueChange={(value) => handleRelationConfigChange('formId', value)}
                    disabled={loadingForms}
                  >
                    <SelectTrigger id={`relation-form-${field.id}`}>
                      {loadingForms ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>در حال بارگذاری فرم‌ها...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="یک فرم برای ایجاد ارتباط انتخاب کنید" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title || "فرم بدون عنوان"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {field.relationConfig?.formId && (
                  <>
                    {/* Display Field Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`display-field-${field.id}`}>
                        فیلدی که در لیست کشویی نمایش داده شود
                      </Label>
                      <Select
                        value={field.relationConfig?.displayField || ""}
                        onValueChange={(value) => handleRelationConfigChange('displayField', value)}
                        disabled={loadingRelatedFields}
                      >
                        <SelectTrigger id={`display-field-${field.id}`}>
                          {loadingRelatedFields ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>در حال بارگذاری فیلدهای فرم...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="یک فیلد برای نمایش انتخاب کنید" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {/* Form fields */}
                          {relatedFormFields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.label} - {field.type}
                            </SelectItem>
                          ))}
                          {/* Show message if no fields */}
                          {relatedFormFields.length === 0 && !loadingRelatedFields && (
                            <SelectItem value="" disabled>
                              فیلدی در فرم انتخاب شده یافت نشد
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        فیلدی از فرم مرتبط که در لیست کشویی نمایش داده می‌شود
                      </p>
                    </div>

                    {/* Information Panel */}
                    <div className="rounded-md bg-primary/10 dark:bg-primary/20 p-3">
                      <p className="text-sm text-primary font-medium">
                        این فیلد یک ارتباط با ایجاد می‌کند:{" "}
                        <span className="font-semibold">
                          {getSelectedForm()?.title || "فرم انتخاب شده"}
                        </span>
                      </p>
                      
                      {field.relationConfig?.displayField ? (
                        <>
                          <p className="text-sm text-primary mt-2">
                            در لیست کشویی، کاربران خواهند دید: <span className="font-medium">
                              {getFieldDisplayName(field.relationConfig.displayField)}
                            </span>
                          </p>
                          <p className="text-sm text-primary mt-1">
                            مقداری که ذخیره خواهد شد: <span className="font-medium">
                              شناسه فرم: {field.relationConfig.formId}
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-primary mt-2">
                          ⓘ یک فیلد از فرم مرتبط برای نمایش انتخاب کنید
                        </p>
                      )}
                      
                      <div className="mt-2 pt-2 border-t border-primary/20">
                        <p className="text-xs text-primary/80">
                          <span className="font-medium">توجه:</span> مقدار ذخیره شده همیشه شناسه فرم ({field.relationConfig.formId}) خواهد بود. 
                          این امر ارتباطات داده‌ای یکسانی را تضمین می‌کند.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Options Management (for select and radio fields) */}
          {(field.type === 'select' || field.type === 'radio') && (
            <div className="space-y-3">
              <Label>گزینه‌ها</Label>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`گزینه ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="h-9 w-9 shrink-0"
                      aria-label={`حذف گزینه ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="افزودن گزینه جدید"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddOption}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={!newOption.trim()}
                  aria-label="افزودن گزینه"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                گزینه‌هایی برای انتخاب کاربران اضافه کنید. Enter را فشار دهید یا + را کلیک کنید.
              </p>
            </div>
          )}

          {/* Required Switch */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <Label htmlFor={`required-${field.id}`} className="cursor-pointer">
                فیلد الزامی
              </Label>
              <p className="text-xs text-muted-foreground">
                کاربران باید این فیلد را پر کنند تا فرم را ارسال کنند
              </p>
            </div>
            <Switch
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked) => onUpdate(field.id, { required: checked })}
            />
          </div>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(field.id)}
          className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          aria-label="حذف فیلد"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Validation messages */}
      {(field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0) && (
        <div className="flex items-start gap-2 rounded-md bg-warning/10 dark:bg-warning/20 p-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
          <p className="text-sm text-warning">
            این فیلد {field.type} هیچ گزینه‌ای ندارد. لطفاً گزینه‌هایی در بالا اضافه کنید.
          </p>
        </div>
      )}

      {/* Relation configuration info */}
      {field.type === 'relation' && !field.relationConfig?.formId && (
        <div className="flex items-start gap-2 rounded-md bg-primary/10 dark:bg-primary/20 p-3">
          <Info className="h-4 w-4 text-primary mt-0.5" />
          <p className="text-sm text-primary">
            لطفاً یک فرم برای ایجاد ارتباط انتخاب کنید.
          </p>
        </div>
      )}
    </div>
  );
}