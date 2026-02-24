import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PencilIcon } from "lucide-react";
import type { Workflow } from "../../../../src/types/workflow";
import EditWorkflowInformationForm from "../edit-workflow-information-form";
import type { Form as FormType } from "@/types/form";
import { supabaseService } from "@/services/supabase";
import { Link } from "react-router-dom";

interface InformationTabProps {
  workflow: Workflow;
}

const statusMap: Record<string, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  draft: "پیش نویس",
};

export function InformationTab({ workflow }: InformationTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [forms, setForms] = useState<FormType[]>([]);
  const [workflowData, setWorkflowData] = useState<Workflow>(workflow);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    const forms = await supabaseService.getForms();
    setForms(forms);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = (updatedData: Workflow) => {
    setIsEditing(false);
    setWorkflowData(updatedData);
  };

  if (isEditing) {
    return (
      <EditWorkflowInformationForm
        workflow={workflow}
        forms={forms}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>اطلاعات گردش کار</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditClick}
          aria-label="ویرایش"
        >
          <PencilIcon className="ml-2 h-4 w-4" />
          ویرایش
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            نام گردش کار
          </h3>
          <p className="text-base">{workflowData.name}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            توضیحات
          </h3>
          <p className="text-base">
            {workflowData.description || "توضیحاتی ثبت نشده است"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            فرم ماشه
          </h3>
          {workflowData.trigger_form ? (
            <p className="text-base">{workflowData.trigger_form.title}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-base text-muted-foreground">
                این گردش کار فرم ماشه ندارد
              </p>
              <Link
                to={`/form/generator?workflow=${workflowData.id}&type_trigger_form=true`}
                className="inline-block"
              >
                <Button variant="outline" size="sm">
                  ایجاد فرم ماشه
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            وضعیت
          </h3>
          <Badge
            variant={
              workflowData.status === "active"
                ? "default"
                : workflowData.status === "inactive"
                  ? "secondary"
                  : "outline"
            }
          >
            {statusMap[workflowData.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              تاریخ ایجاد
            </h3>
            <p className="text-base">
              {new Date(workflowData.created_at).toLocaleDateString("fa-IR")}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              آخرین بروزرسانی
            </h3>
            <p className="text-base">
              {new Date(workflowData.updated_at).toLocaleDateString("fa-IR")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}