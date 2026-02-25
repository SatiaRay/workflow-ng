import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, RefreshCw } from "lucide-react";
import { supabaseService } from "../../../src/services/supabase.service";
import type { Form } from "../../../src/types/form";

export default function CreateNewTaskDialog() {
  const [open, setOpen] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (open) {
      fetchTriggerForms();
    }
  }, [open]);

  const fetchTriggerForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const triggerForms = await supabaseService.getActiveWorkflowsTriggerForms();
      setForms(triggerForms || []);
    } catch (error: any) {
      setError(error.message);
      console.error("Error loading trigger forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchTriggerForms();
  };

  // Get redirect param from URL
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get("redirect");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button aria-label="ثبت درخواست جدید">ثبت درخواست جدید</Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto text-right"
        dir="rtl"
      >
        <DialogHeader className="text-righ pt-6">
          <DialogTitle className="text-right">ثبت درخواست جدید</DialogTitle>
          <DialogDescription className="text-right">
            لطفا نوع درخواست جدید را انتخاب کنید
          </DialogDescription>
        </DialogHeader>

        {/* Rest of the component */}
        <div className="py-4 text-right">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="text-right">
              <AlertDescription className="flex items-center justify-between">
                <span>خطا در بارگذاری فرم‌ها: {error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="mr-2"
                >
                  <RefreshCw className="h-4 w-4 ml-1" />
                  تلاش مجدد
                </Button>
              </AlertDescription>
            </Alert>
          ) : forms.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  هیچ فرم ماشه‌ای یافت نشد
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {forms.map((form) => (
                <Link
                  key={form.id}
                  to={`/form/submit/${form.id}?redirect=/tasks`}
                  onClick={() => setOpen(false)}
                  tabIndex={0}
                  aria-label={form.title}
                  className="block text-right"
                >
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="text-right">
                          <h4 className="font-semibold text-right">
                            {form.title}
                          </h4>
                          {form.description && (
                            <p className="text-sm text-muted-foreground mt-1 text-right">
                              {form.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
