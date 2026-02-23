import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ArrowLeft,
  Menu,
  Info,
  GitBranch,
  FileText,
  CheckCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseService } from "@/services/supabase.service";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWorkflowDetail,
  WorkflowDetailProvider,
} from "@/context/workflow-detail-context";
import { DirectionProvider } from "@/components/ui/direction";
import { InformationTab } from "@/components/workflow/detail-tabs/information-tab";
import StatusBadge from "@/components/workflow/status-badge";
import FormsTab from "@/components/workflow/detail-tabs/forms-tab";
import DiagramTab from "@/components/workflow/detail-tabs/diagram-tab";

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

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export default function WorkflowDetail() {
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  const workflowId = parseInt(id || "0");
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Error loading workflow:", error);
      toast.error("بارگذاری اطلاعات گردش کار ناموفق بود");
    } finally {
      setLoading(false);
    }
  };

  const navItems: NavItem[] = [
    { id: "information", label: "اطلاعات", icon: Info },
    { id: "diagram", label: "نمودار", icon: GitBranch },
    { id: "forms", label: "فرم‌ها", icon: FileText },
  ];

  if (loading) return <LoadingSkeleton />;

  if (!workflow) {
    return null;
  }

  return (
    <WorkflowDetailProvider workflow={workflow}>
      <DirectionProvider dir="rtl">
        <div className="min-h-screen bg-background" dir="rtl">
          <MobileNavigation items={navItems} />

          <div className="flex">
            <DesktopNavigation items={navItems} />
            <main className="flex-1 p-4 lg:p-6">
              <DesktopHeader />

              <DetailTabs />
            </main>
          </div>
        </div>
      </DirectionProvider>
    </WorkflowDetailProvider>
  );
}

const LoadingSkeleton = () => {
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
};

const MobileNavigation = ({ items }: { items: NavItem[] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeTab, setActiveTab, workflow } = useWorkflowDetail();
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
              <div className="mt-2">
                <StatusBadge status={workflow.status} />
              </div>
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

const DesktopNavigation = ({ items }: { items: NavItem[] }) => {
  const navigate = useNavigate();

  const { activeTab, setActiveTab, workflow } = useWorkflowDetail();

  return (
    <aside className="hidden lg:block w-64 border-l bg-background sticky top-0">
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
          <div>
            <StatusBadge status={workflow.status}/>
          </div>
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
    </aside>
  );
};

const DesktopHeader = () => {
  const { workflow } = useWorkflowDetail();

  return (
    <div className="hidden lg:flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{workflow.name}</h1>
        {workflow.description && (
          <p className="text-muted-foreground mt-1">{workflow.description}</p>
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
  );
};

const DetailTabs = () => {
  const { activeTab, setActiveTab, workflow } = useWorkflowDetail();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <InformationTab workflow={workflow}/>

      <DiagramTab />

      <FormsTab workflow={workflow}/>
    </Tabs>
  );
};