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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { supabaseService } from "@/services/supabase.service";

interface Task {
  id: number;
  step: {
    id: string;
    type: string;
    label: string;
    form_id?: number;
    role_id?: number;
  };
  assigned_to: string | null;
  created_by: string | null;
  status: any; // Dynamic status object from database
  form_id: number | null;
  task_data: any;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  form?: {
    id: number;
    title: string;
  };
  responses?: Array<{
    id: number;
    data: any;
    created_at: string;
    created_by: string;
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
}

export default function TaskIndex() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("assigned");
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
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load tasks when tab or pagination changes
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [activeTab, pagination.page, filters, user]);

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
      let response;

      if (activeTab === "assigned") {
        response = await supabaseService.tasks.getTasksByAssignee(
          user.id,
          pagination.page,
          pagination.pageSize,
          filters
        );
      } else {
        response = await supabaseService.tasks.getTasksBySubmitter(
          user.id,
          pagination.page,
          pagination.pageSize,
          filters
        );
      }

      setTasks(response.data);
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        total: response.total,
        totalPages: response.totalPages,
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

      // Update local state - preserve status object structure
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: {
                ...(typeof task.status === 'object' ? task.status : {}),
                status: newStatus,
                ...(newStatus === "completed" && { completed_at: new Date().toISOString() })
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
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get status badge directly from the status object
  const getStatusBadge = (status: any) => {
    if (!status) return null;
    
    // If it's a string (fallback), use default styling
    if (typeof status === 'string') {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
          {status}
        </Badge>
      );
    }

    // Use the status object directly from the database
    const backgroundColor = status.color || status.statusColor || '#6b7280';
    // Ensure text is readable on colored background
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

  const getCreatorName = (userId: string | null) => {
    if (!userId) return "سیستم";
    const creator = users.find((u) => u.id === userId);
    return creator?.name || creator?.full_name || creator?.email || userId;
  };

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return "واگذار نشده";
    const assignee = users.find((u) => u.id === userId);
    return assignee?.name || assignee?.full_name || assignee?.email || userId;
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
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجوی وظایف..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pr-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-accent" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
              {(filters.status !== "all" || filters.formId !== "all" || filters.dateFrom || filters.dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                >
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTasks}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`} />
              بروزرسانی
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <Label className="text-xs">وضعیت</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه وضعیت‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="in_progress">در حال انجام</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                    <SelectItem value="on_hold">متوقف شده</SelectItem>
                    <SelectItem value="waiting">در انتظار تایید</SelectItem>
                    <SelectItem value="approved">تایید شده</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">فرم</Label>
                <Select
                  value={filters.formId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, formId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه فرم‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه فرم‌ها</SelectItem>
                    {forms.map((form) => (
                      <SelectItem key={form.id} value={form.id.toString()}>
                        {form.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">از تاریخ</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              <div>
                <Label className="text-xs">تا تاریخ</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              {activeTab === "assigned" ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">وظیفه‌ای وجود ندارد</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    وظیفه‌ای به شما واگذار نشده است
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Send className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">وظیفه‌ای وجود ندارد</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    هیچ وظیفه‌ای ثبت نکرده‌اید
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task, index) => (
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
                          {task.step?.label || 'بدون عنوان'}
                        </CardTitle>
                        {getStepTypeBadge(task.step?.type)}
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
                          {activeTab === "assigned" && (
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
                    {task.form && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">
                          {task.form.title}
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

                    {/* Assignee/Creator Info */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {activeTab === "assigned"
                            ? getInitials(getCreatorName(task.created_by))
                            : getInitials(getAssigneeName(task.assigned_to))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {activeTab === "assigned" ? "واگذار شده توسط" : "واگذار شده به"}
                        </span>
                        <span className="text-sm font-medium line-clamp-1">
                          {activeTab === "assigned"
                            ? getCreatorName(task.created_by)
                            : getAssigneeName(task.assigned_to)}
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
            ))}
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
            مدیریت و پیگیری وظایف واگذار شده و ثبت شده
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir="rtl">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              وظایف واگذار شده
            </TabsTrigger>
            <TabsTrigger value="submitted" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              وظایف ثبت شده
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-6">
            {renderTaskGrid()}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-6">
            {renderTaskGrid()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}