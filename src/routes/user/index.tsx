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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  X,
  Pencil,
  UserPlus,
  Mail,
  Phone,
  User,
  MoreVertical,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  is_active: boolean;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  created_at: string;
  updated_at?: string;
}

interface FilterState {
  search: string;
  role: string;
  status: string;
}

const roleOptions = [
  { value: "all", label: "همه نقش‌ها" },
  { value: "admin", label: "مدیر سیستم" },
  { value: "user", label: "کاربر عادی" },
  { value: "editor", label: "ویرایشگر" },
  { value: "viewer", label: "بیننده" },
];

const statusOptions = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
  { value: "unconfirmed", label: "تایید نشده" },
];

export default function UsersIndex() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    role: "all",
    status: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const pageSizes = [10, 25, 50, 100];

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supabaseService.getProfiles(currentPage, pageSize);

      setUsers(result.data);
      setTotalCount(result.total);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(`بارگذاری کاربران ناموفق بود: ${error.message}`);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  // Initial fetch and fetch when filters/pagination change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      role: "all",
      status: "all",
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return { variant: "destructive" as const, label: "مدیر" };
      case "editor":
        return { variant: "default" as const, label: "ویرایشگر" };
      case "viewer":
        return { variant: "outline" as const, label: "بیننده" };
      default:
        return { variant: "secondary" as const, label: "کاربر" };
    }
  };

  if (loading && !users.length) {
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
              <Skeleton className="h-10 w-full mb-4" />
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
            <h1 className="text-3xl font-bold">مدیریت کاربران</h1>
            <div className="flex items-center gap-4 mt-1">
              <Badge variant="outline" className="gap-1">
                <User className="w-3 h-3" />
                {totalCount} کاربر در مجموع
              </Badge>
              {(filters.search ||
                filters.role !== "all" ||
                filters.status !== "all") && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="w-3 h-3" />
                  {users.length} نمایش
                </Badge>
              )}
            </div>
          </div>

          <Button
            className="cursor-pointer"
            onClick={() => navigate("/users/create")}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            ایجاد کاربر جدید
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو بر اساس نام، ایمیل یا شماره تماس..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="pr-9"
                    dir="rtl"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showFilters ? "default" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="whitespace-nowrap"
                  >
                    <Filter className="w-4 h-4 ml-2" />
                    {showFilters ? "پنهان کردن فیلترها" : "نمایش فیلترها"}
                  </Button>
                  {(filters.search ||
                    filters.role !== "all" ||
                    filters.status !== "all") && (
                    <Button variant="ghost" onClick={clearFilters} size="icon">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Dynamic Filters Panel */}
              {showFilters && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-4">فیلتر پیشرفته</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-filter" className="text-sm">
                        نقش
                      </Label>
                      <Select
                        value={filters.role}
                        onValueChange={(value) =>
                          handleFilterChange("role", value)
                        }
                      >
                        <SelectTrigger id="role-filter" className="w-full">
                          <SelectValue placeholder="همه نقش‌ها" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status-filter" className="text-sm">
                        وضعیت
                      </Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) =>
                          handleFilterChange("status", value)
                        }
                      >
                        <SelectTrigger id="status-filter" className="w-full">
                          <SelectValue placeholder="همه وضعیت‌ها" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>لیست کاربران</CardTitle>
                <CardDescription>
                  {users.length === 0
                    ? "کاربری یافت نشد"
                    : `نمایش ${users.length} از ${totalCount} کاربر`}
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
            {users.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">کاربری یافت نشد</h3>
                <p className="text-muted-foreground mb-4">
                  {loading
                    ? "در حال بارگذاری کاربران..."
                    : "هیچ کاربری مطابق با فیلترهای فعلی یافت نشد."}
                </p>
                {!loading &&
                  (filters.search ||
                    filters.role !== "all" ||
                    filters.status !== "all") && (
                    <Button variant="outline" onClick={clearFilters}>
                      پاک کردن فیلترها
                    </Button>
                  )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center"></TableHead>
                      <TableHead className="text-right">کاربر</TableHead>
                      <TableHead className="text-right">اطلاعات تماس</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>
                                {getInitials(user.name || user.email)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {user.name || "نامشخص"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.id.substring(0, 8)}...
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>

                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* <DeleteUserConfirmation
        user={userToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setUserToDelete(null)}
      /> */}
    </div>
  );
}
