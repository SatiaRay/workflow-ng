import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  ArrowLeft,
  CheckCircle,
  Send,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Link,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseService } from "@/services/supabase";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  relationConfig?: {
    formId?: string;
    formTitle?: string;
    displayField?: string;
  };
}

interface RelatedResponse {
  id: string;
  data: Record<string, any>;
  created_at: string;
  displayValue: string;
  formId: string;
}

export default function SubmitForm() {
  const { id } = useParams<{ id: string }>();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formNotFound, setFormNotFound] = useState(false);
  const [relatedResponses, setRelatedResponses] = useState<
    Record<string, RelatedResponse[]>
  >({});
  const [loadingRelations, setLoadingRelations] = useState<
    Record<string, boolean>
  >({});

  // Get redirect from URL params
  const redirect = searchParams.get("redirect");

  // Fetch form schema and related data
  useEffect(() => {
    if (!id) {
      setFormNotFound(true);
      setLoading(false);
      return;
    }

    const fetchForm = async () => {
      setLoading(true);
      setFormNotFound(false);

      try {
        const form = await supabaseService.getFormById(id);

        if (!form) {
          setFormNotFound(true);
          toast.error("فرم یافت نشد");
          return;
        }

        setFormTitle(form.title || "");
        setFormDescription(form.description || "");

        let parsedFields: FormField[] = [];

        try {
          let schema = form.schema;
          if (typeof schema === "string") {
            schema = JSON.parse(schema);
          }

          if (schema && typeof schema === "object" && "fields" in schema) {
            parsedFields = schema.fields || [];
          }
        } catch (parseError) {
          console.error("Error parsing schema:", parseError);
          toast.error("خطا در بارگذاری ساختار فرم");
        }

        setFields(parsedFields);

        // Initialize form data structure with default values
        const initialData: Record<string, any> = {};
        parsedFields.forEach((field: FormField) => {
          switch (field.type) {
            case "checkbox":
              initialData[field.id] = false;
              break;
            case "select":
            case "radio":
            case "relation":
              initialData[field.id] = "";
              break;
            default:
              initialData[field.id] = "";
          }
        });
        setFormData(initialData);

        // Fetch related responses for relation fields
        await fetchRelatedResponses(parsedFields);
      } catch (error: any) {
        console.error("Error fetching form:", error);
        toast.error(`خطا در بارگذاری فرم: ${error.message}`);
        setFormNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const fetchRelatedResponses = async (fields: FormField[]) => {
    const relationFields = fields.filter(
      (f) => f.type === "relation" && f.relationConfig?.formId
    );

    for (const field of relationFields) {
      setLoadingRelations((prev) => ({ ...prev, [field.id]: true }));

      try {
        const formId = field.relationConfig!.formId!;
        const responses = await supabaseService.getFormResponses(formId);

        if (!Array.isArray(responses)) {
          console.error(
            `Expected array of responses for form ${formId}, got:`,
            responses
          );
          setRelatedResponses((prev) => ({
            ...prev,
            [field.id]: [],
          }));
          continue;
        }

        const formattedResponses = responses
          .map((response: any) => {
            const responseId = response.id;

            let data: Record<string, any> = {};
            try {
              if (response.data) {
                data = response.data;
              } else {
                const {
                  id,
                  created_at,
                  updated_at,
                  form_id,
                  ...rest
                } = response;
                data = rest;
              }
            } catch (error) {
              console.error("Error parsing response data:", error, response);
              data = {};
            }

            let displayValue = `پاسخ ${String(responseId).substring(
              0,
              8
            )}...`;

            if (field.relationConfig?.displayField) {
              const displayFieldValue = data[field.relationConfig.displayField];
              if (
                displayFieldValue !== undefined &&
                displayFieldValue !== null &&
                displayFieldValue !== ""
              ) {
                displayValue = String(displayFieldValue);
              } else {
                const firstTextValue = Object.values(data).find(
                  (val) =>
                    val !== undefined &&
                    val !== null &&
                    String(val).trim() !== ""
                );
                if (firstTextValue) {
                  const strValue = String(firstTextValue);
                  displayValue =
                    strValue.length > 50
                      ? strValue.substring(0, 50) + "..."
                      : strValue;
                }
              }
            }

            const createdAt = response.created_at || new Date().toISOString();

            return {
              id: responseId,
              data: data,
              created_at: createdAt,
              displayValue,
              formId: formId,
            };
          })
          .filter((response) => response.id);

        setRelatedResponses((prev) => ({
          ...prev,
          [field.id]: formattedResponses,
        }));
      } catch (error) {
        console.error(
          `Error fetching related responses for field ${field.id}:`,
          error
        );
        toast.error(`بارگذاری داده‌های مرتبط برای ${field.label} ناموفق بود`);

        setRelatedResponses((prev) => ({
          ...prev,
          [field.id]: [],
        }));
      } finally {
        setLoadingRelations((prev) => ({ ...prev, [field.id]: false }));
      }
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

    fields.forEach((field: FormField) => {
      const value = formData[field.id];

      if (field.required) {
        if (field.type === "checkbox") {
          if (!value) {
            newErrors[field.id] = `${field.label} الزامی است`;
          }
        } else if (
          field.type === "select" ||
          field.type === "radio" ||
          field.type === "relation"
        ) {
          if (!value || value.toString().trim() === "") {
            newErrors[field.id] = `لطفاً یک گزینه برای ${field.label} انتخاب کنید`;
          }
        } else if (!value || value.toString().trim() === "") {
          newErrors[field.id] = `${field.label} الزامی است`;
        }
      }

      if (field.type === "email" && value && value.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = "لطفاً یک آدرس ایمیل معتبر وارد کنید";
        }
      }

      if (field.type === "number" && value && value.trim() !== "") {
        if (isNaN(Number(value))) {
          newErrors[field.id] = "لطفاً یک عدد معتبر وارد کنید";
        }
      }

      if (field.type === "relation" && field.required && value) {
        const responses = relatedResponses[field.id] || [];
        const selectedResponse = responses.find((r) => r.id === value);
        if (!selectedResponse) {
          newErrors[field.id] = "لطفاً یک گزینه معتبر انتخاب کنید";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("لطفاً خطاهای موجود در فرم را برطرف کنید");
      return;
    }

    if (!id) {
      toast.error("شناسه فرم وجود ندارد");
      return;
    }

    setSubmitting(true);
    try {
      const result = await supabaseService.submitFormResponse(id, formData);

      if (result) {
        toast.success("فرم با موفقیت ارسال شد!");
        setErrors({});
        
        // Check if redirect parameter exists
        if (redirect) {
          navigate(redirect);
        } else {
          setIsSubmitted(true);
        }
      } else {
        toast.error("ارسال فرم ناموفق بود - هیچ پاسخی دریافت نشد");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`ارسال ناموفق بود: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setIsSubmitted(false);

    const resetData: Record<string, any> = {};
    fields.forEach((field: FormField) => {
      switch (field.type) {
        case "checkbox":
          resetData[field.id] = false;
          break;
        case "select":
        case "radio":
        case "relation":
          resetData[field.id] = "";
          break;
        default:
          resetData[field.id] = "";
      }
    });
    setFormData(resetData);
    setErrors({});

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const isRequired = field.required;
    const fieldValue = formData[field.id] || "";
    const isLoading = loadingRelations[field.id];

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
        const hasOptions = field.options && field.options.length > 0;

        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleInputChange(field.id, value)}
            disabled={!hasOptions}
          >
            <SelectTrigger
              className={`w-full ${fieldError ? "border-red-500" : ""}`}
            >
              <SelectValue
                placeholder={
                  hasOptions
                    ? field.placeholder || "یک گزینه انتخاب کنید"
                    : "گزینه‌ای موجود نیست"
                }
              />
            </SelectTrigger>
            {hasOptions && (
              <SelectContent>
                {field.options!.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            )}
          </Select>
        );

      case "relation":
        const responses = relatedResponses[field.id] || [];
        const hasResponses = responses.length > 0;
        const formTitle = field.relationConfig?.formTitle || "فرم مرتبط";

        return (
          <div className="space-y-2">
            <SearchableSelect
              value={fieldValue}
              onValueChange={(value) => handleInputChange(field.id, value)}
              options={responses.map((response) => ({
                value: response.id,
                label: response.displayValue,
                description: `ارسال شده در ${new Date(
                  response.created_at
                ).toLocaleDateString("fa-IR")}`,
              }))}
              placeholder={
                isLoading
                  ? "در حال بارگذاری گزینه‌ها..."
                  : hasResponses
                  ? field.placeholder || `انتخاب از ${formTitle}`
                  : "پاسخی موجود نیست"
              }
              disabled={isLoading || !hasResponses}
              className={fieldError ? "border-red-500" : ""}
              emptyMessage="هیچ پاسخی در فرم مرتبط یافت نشد"
            />
            {field.relationConfig?.formTitle && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link className="w-3 h-3" />
                <span>مرتبط با: {field.relationConfig.formTitle}</span>
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </div>
            )}
            {!isLoading && hasResponses && (
              <p className="text-xs text-muted-foreground">
                انتخاب یک گزینه یک ارتباط با {formTitle} ایجاد می‌کند
              </p>
            )}
          </div>
        );

      case "radio":
        return (
          <RadioGroup
            value={fieldValue}
            onValueChange={(value) => handleInputChange(field.id, value)}
            className={
              fieldError
                ? "space-y-2 border border-red-300 rounded-md p-4"
                : "space-y-2"
            }
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`${field.id}-${index}`}
                  className={fieldError ? "border-red-500" : ""}
                />
                <Label
                  htmlFor={`${field.id}-${index}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
            {!field.options || field.options.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                گزینه‌ای موجود نیست
              </p>
            ) : null}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={!!fieldValue}
              onCheckedChange={(checked) =>
                handleInputChange(field.id, checked)
              }
              className={
                fieldError
                  ? "border-red-500 data-[state=checked]:bg-red-500"
                  : ""
              }
            />
            <Label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {field.placeholder || field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">فرم یافت نشد</h2>
            <p className="text-muted-foreground mb-4">
              فرمی که به دنبال آن هستید وجود ندارد یا حذف شده است.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Success State - Shows after submission when no redirect */}
        {isSubmitted && !redirect ? (
          <Card className="border-green-200 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4 text-green-700">
                با موفقیت ارسال شد!
              </h1>

              <p className="text-lg text-muted-foreground mb-2">
                از ارسال فرم{" "}
                <span className="font-semibold">{formTitle}</span> متشکریم
              </p>

              <p className="text-muted-foreground mb-8">
                پاسخ شما با موفقیت ثبت شد.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleSubmitAnother}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  ارسال پاسخ دیگر
                </Button>

                <Button
                  onClick={() => navigate(`/responses/${id}`)}
                  variant="outline"
                  size="lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  بازگشت به فهرست پاسخ ها
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  نیاز به ایجاد تغییرات دارید؟ روی "ارسال پاسخ دیگر" کلیک کنید تا دوباره فرم را پر کنید.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Form Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                بازگشت
              </Button>

              <h1 className="text-3xl font-bold mb-2">{formTitle}</h1>

              {formDescription && (
                <p className="text-muted-foreground mb-4">{formDescription}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>فرم فعال است و پاسخ‌ها را می‌پذیرد</span>
              </div>

              {fields.length === 0 && (
                <Alert>
                  <AlertDescription>
                    این فرم فیلدی برای ارسال ندارد.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Form */}
            {fields.length > 0 ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>فرم را تکمیل کنید</CardTitle>
                  <CardDescription>
                    لطفاً اطلاعات زیر را ارائه دهید
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {fields.map((field: FormField) => (
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

                          {field.type === "email" && !errors[field.id] && (
                            <p className="text-xs text-muted-foreground">
                              هرگز ایمیل شما را با کسی به اشتراک نخواهیم گذاشت.
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Submit Button */}
                      <div className="pt-6 border-t">
                        <Button
                          type="submit"
                          className="w-full"
                          size="lg"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              در حال ارسال...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              ارسال پاسخ
                            </>
                          )}
                        </Button>

                        <div className="mt-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            {fields.filter((f) => f.required).length > 0 ? (
                              <>
                                <span className="text-red-500">*</span> فیلدهای
                                الزامی
                                {" • "}
                                {fields.filter((f) => f.required).length}{" "}
                                فیلد الزامی
                              </>
                            ) : (
                              "تمام فیلدها اختیاری هستند"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </form>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">فرم خالی</h3>
                  <p className="text-muted-foreground mb-4">
                    این فرم هیچ فیلدی برای ارسال ندارد.
                  </p>
                  <Button onClick={() => navigate(`/responses/${id}`)} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    بازگشت به فهرست پاسخ ها
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Form Info Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                این فرم توسط FormBuilder پشتیبانی می‌شود • پاسخ‌های شما امن و خصوصی هستند
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}