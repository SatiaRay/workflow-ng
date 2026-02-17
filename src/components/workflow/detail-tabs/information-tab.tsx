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
import { FileText, Calendar } from "lucide-react";
import { supabaseService } from "@/services/supabase.service";
import { useWorkflowDetail } from "@/context/workflow-detail-context";
import { formatDateTime } from "@/lib/utils";
import StatusBadge from "../status-badge";

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
}

export const InformationTab = () => {
  const { workflow } = useWorkflowDetail();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const profilesResponse = await supabaseService.users.getProfiles(1, 100);

    setUsers(profilesResponse.data);
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

  return (
    <TabsContent value="information" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات پایه</CardTitle>
          <CardDescription>مشخصات اصلی گردش کار</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">نام گردش کار</div>
              <div className="font-medium">{workflow.name}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">وضعیت</div>
              <div>
                <StatusBadge status={workflow.status} />
              </div>
            </div>

            {workflow.description && (
              <div className="col-span-2 space-y-1">
                <div className="text-sm text-muted-foreground">توضیحات</div>
                <div className="text-sm whitespace-pre-wrap">
                  {workflow.description}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">فرم ماشه</div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{workflow.form?.title || "فرم نامشخص"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                شناسه: {workflow.trigger_form_id}
              </div>
            </div>

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

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">تاریخ ایجاد</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateTime(workflow.created_at)}</span>
              </div>
            </div>

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
