import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import WorkflowEditor from "@/components/workflow/diagram/workflow-editor";
import { useWorkflowDetail } from "@/context/workflow-detail-context";

const DiagramTab = () => {
  const { workflow } = useWorkflowDetail();
  const [saving, setSaving] = useState(false);

  return (
    <TabsContent value="diagram" className="space-y-4">
      <Card>
        <CardHeader className="">
          <div className="flex items-center justify-end text-right">
            <div>
              <CardTitle>نمودار گردش کار</CardTitle>
              <CardDescription>طراحی و ویرایش فرآیند گردش کار</CardDescription>
            </div>
            {/* {saving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال ذخیره...
                </div>
              )} */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-150 border rounded-lg overflow-hidden">
            <WorkflowEditor
              onChange={() => {}}
              workflowData={workflow.schema}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default DiagramTab;
