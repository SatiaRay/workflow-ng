import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { supabaseService } from "../../../../src/services/supabase.service";
import type { Workflow } from "../../../../src/types/workflow";
import type { Form } from "../../../../src/types/form";
import { Link } from "react-router-dom";

interface FormsTabProps {
  workflow: Workflow;
}

export default function FormsTab({ workflow }: FormsTabProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadForms();
  }, [workflow.id]);

  const loadForms = async () => {
    setLoading(true);
    try {
      if (workflow && workflow.id) {
        const workflowForms = await supabaseService.getWorkflowForms(
          workflow.id,
        );
        setForms(workflowForms || []);
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (form: Form) => {
    setFormToDelete(form);
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;

    setIsDeleting(true);
    try {
      await supabaseService.deleteForm(formToDelete.id);
      setForms(forms.filter((f) => f.id !== formToDelete.id));
      setFormToDelete(null);
    } catch (error) {
      console.error("Error deleting form:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setFormToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            فرم‌های گردش کار
          </h2>
          <p className="text-muted-foreground">
            فرم‌های مرتبط با این گردش کار را مدیریت کنید
          </p>
        </div>
        <Link to={`/form/generator?workflow=${workflow.id}`}>
          <Button>
            <PlusCircle className="ml-2 h-4 w-4" />
            ایجاد فرم جدید
          </Button>
        </Link>
      </div>

      {/* Forms List */}
      {loading ? (
        <div className="text-center py-8">در حال بارگذاری...</div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              هنوز هیچ فرمی برای این گردش کار ایجاد نشده است
            </p>
            <Link to={`/form/generator?workflow=${workflow.id}`}>
              <Button variant="outline">
                <PlusCircle className="ml-2 h-4 w-4" />
                ایجاد اولین فرم
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{form.title}</h3>
                      {form.id === workflow.trigger_form?.id && (
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          فرم ماشه
                        </span>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-sm text-muted-foreground">
                        {form.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        آخرین بروزرسانی: {formatDate(form.updated_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mr-4">
                    <Link to={`/form/edit/${form.id}`}>
                      <Button variant="ghost" size="icon" title="ویرایش">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="حذف"
                      aria-label="حذف"
                      onClick={() => handleDeleteClick(form)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!formToDelete}
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              آیا از حذف فرم "{formToDelete?.title}" مطمئن هستید؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              این اقدام غیرقابل بازگشت است. فرم به طور کامل از سیستم حذف خواهد
              شد و تمام داده‌های مرتبط با آن از بین خواهد رفت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "در حال حذف..." : "بله، حذف شود"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
