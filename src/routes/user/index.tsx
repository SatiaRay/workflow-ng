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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserPlus,
  Mail,
  Phone,
  User,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseService } from "@/services/supabase.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import the User type from user-service
import type { User as UserType } from "@/services/supabase/user-services";
import { useAuth } from "@/context/auth-context";

export default function UsersIndex() {
  const navigate = useNavigate();

  const {user: authUser}  = useAuth()

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const pageSizes = [10, 25, 50, 100];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supabaseService.getProfiles(currentPage, pageSize);

      const users = result.data.filter(user => user.id != authUser?.id)

      setUsers(users);
      setTotalCount(result.total);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(`بارگذاری کاربران ناموفق بود: ${error.message}`);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // Initial fetch and fetch when pagination change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Function to get role badge variant based on role name
  const getRoleBadgeVariant = (roleName?: string) => {
    if (!roleName) return "outline";
    
    const roleLower = roleName.toLowerCase();
    
    if (roleLower.includes("admin") || roleLower.includes("مدیر")) {
      return "destructive" as const;
    } else if (roleLower.includes("editor") || roleLower.includes("ویرایشگر")) {
      return "default" as const;
    } else if (roleLower.includes("viewer") || roleLower.includes("بیننده")) {
      return "secondary" as const;
    } else {
      return "outline" as const;
    }
  };

  // Function to format role name for display
  const formatRoleName = (roleName?: string) => {
    if (!roleName) return "بدون نقش";
    
    // You can add custom formatting here if needed
    // For example, make Persian role names more readable
    const roleMap: Record<string, string> = {
      "admin": "مدیر سیستم",
      "editor": "ویرایشگر",
      "viewer": "بیننده",
      "user": "کاربر عادی",
      // Add more mappings as needed
    };
    
    return roleMap[roleName.toLowerCase()] || roleName;
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
                    : "هنوز هیچ کاربری در سیستم وجود ندارد."}
                </p>
                <Button
                  onClick={() => navigate("/users/create")}
                  className="mt-2"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  ایجاد اولین کاربر
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="text-right">کاربر</TableHead>
                      <TableHead className="text-right">اطلاعات تماس</TableHead>
                      <TableHead className="text-right">نقش</TableHead>
                      <TableHead className="text-right">عضویت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
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
                        <TableCell>
                          {user.role ? (
                            <Badge 
                              variant={getRoleBadgeVariant(user.role.name)}
                              className="gap-1"
                            >
                              <Shield className="w-3 h-3" />
                              {formatRoleName(user.role.name)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Shield className="w-3 h-3 ml-1" />
                              بدون نقش
                            </Badge>
                          )}
                          {user.role && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ID: {user.role.id}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.created_at).toLocaleDateString("fa-IR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleTimeString("fa-IR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
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
    </div>
  );
}