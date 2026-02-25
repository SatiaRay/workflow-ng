// components/workflow/detail-tabs/diagram-tab.tsx
import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Loader2, AlertCircle } from "lucide-react";
import WorkflowEditor from "@/components/workflow/diagram/workflow-editor";
import { useWorkflowDetail } from "@/context/workflow-detail-context";

const DiagramTab = () => {
  const { workflow, saveWorkflow, isSaving } = useWorkflowDetail();
  const [schema, setSchema] = useState(workflow.schema);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSchemaChange = useCallback((newSchema: any) => {
    setSchema(newSchema);
    setHasChanges(true);
    setSaveError(null);
  }, []);

  const handleSave = async () => {
    setSaveError(null);
    try {
      const success = await saveWorkflow({ schema });

      if (success) {
        setHasChanges(false);
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "خطا در ذخیره سازی",
      );
    }
  };

  return (
    <TabsContent value="diagram" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>نمودار گردش کار</CardTitle>
              <CardDescription>طراحی و ویرایش فرآیند گردش کار</CardDescription>
            </div>
            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                ذخیره تغییرات
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {saveError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          <div className="h-150 border rounded-lg overflow-hidden">
            <WorkflowEditor workflow={workflow} onChange={handleSchemaChange} />
          </div>
        </CardContent>
        {hasChanges && (
          <CardFooter className="flex justify-end border-t pt-4">
            <div className="text-sm text-muted-foreground">
              تغییرات ذخیره نشده وجود دارد
            </div>
          </CardFooter>
        )}
      </Card>
    </TabsContent>
  );
};

export default DiagramTab;
