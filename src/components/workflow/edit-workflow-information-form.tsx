import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Workflow } from "../../../src/types/workflow";
import type { Form } from "../../../src/types/form";
import { supabaseService } from "@/services/supabase";
import { Spinner } from "../ui/spinner";

interface EditWorkflowInformationFormProps {
  workflow: Workflow;
  onSave?: (workflow: Workflow) => void;
  onCancel?: () => void;
}

const statusMap: Record<string, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  draft: "پیش نویس",
};

export default function EditWorkflowInformationForm({
  workflow,
  onSave,
  onCancel,
}: EditWorkflowInformationFormProps) {
  const [formData, setFormData] = useState({
    name: workflow.name,
    description: workflow.description || "",
    triggerFormId: workflow.trigger_form?.id || "",
    status: workflow.status,
  });

  const [forms, setForms] = useState<Form[]>([]);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    const forms = await supabaseService.getWorkflowForms(workflow.id);
    setForms(forms);
  };

  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleTriggerFormChange = (value: string) => {
    setFormData((prev) => ({ ...prev, triggerFormId: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as Workflow["status"] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onSave) {
      const selectedForm = forms.find(
        (f) => f.id === Number(formData.triggerFormId),
      );

      const updatedWorkflow: Workflow = {
        ...workflow,
        name: formData.name,
        description: formData.description || null,
        trigger_form: selectedForm || workflow.trigger_form,
        status: formData.status as Workflow["status"],
      };

      setIsUpdating(true);

      await supabaseService.updateWorkflow(workflow.id, updatedWorkflow);

      onSave(updatedWorkflow);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ویرایش مشخصات گردش کار</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">نام گردش کار</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="نام گردش کار را وارد کنید"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="توضیحات گردش کار را وارد کنید"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggerForm">فرم ماشه</Label>
            <Select
              value={formData.triggerFormId.toString()}
              onValueChange={handleTriggerFormChange}
              data-testid="form-select"
            >
              <SelectTrigger
                id="triggerForm"
                aria-label={formData.triggerFormId.toString()}
                data-testid="form-trigger"
              >
                <SelectValue placeholder="فرم ماشه را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id.toString()}>
                    {form.title} (شناسه: {form.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">وضعیت</Label>
            <Select
              value={formData.status}
              onValueChange={handleStatusChange}
              data-testid="status-select"
            >
              <SelectTrigger
                id="status"
                aria-label={formData.status}
                data-testid="status-trigger"
              >
                <SelectValue placeholder="وضعیت را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
                <SelectItem value="draft">پیش نویس</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-6">
          <Button type="button" variant="outline" onClick={handleCancel}>
            انصراف
          </Button>
          <Button type="submit">{isUpdating ? <Spinner /> : "ذخیره"}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
