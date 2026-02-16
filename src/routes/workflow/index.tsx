import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  BarChart3,
  FileText,
  Calendar,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseService } from "@/services/supabase.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteWorkflowConfirmation from "@/components/delete-workflow-confirmation";
import type { Workflow } from "@/types/workflow";

interface Form {
  id: number;
  title: string;
}

export default function WorkflowsIndex() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [forms, setForms] = useState<Form[]>([]);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    trigger_form_id: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const pageSizes = [10, 25, 50, 100];

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);

  // Load forms for create dialog
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

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supabaseService.getWorkflows(
        currentPage,
        pageSize,
      );

      setWorkflows(result.data);
      setTotalCount(result.total);
    } catch (error: any) {
      console.error("Error fetching workflows:", error);
      toast.error(`بارگذاری گردش‌کارها ناموفق بود: ${error.message}`);
      setWorkflows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Fetch when filters/pagination change
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

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
      // Create workflow with empty schema
      const workflowData = {
        name: newWorkflow.name,
        description: newWorkflow.description || null,
        trigger_form_id: parseInt(newWorkflow.trigger_form_id),
        schema: { nodes: [], edges: [] },
        status: 'draft',
      };

      const createdWorkflow = await supabaseService.createWorkflow(workflowData);

      toast.success("گردش کار با موفقیت ایجاد شد");
      
      // Close dialog and reset form
      setCreateDialogOpen(false);
      setNewWorkflow({
        name: "",
        description: "",
        trigger_form_id: "",
      });
      setFormErrors({});

      // Navigate to the new workflow detail page
      navigate(`/workflows/${createdWorkflow.id}`);
      
      // Refresh the list
      fetchWorkflows();
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

  const handleStatusToggle = async (workflow: Workflow) => {
    if (workflow.status === 'archived') {
      toast.error("گردش‌کار بایگانی شده را نمی‌توان فعال/غیرفعال کرد");
      return;
    }

    setTogglingId(workflow.id);
    try {
      const updatedWorkflow = await supabaseService.toggleWorkflowStatus(
        workflow.id,
        workflow.status
      );

      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id ? updatedWorkflow : w
      ));

      const action = updatedWorkflow.status === 'active' ? 'فعال' : 'غیرفعال';
      toast.success(`گردش‌کار با موفقیت ${action} شد`);
    } catch (error: any) {
      console.error("Error toggling workflow status:", error);
      toast.error(`تغییر وضعیت گردش‌کار ناموفق بود: ${error.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await supabaseService.deleteWorkflow(id);

      setWorkflows(prev => prev.filter(w => w.id !== id));
      setTotalCount(prev => prev - 1);

      toast.success("گردش‌کار با موفقیت حذف شد");
    } catch (error: any) {
      console.error("Error deleting workflow:", error);
      toast.error(`حذف گردش‌کار ناموفق بود: ${error.message}`);
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const openDeleteDialog = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setWorkflowToDelete(null);
  };

  const confirmDelete = () => {
    if (workflowToDelete) {
      handleDelete(workflowToDelete.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            <Play className="w-3 h-3 ml-1" />
            فعال
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            <FileText className="w-3 h-3 ml-1" />
            پیش‌نویس
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Pause className="w-3 h-3 ml-1" />
            غیرفعال
          </Badge>
        );
      case 'archived':
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

  const getTotalInstances = (workflow: Workflow) => {
    return (workflow.active_instances || 0) + (workflow.completed_instances || 0);
  };

  if (loading && !workflows.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">مدیریت گردش‌کارها</h1>
            <p className="text-muted-foreground mt-1">
              طراحی و مدیریت فرآیندهای اتوماتیک کسب‌وکار
            </p>
          </div>

          {/* Create Workflow Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">
                <Plus className="w-4 h-4 ml-2" />
                ایجاد گردش‌کار جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>ایجاد گردش کار جدید</DialogTitle>
                <DialogDescription>
                  اطلاعات اولیه گردش کار را وارد کنید. پس از ایجاد، می‌توانید فرآیند را طراحی کنید.
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
                      setNewWorkflow(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) {
                        setFormErrors(prev => {
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
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
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
                      setNewWorkflow(prev => ({ ...prev, trigger_form_id: value }));
                      if (formErrors.trigger_form_id) {
                        setFormErrors(prev => {
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
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={creating}
                >
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
        </div>

        {/* Workflows Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>لیست گردش‌کارها</CardTitle>
                <CardDescription>
                  {workflows.length === 0
                    ? "گردش‌کاری یافت نشد"
                    : `نمایش ${workflows.length} از ${totalCount} گردش‌کار`}
                </CardDescription>
              </div>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      سطر در هر صفحه:
                    </span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pageSizes.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <span className="px-3 text-sm">
                      صفحه {currentPage} از {Math.ceil(totalCount / pageSize)}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(Math.ceil(totalCount / pageSize), prev + 1),
                        )
                      }
                      disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage(Math.ceil(totalCount / pageSize))
                      }
                      disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {workflows.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">گردش‌کاری یافت نشد</h3>
                <p className="text-muted-foreground mb-4">
                  اولین گردش کار خود را ایجاد کنید
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  ایجاد گردش کار جدید
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام گردش‌کار</TableHead>
                      <TableHead className="text-right">فرم ماشه</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">نمونه‌ها</TableHead>
                      <TableHead className="text-right">تاریخ ایجاد</TableHead>
                      <TableHead className="w-32 text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell>
                          <div className="font-medium">{workflow.name}</div>
                          {workflow.description && (
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {workflow.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span>{workflow.form?.title || 'بدون فرم'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {workflow.trigger_form_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(workflow.status)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
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
                            <div className="text-xs text-muted-foreground">
                              مجموع: {getTotalInstances(workflow)} نمونه
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatDate(workflow.created_at)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {workflow.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                              
                              <DropdownMenuItem
                                onClick={() => navigate(`/workflows/${workflow.id}`)}
                              >
                                <Eye className="w-4 h-4 ml-2" />
                                مشاهده جزئیات
                              </DropdownMenuItem>

                              {workflow.status === 'draft' && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                                >
                                  <Edit className="w-4 h-4 ml-2" />
                                  طراحی فرآیند
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {workflow.status !== 'archived' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusToggle(workflow)}
                                  disabled={togglingId === workflow.id}
                                >
                                  {togglingId === workflow.id ? (
                                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                  ) : workflow.status === 'active' ? (
                                    <Pause className="w-4 h-4 ml-2" />
                                  ) : (
                                    <Play className="w-4 h-4 ml-2" />
                                  )}
                                  {workflow.status === 'active' ? 'غیرفعال کردن' : 'فعال کردن'}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(workflow)}
                                disabled={deletingId === workflow.id}
                                className="text-red-600"
                              >
                                {deletingId === workflow.id ? (
                                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 ml-2" />
                                )}
                                حذف گردش‌کار
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteWorkflowConfirmation
        workflow={workflowToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}