import type { Form } from "@/types/form";
import { supabaseService } from "@/services/supabase.service";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface CreateWorkflowDialogProps {
  onCreated?: () => void;
}

export default function CreateWorkflowDialog({
  onCreated,
}: CreateWorkflowDialogProps) {
  const navigate = useNavigate();

  const [forms, setForms] = useState<Form[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    trigger_form_id: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const formsData = await supabaseService.forms.getForms();
      setForms(formsData);
    } catch (error) {
      console.error("Error loading forms:", error);
      toast.error("بارگذاری لیست فرم‌ها ناموفق بود");
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newWorkflow.name.trim()) {
      errors.name = "نام گردش کار الزامی است";
    }

    if (!newWorkflow.trigger_form_id) {
      errors.trigger_form_id = "انتخاب فرم ماشه الزامی است";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateWorkflow = async () => {
    if (!validateForm()) {
      return;
    }

    setCreating(true);
    try {
      const workflowData = {
        name: newWorkflow.name,
        description: newWorkflow.description || undefined,
        trigger_form_id: parseInt(newWorkflow.trigger_form_id),
        schema: { nodes: [], edges: [] },
        status: "draft",
      };

      const createdWorkflow =
        await supabaseService.createWorkflow(workflowData);

      toast.success("گردش کار با موفقیت ایجاد شد");

      // Close dialog and reset form
      setCreateDialogOpen(false);
      setNewWorkflow({
        name: "",
        description: "",
        trigger_form_id: "",
      });
      setFormErrors({});

      navigate(`/workflows/${createdWorkflow.id}`);

      onCreated?.();
    } catch (error: any) {
      console.error("Error creating workflow:", error);

      let errorMessage = "ایجاد گردش کار ناموفق بود";
      if (error.message?.includes("unique constraint")) {
        errorMessage = "گردش کاری با این نام از قبل وجود دارد";
      } else {
        errorMessage = error.message || errorMessage;
      }

      setFormErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="w-4 h-4 ml-2" />
          ایجاد گردش‌کار جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>ایجاد گردش کار جدید</DialogTitle>
          <DialogDescription>
            اطلاعات اولیه گردش کار را وارد کنید. پس از ایجاد، می‌توانید فرآیند
            را طراحی کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {formErrors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formErrors.general}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              نام گردش کار <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={newWorkflow.name}
              onChange={(e) => {
                setNewWorkflow((prev) => ({ ...prev, name: e.target.value }));
                if (formErrors.name) {
                  setFormErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.name;
                    return newErrors;
                  });
                }
              }}
              placeholder="مثال: فرآیند تایید درخواست"
              disabled={creating}
            />
            {formErrors.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={newWorkflow.description}
              onChange={(e) =>
                setNewWorkflow((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="توضیحی کوتاه درباره هدف و عملکرد این گردش کار"
              rows={3}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger_form_id">
              فرم ماشه <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newWorkflow.trigger_form_id}
              onValueChange={(value) => {
                setNewWorkflow((prev) => ({ ...prev, trigger_form_id: value }));
                if (formErrors.trigger_form_id) {
                  setFormErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.trigger_form_id;
                    return newErrors;
                  });
                }
              }}
              disabled={creating}
            >
              <SelectTrigger id="trigger_form_id">
                <FileText className="w-4 h-4 ml-2" />
                <SelectValue placeholder="انتخاب فرم ماشه" />
              </SelectTrigger>
              <SelectContent>
                {forms.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    فرمی موجود نیست
                  </div>
                ) : (
                  forms.map((form) => (
                    <SelectItem key={form.id} value={form.id.toString()}>
                      {form.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {formErrors.trigger_form_id && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.trigger_form_id}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              این فرم هنگام ارسال، گردش کار را فعال می‌کند
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setCreateDialogOpen(false)}
            disabled={creating}
          >
            انصراف
          </Button>
          <Button onClick={handleCreateWorkflow} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال ایجاد...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 ml-2" />
                ایجاد گردش کار
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
