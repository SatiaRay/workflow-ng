// pages/roles-index.tsx
import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Plus,
  Pencil,
  Trash2,
  Users,
  Calendar,
  Shield,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { RoleService, type Role } from "@/services/supabase/role-service";

export default function RolesIndex() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Create/Edit dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form states
  const [roleName, setRoleName] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  
  // Loading states
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const roleService = new RoleService();

  // Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast.error(`بارگذاری نقش‌ها ناموفق بود: ${error.message}`);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Create role
  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toast.error("نام نقش الزامی است");
      return;
    }

    setCreating(true);
    try {
      const newRole = await roleService.createRole(roleName.trim());
      
      setRoles(prev => [...prev, newRole]);
      setRoleName("");
      setCreateDialogOpen(false);
      
      toast.success("نقش با موفقیت ایجاد شد");
    } catch (error: any) {
      console.error("Error creating role:", error);
      
      if (error.message?.includes("unique constraint")) {
        toast.error("نقش با این نام از قبل وجود دارد");
      } else {
        toast.error(`ایجاد نقش ناموفق بود: ${error.message}`);
      }
    } finally {
      setCreating(false);
    }
  };

  // Edit role
  const handleEditRole = async () => {
    if (!editingRole || !roleName.trim()) {
      toast.error("نام نقش الزامی است");
      return;
    }

    setUpdating(true);
    try {
      const updatedRole = await roleService.updateRole(editingRole.id, roleName.trim());
      
      setRoles(prev => prev.map(role => 
        role.id === editingRole.id ? updatedRole : role
      ));
      
      setRoleName("");
      setEditingRole(null);
      setEditDialogOpen(false);
      
      toast.success("نقش با موفقیت ویرایش شد");
    } catch (error: any) {
      console.error("Error updating role:", error);
      
      if (error.message?.includes("unique constraint")) {
        toast.error("نقش با این نام از قبل وجود دارد");
      } else {
        toast.error(`ویرایش نقش ناموفق بود: ${error.message}`);
      }
    } finally {
      setUpdating(false);
    }
  };

  // Delete role
  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    setDeleting(true);
    try {
      await roleService.deleteRole(deletingRole.id);
      
      setRoles(prev => prev.filter(role => role.id !== deletingRole.id));
      setDeletingRole(null);
      setDeleteDialogOpen(false);
      
      toast.success("نقش با موفقیت حذف شد");
    } catch (error: any) {
      console.error("Error deleting role:", error);
      
      if (error.message?.includes("foreign key constraint")) {
        toast.error("این نقش توسط کاربران استفاده می‌شود و نمی‌تواند حذف شود");
      } else {
        toast.error(`حذف نقش ناموفق بود: ${error.message}`);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (role: Role) => {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !roles.length) {
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
            <h1 className="text-3xl font-bold">مدیریت نقش‌ها</h1>
            <div className="flex items-center gap-4 mt-1">
              <Badge variant="outline" className="gap-1">
                <Shield className="w-3 h-3" />
                {roles.length} نقش در مجموع
              </Badge>
            </div>
          </div>

          <Button
            className="cursor-pointer"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            ایجاد نقش جدید
          </Button>
        </div>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>لیست نقش‌ها</CardTitle>
                <CardDescription>
                  {roles.length === 0
                    ? "نقشی یافت نشد"
                    : `نمایش ${roles.length} نقش`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {roles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">نقشی یافت نشد</h3>
                <p className="text-muted-foreground mb-4">
                  {loading
                    ? "در حال بارگذاری نقش‌ها..."
                    : "هنوز هیچ نقشی ایجاد نشده است."}
                </p>
                {!loading && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    ایجاد اولین نقش
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-right">#</TableHead>
                      <TableHead className="text-right">نام نقش</TableHead>
                      <TableHead className="w-32 text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role, index) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {role.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(role)}
                              title="ویرایش نقش"
                              className="h-8 w-8"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(role)}
                              title="حذف نقش"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ایجاد نقش جدید</DialogTitle>
            <DialogDescription>
              نام نقش جدید را وارد کنید. نام نقش باید منحصربه‌فرد باشد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">نام نقش</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="مثال: مدیر سیستم"
                disabled={creating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              لغو
            </Button>
            <Button onClick={handleCreateRole} disabled={creating}>
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-2" />
                  ایجاد نقش
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش نقش</DialogTitle>
            <DialogDescription>
              نام نقش را ویرایش کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">نام نقش</Label>
              <Input
                id="edit-role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="مثال: مدیر سیستم"
                disabled={updating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingRole(null);
                setRoleName("");
              }}
              disabled={updating}
            >
              لغو
            </Button>
            <Button onClick={handleEditRole} disabled={updating}>
              {updating ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  در حال ویرایش...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 ml-2" />
                  ذخیره تغییرات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">حذف نقش</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید نقش "
              <span className="font-semibold">{deletingRole?.name}</span>" را حذف کنید؟
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">هشدار:</p>
                    <p>اگر این نقش توسط کاربران استفاده شود، حذف آن ممکن نیست.</p>
                    <p className="mt-1">کاربرانی که از این نقش استفاده می‌کنند همچنان قادر به ورود خواهند بود.</p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingRole(null);
              }}
              disabled={deleting}
            >
              لغو
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  در حال حذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف نقش
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}