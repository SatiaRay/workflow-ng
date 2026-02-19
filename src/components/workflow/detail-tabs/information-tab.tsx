// components/workflow/detail-tabs/information-tab.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TabsContent } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Calendar, Edit2, Save, X, Loader2, AlertCircle } from "lucide-react";
import { supabaseService } from "@/services/supabase";
import { useWorkflowDetail } from "@/context/workflow-detail-context";
import { formatDateTime } from "@/lib/utils";
import StatusBadge from "../status-badge";
import type { WorkflowStatus } from "@/types/workflow";

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
}

interface Form {
  id: number;
  title: string;
}

export const InformationTab = () => {
  const { workflow, saveWorkflow, isSaving } = useWorkflowDetail();
  const [users, setUsers] = useState<User[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Editable fields state
  const [editedName, setEditedName] = useState(workflow.name);
  const [editedDescription, setEditedDescription] = useState(workflow.description || "");
  const [editedTriggerFormId, setEditedTriggerFormId] = useState(workflow.trigger_form_id.toString());
  const [editedStatus, setEditedStatus] = useState<WorkflowStatus>(workflow.status);

  useEffect(() => {
    fetchUsers();
    fetchForms();
  }, []);

  const fetchUsers = async () => {
    try {
      const profilesResponse = await supabaseService.users.getProfiles(1, 100);
      setUsers(profilesResponse.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchForms = async () => {
    try {
      const formsData = await supabaseService.forms.getForms();
      setForms(formsData);
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  };

  const getUserName = (userId: string | undefined) => {
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

  const handleEdit = () => {
    setSaveError(null);
    setValidationError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedName(workflow.name);
    setEditedDescription(workflow.description || "");
    setEditedTriggerFormId(workflow.trigger_form_id.toString());
    setEditedStatus(workflow.status);
    setSaveError(null);
    setValidationError(null);
    setIsEditing(false);
  };

  const validateForm = (): boolean => {
    if (!editedName.trim()) {
      setValidationError("نام گردش کار نمی‌تواند خالی باشد");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaveError(null);
    
    const success = await saveWorkflow({
      name: editedName,
      description: editedDescription || null,
      trigger_form_id: parseInt(editedTriggerFormId),
      status: editedStatus,
    });

    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <TabsContent value="information" className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>اطلاعات پایه</CardTitle>
            <CardDescription>مشخصات اصلی گردش کار</CardDescription>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
              disabled={isSaving}
            >
              <Edit2 className="h-4 w-4" />
              ویرایش
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                انصراف
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                ذخیره
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Field - Editable */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">نام گردش کار</div>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    value={editedName}
                    onChange={(e) => {
                      setEditedName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="نام گردش کار"
                    disabled={isSaving}
                    className={validationError ? "border-red-500" : ""}
                  />
                  {validationError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="font-medium">{workflow.name}</div>
              )}
            </div>

            {/* Status Field - Editable */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">وضعیت</div>
              {isEditing ? (
                <Select
                  value={editedStatus}
                  onValueChange={(value: WorkflowStatus) => setEditedStatus(value)}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">پیش‌نویس</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                    <SelectItem value="archived">بایگانی</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <StatusBadge status={workflow.status} />
                </div>
              )}
            </div>

            {/* Description Field - Editable */}
            {(workflow.description || isEditing) && (
              <div className="col-span-2 space-y-1">
                <div className="text-sm text-muted-foreground">توضیحات</div>
                {isEditing ? (
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="توضیحات گردش کار"
                    rows={3}
                    disabled={isSaving}
                  />
                ) : (
                  <div className="text-sm whitespace-pre-wrap">
                    {workflow.description}
                  </div>
                )}
              </div>
            )}

            {/* Trigger Form Field - Editable */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">فرم ماشه</div>
              {isEditing ? (
                <Select
                  value={editedTriggerFormId}
                  onValueChange={setEditedTriggerFormId}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب فرم ماشه" />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map((form) => (
                      <SelectItem key={form.id} value={form.id.toString()}>
                        {form.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{workflow.form?.title || "فرم نامشخص"}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                شناسه: {workflow.trigger_form_id}
              </div>
            </div>

            {/* Created By - Read Only */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                ایجاد شده توسط
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(getUserName(workflow.created_by))}
                  </AvatarFallback>
                </Avatar>
                <span>{getUserName(workflow.created_by)}</span>
              </div>
            </div>

            {/* Created At - Read Only */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">تاریخ ایجاد</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateTime(workflow.created_at)}</span>
              </div>
            </div>

            {/* Updated At - Read Only */}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                آخرین به‌روزرسانی
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateTime(workflow.updated_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};