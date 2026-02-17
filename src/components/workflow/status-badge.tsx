import { Badge } from "@/components/ui/badge";
import type { WorkflowStatus } from "@/types/workflow";
import { FileText, Play, Pause, AlertCircle } from "lucide-react";

const StatusBadge = ({ status }: { status: WorkflowStatus }) => {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
          <Play className="w-3 h-3 ml-1" />
          فعال
        </Badge>
      );
    case "draft":
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          <FileText className="w-3 h-3 ml-1" />
          پیش‌نویس
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <Pause className="w-3 h-3 ml-1" />
          غیرفعال
        </Badge>
      );
    case "archived":
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

export default StatusBadge;
