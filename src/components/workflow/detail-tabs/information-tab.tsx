import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PencilIcon } from "lucide-react";
import type { Workflow } from "../../../../src/types/workflow";

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

  const handleEditClick = () => {
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ویرایش مشخصات گردش کار</CardTitle>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
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
          <p className="text-base">{workflow.name}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            توضیحات
          </h3>
          <p className="text-base">
            {workflow.description || "توضیحاتی ثبت نشده است"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
              فرم ماشه
          </h3>
          <p className="text-base">
            {workflow.trigger_form.title || "فرم ماشه ندارد"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            وضعیت
          </h3>
          <Badge
            variant={
              workflow.status === "active"
                ? "default"
                : workflow.status === "inactive"
                  ? "secondary"
                  : "outline"
            }
          >
            {statusMap[workflow.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              تاریخ ایجاد
            </h3>
            <p className="text-base">
              {new Date(workflow.created_at).toLocaleDateString("fa-IR")}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              آخرین بروزرسانی
            </h3>
            <p className="text-base">
              {new Date(workflow.updated_at).toLocaleDateString("fa-IR")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
