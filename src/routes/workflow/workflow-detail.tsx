import React, { useState, useEffect, createContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ArrowLeft,
  Menu,
  Info,
  GitBranch,
  FileText,
  Play,
  Pause,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { supabaseService } from "@/services/supabase.service";
import { Skeleton } from "@/components/ui/skeleton";
import WorkflowEditor from "@/components/workflow/diagram/workflow-editor";
import DeleteWorkflowConfirmation from "@/components/delete-workflow-confirmation";
import {
  useWorkflowDetail,
  WorkflowDetailProvider,
} from "@/context/workflow-detail-context";
import type { Workflow } from "@/types/workflow";
import { DirectionProvider } from "@/components/ui/direction";

interface WorkflowDetail {
  id: number;
  name: string;
  description?: string;
  schema: any;
  trigger_form_id: number;
  status: "draft" | "active" | "inactive" | "archived";
  active_instances: number;
  completed_instances: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  form?: {
    id: number;
    title: string;
    description?: string;
    schema?: any;
  };
}

interface Form {
  id: number;
  title: string;
  description?: string;
  schema: any;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
}

export default function WorkflowDetail() {
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  const workflowId = parseInt(id || "0");
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load workflow data
  useEffect(() => {
    if (workflowId) {
      loadWorkflowData();
    }
  }, [workflowId]);

  const loadWorkflowData = async () => {
    setLoading(true);
    try {
      // Load workflow details
      const workflowData = await supabaseService.getWorkflow(workflowId);

      if (!workflowData) {
        toast.error("گردش کار مورد نظر یافت نشد");
        navigate("/workflows");
        return;
      }

      setWorkflow(workflowData);

      // Extract all form IDs used in the workflow
      await extractUsedForms(workflowData);
    } catch (error) {
      console.error("Error loading workflow:", error);
      toast.error("بارگذاری اطلاعات گردش کار ناموفق بود");
    } finally {
      setLoading(false);
    }
  };

  // Navigation items
  const navItems = [
    { id: "information", label: "اطلاعات", icon: Info },
    { id: "diagram", label: "نمودار", icon: GitBranch },
    { id: "forms", label: "فرم‌ها", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header Skeleton */}
        <div className="lg:hidden border-b p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Desktop Layout Skeleton */}
        <div className="flex">
          {/* Sidebar Skeleton - Hidden on mobile */}
          <aside className="hidden lg:block w-64 border-l min-h-screen p-4">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-8" />
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  return (
    <WorkflowDetailProvider workflow={workflow}>
      <DirectionProvider dir="rtl">
        <div className="min-h-screen bg-background" dir="rtl">
          {/* Mobile Header */}
          <MobileNav items={navItems} />

          {/* Desktop Layout */}
          <div className="flex">
            <DesktopSidebar items={navItems} />

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-6">
              {/* Desktop Header - Hidden on mobile */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">{workflow.name}</h1>
                  {workflow.description && (
                    <p className="text-muted-foreground mt-1">
                      {workflow.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <RefreshCw className="w-3 h-3" />
                    {workflow.active_instances || 0} فعال
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {workflow.completed_instances || 0} تکمیل
                  </Badge>
                </div>
              </div>

              {/* Tab Content */}
              <WorkflowDetailTabs />

              {/* Mobile Action Buttons */}
              <div className="lg:hidden fixed bottom-4 right-4 left-4 flex gap-2">
                {workflow.status !== "archived" && <WorkflowStatusButton />}

                {/* <DeleteWorkflowConfirmation
                workflow={workflow}
                onConfirm={handleDelete}
              >
                <Button variant="destructive" className="flex-1">
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </Button>
              </DeleteWorkflowConfirmation> */}
              </div>
            </main>
          </div>
        </div>
      </DirectionProvider>
    </WorkflowDetailProvider>
  );
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const MobileNav = ({ items }: { items: NavItem[] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeTab, setActiveTab, workflow, toggleWorkflowStatus } =
    useWorkflowDetail();
  const navigate = useNavigate();

  return (
    <div className="lg:hidden border-b sticky top-0 bg-background z-10">
      <div className="flex items-center justify-between p-4">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <div className="p-4 border-b">
              <h2 className="font-semibold">{workflow.name}</h2>
              <div className="mt-2">{getStatusBadge(workflow.status)}</div>
            </div>
            <nav className="p-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-right transition-colors ${
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <h1 className="font-semibold truncate">{workflow.name}</h1>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/workflows")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

const DesktopSidebar = ({ items }: { items: NavItem[] }) => {
  const navigate = useNavigate();

  const { activeTab, setActiveTab, workflow, deleteWorkflow } =
    useWorkflowDetail();

  return (
    <aside className="hidden lg:block w-64 border-l min-h-screen bg-background sticky top-0">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">گردش کار</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/workflows")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium truncate">{workflow.name}</p>
          <div>{getStatusBadge(workflow.status)}</div>
        </div>
      </div>

      <nav className="p-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-right transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <WorkflowStatusButton />

        <DeleteWorkflowConfirmation
          workflow={workflow}
          onConfirm={deleteWorkflow}
        >
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف گردش‌کار
          </Button>
        </DeleteWorkflowConfirmation>
      </div>
    </aside>
  );
};

const WorkflowDetailTabs = ({
  setWorkflow,
}: {
  setWorkflow: (workflow: Workflow) => void;
}) => {
  const { activeTab, setActiveTab, workflow } = useWorkflowDetail();
  const [saving, setSaving] = useState(false);
  const [usedForms, setUsedForms] = useState<Form[]>([]);
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

  const formatDateTime = (date: string | null) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return date;
    }
  };

  const getTotalInstances = () => {
    if (!workflow) return 0;
    return (
      (workflow.active_instances || 0) + (workflow.completed_instances || 0)
    );
  };

  const extractUsedForms = async (workflowData: WorkflowDetail) => {
    const formIds = new Set<number>();

    // Add trigger form
    if (workflowData.trigger_form_id) {
      formIds.add(workflowData.trigger_form_id);
    }

    // Extract form_ids from workflow schema nodes
    if (workflowData.schema?.nodes) {
      workflowData.schema.nodes.forEach((node: any) => {
        // Check fill-form nodes
        if (node.type === "fill-form" && node.data?.form?.id) {
          formIds.add(node.data.form.id);
        }
        // Check condition nodes that might reference forms
        if (node.type === "condition" && node.data?.selectedForm?.id) {
          formIds.add(node.data.selectedForm.id);
        }
      });
    }

    // Fetch all forms
    const forms: Form[] = [];
    for (const formId of formIds) {
      try {
        const form = await supabaseService.forms.getFormById(formId);
        if (form) {
          forms.push(form);
        }
      } catch (error) {
        console.error(`Error loading form ${formId}:`, error);
      }
    }

    setUsedForms(forms);
  };

  const handleSchemaChange = async (schema: any) => {
    if (!workflow) return;

    setSaving(true);
    try {
      const updatedWorkflow = await supabaseService.updateWorkflow(
        workflow.id,
        {
          schema,
        },
      );

      setWorkflow(updatedWorkflow);

      // Re-extract forms if schema changed
      await extractUsedForms(updatedWorkflow);

      toast.success("تغییرات با موفقیت ذخیره شد");
    } catch (error: any) {
      console.error("Error updating workflow:", error);
      toast.error(`ذخیره تغییرات ناموفق بود: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      {/* Information Tab */}
      <TabsContent value="information" className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایه</CardTitle>
            <CardDescription>مشخصات اصلی گردش کار</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  نام گردش کار
                </div>
                <div className="font-medium">{workflow.name}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">وضعیت</div>
                <div>{getStatusBadge(workflow.status)}</div>
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

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>آمار اجرا</CardTitle>
            <CardDescription>وضعیت نمونه‌های این گردش کار</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getTotalInstances()}
                </div>
                <div className="text-sm text-muted-foreground">کل نمونه‌ها</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {workflow.active_instances || 0}
                </div>
                <div className="text-sm text-muted-foreground">فعال</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {workflow.completed_instances || 0}
                </div>
                <div className="text-sm text-muted-foreground">تکمیل شده</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Diagram Tab */}
      <TabsContent value="diagram" className="space-y-4">
        <Card>
          <CardHeader className="">
            <div className="flex items-center justify-end text-right">
              <div>
                <CardTitle>نمودار گردش کار</CardTitle>
                <CardDescription>
                  طراحی و ویرایش فرآیند گردش کار
                </CardDescription>
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
            <div className="h-[600px] border rounded-lg overflow-hidden">
              <WorkflowEditor
                onChange={handleSchemaChange}
                workflowData={workflow.schema}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Forms Tab */}
      <TabsContent value="forms" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>فرم‌های استفاده شده</CardTitle>
            <CardDescription>
              فرم‌هایی که در این گردش کار استفاده شده‌اند
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usedForms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  فرمی استفاده نشده
                </h3>
                <p className="text-muted-foreground">
                  در این گردش کار هیچ فرمی استفاده نشده است
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usedForms.map((form) => (
                  <Card key={form.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-medium">{form.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              شناسه: {form.id}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {form.schema?.fields?.length || 0} فیلد
                        </Badge>
                      </div>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {form.description}
                        </p>
                      )}
                      <div className="mt-3 text-xs text-muted-foreground">
                        ایجاد: {formatDateTime(form.created_at)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => navigate(`/forms/${form.id}`)}
                      >
                        مشاهده فرم
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

const WorkflowStatusButton = () => {
  const { workflow, toggleWorkflowStatus } = useWorkflowDetail();
  const [toggling, setToggling] = useState(false);

  const toggleStatus = async () => {
    setToggling(true);
    try {
      await toggleWorkflowStatus();
    } catch {
    } finally {
      setToggling(false);
    }
  };

  return workflow.status !== "archived" ? (
    <Button
      variant="outline"
      className="w-full justify-start"
      onClick={toggleStatus}
      disabled={toggling}
    >
      {toggling ? (
        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
      ) : workflow.status === "active" ? (
        <Pause className="h-4 w-4 ml-2" />
      ) : (
        <Play className="h-4 w-4 ml-2" />
      )}
      {workflow.status === "active" ? "غیرفعال کردن" : "فعال کردن"}
    </Button>
  ) : null;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
          <Play className="w-3 h-3 ml-1" />
          فعال
        </Badge>
      );
    case "draft":
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          <FileText className="w-3 h-3 ml-1" />
          پیش‌نویس
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <Pause className="w-3 h-3 ml-1" />
          غیرفعال
        </Badge>
      );
    case "archived":
      return (
        <Badge variant="outline" className="text-gray-400 border-gray-300">
          <AlertCircle className="w-3 h-3 ml-1" />
          بایگانی
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
