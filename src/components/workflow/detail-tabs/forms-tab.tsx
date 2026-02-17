import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import {
  FileText,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { Form } from "@/types/form";

const FormsTab = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[] | []>([]);

  return (
    <TabsContent value="forms" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>فرم‌های استفاده شده</CardTitle>
          <CardDescription>
            فرم‌هایی که در این گردش کار استفاده شده‌اند
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">فرمی استفاده نشده</h3>
              <p className="text-muted-foreground">
                در این گردش کار هیچ فرمی استفاده نشده است
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forms.map((form) => (
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
  );
};

export default FormsTab;