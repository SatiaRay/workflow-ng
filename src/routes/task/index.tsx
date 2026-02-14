import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns-jalali";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  MoreVertical,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { supabaseService } from "@/services/supabase.service";

interface Task {
  id: number;
  step: {
    step_id: string;
    step_name: string;
    form_id?: number;
  };
  assigned_to: string | null;
  status: any;
  task_data: any;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  responses?: Array<{
    id: number;
    data: any;
    created_at: string;
    created_by: string;
    form_id?: number;
  }>;
}

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
}

interface TaskFilters {
  status: string;
  search: string;
  formId: string;
  dateFrom: string;
  dateTo: string;
  type: "all" | "assigned" | "submitted";
}

export default function TaskIndex() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    search: "",
    formId: "all",
    dateFrom: "",
    dateTo: "",
    type: "all",
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load tasks when pagination or filters change
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [pagination.page, filters, user]);

  const loadInitialData = async () => {
    try {
      // Load forms for filter
      const formsData = await supabaseService.forms.getForms();
      setForms(formsData);

      // Load profiles for user info
      const profilesResponse = await supabaseService.users.getProfiles(1, 100);
      setUsers(profilesResponse.data);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("بارگذاری اطلاعات اولیه ناموفق بود");
    }
  };

  const loadTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let assignedTasks = { data: [], total: 0 };
      let submittedTasks = { data: [], total: 0 };

      // Load tasks based on type filter
      if (filters.type === "all" || filters.type === "assigned") {
        assignedTasks = await supabaseService.tasks.getTasksByAssignee(
          user.id,
          1,
          1000,
          filters
        );
        console.log("Assigned tasks:", assignedTasks.data);
      }

      if (filters.type === "all" || filters.type === "submitted") {
        submittedTasks = await supabaseService.tasks.getTasksBySubmitter(
          user.id,
          1,
          1000,
          filters
        );
        console.log("Submitted tasks:", submittedTasks.data);
      }

      // Merge and deduplicate tasks
      const allTasks = [...assignedTasks.data, ...submittedTasks.data];
      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );

      console.log("Unique tasks with responses:", uniqueTasks.map(t => ({
        id: t.id,
        responses: t.responses?.map(r => ({
          id: r.id,
          created_by: r.created_by,
          created_at: r.created_at
        }))
      })));

      // Sort by created_at descending
      const sortedTasks = uniqueTasks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply pagination manually
      const start = (pagination.page - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      const paginatedTasks = sortedTasks.slice(start, end);

      setTasks(paginatedTasks);
      setPagination({
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: sortedTasks.length,
        totalPages: Math.ceil(sortedTasks.length / pagination.pageSize),
      });
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("بارگذاری وظایف ناموفق بود");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await supabaseService.tasks.updateTaskStatus(taskId, newStatus);

      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: {
                ...(typeof task.status === 'object' ? task.status : {}),
                status: newStatus,
              },
              updated_at: new Date().toISOString(),
              ...(newStatus === "completed" && { completed_at: new Date().toISOString() })
            }
          : task
      ));

      toast.success("وضعیت وظیفه با موفقیت تغییر کرد");
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("تغییر وضعیت وظیفه ناموفق بود");
    }
  };

  const handleTaskClick = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      search: "",
      formId: "all",
      dateFrom: "",
      dateTo: "",
      type: "all",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status: any) => {
    if (!status) return null;
    
    if (typeof status === 'string') {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
          {status}
        </Badge>
      );
    }

    const backgroundColor = status.color || status.statusColor || '#6b7280';
    const textColor = '#fff';
    
    return (
      <Badge
        style={{
          backgroundColor,
          color: textColor,
          borderColor: backgroundColor,
        }}
        className="border"
      >
        {status.label || status.statusLabel || status.status || 'وضعیت'}
      </Badge>
    );
  };


  const getStepTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; color: string }> = {
      'fill-form': { label: 'فرم', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
      'assign-task': { label: 'تخصیص', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      'change-status': { label: 'تغییر وضعیت', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
      'condition': { label: 'شرط', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      'start': { label: 'شروع', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'end': { label: 'پایان', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };

    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };

    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    );
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "سیستم";
    const profile = users.find((u) => u.id === userId);
    return profile?.name || profile?.full_name || profile?.email || userId;
  };

  const getTaskCreator = (task: Task): string => {
    // Creator is the user who submitted the first response (trigger form)
    if (task.responses && task.responses.length > 0) {
      // Responses are already sorted by created_at from the service
      console.log(`Task ${task.id} first response creator:`, task.responses[0].created_by);
      return task.responses[0].created_by;
    }
    console.log(`Task ${task.id} has no responses, creator is system`);
    return "سیستم";
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

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "yyyy/MM/dd");
    } catch {
      return date;
    }
  };

  const renderTaskGrid = () => (
    <div className="space-y-6">

      {/* Tasks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="w-full">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-medium mb-2">وظیفه‌ای وجود ندارد</h3>
              <p className="text-sm text-center text-muted-foreground">
                هیچ وظیفه‌ای برای نمایش وجود ندارد
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task, index) => {
              const isAssigned = task.assigned_to === user?.id;
              const hasUserResponse = task.responses?.some(r => r.created_by === user?.id);
              const taskCreator = getTaskCreator(task);
              
              return (
                <Card
                  key={task.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
                  onClick={() => handleTaskClick(task)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {(pagination.page - 1) * pagination.pageSize + index + 1}
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-base line-clamp-1">
                            {task.step?.step_name || 'بدون عنوان'}
                          </CardTitle>
                          <div className="flex items-center gap-1 flex-wrap">
                            {getStepTypeBadge(task.step?.step_name)}
                          </div>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleTaskClick(task)}>
                              <Eye className="h-4 w-4 ml-2" />
                              مشاهده جزئیات
                            </DropdownMenuItem>
                            {isAssigned && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>تغییر وضعیت</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(task.id, "in_progress")}
                                >
                                  <Loader2 className="h-4 w-4 ml-2 text-blue-500" />
                                  شروع انجام
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(task.id, "completed")}
                                >
                                  <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />
                                  تکمیل
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(task.id, "on_hold")}
                                >
                                  <Clock className="h-4 w-4 ml-2 text-orange-500" />
                                  توقف موقت
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4 flex-1">
                    <div className="space-y-3">
                      {/* Task Summary */}
                      {task.task_data?.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.task_data.summary}
                        </p>
                      )}

                      {/* Form Info */}
                      {task.step?.form_id && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">
                            فرم: {task.step.form_id}
                          </span>
                        </div>
                      )}

                      {/* Response Count */}
                      {task.responses && task.responses.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{task.responses.length} پاسخ</span>
                        </div>
                      )}

                      {/* Creator/Assignee Info */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {isAssigned
                              ? getInitials(getUserName(taskCreator))
                              : getInitials(getUserName(task.assigned_to))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            {isAssigned ? "ایجاد شده توسط" : "واگذار شده به"}
                          </span>
                          <span className="text-sm font-medium line-clamp-1">
                            {isAssigned
                              ? getUserName(taskCreator)
                              : getUserName(task.assigned_to)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task.status)}
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-muted-foreground">
                نمایش {(pagination.page - 1) * pagination.pageSize + 1} تا{" "}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} از {pagination.total} وظیفه
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronRight className="h-4 w-4 ml-1" />
                  قبلی
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  بعدی
                  <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">کارتابل وظایف</h1>
          <p className="text-muted-foreground">
            مدیریت و پیگیری تمام وظایف (ارسالی و دریافتی)
          </p>
        </div>

        {/* Single Tab View */}
        <div className="space-y-6">
          {renderTaskGrid()}
        </div>
      </div>
    </div>
  );
}