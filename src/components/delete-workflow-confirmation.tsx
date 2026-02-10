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
import { Workflow } from "lucide-react";

interface DeleteWorkflowConfirmationProps {
  workflow: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteWorkflowConfirmation({
  workflow,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: DeleteWorkflowConfirmationProps) {
  if (!workflow) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-red-500" />
            حذف گروه کاری
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-right">
            <p>
              آیا از حذف گروه کاری {" "}
              <span className="font-semibold">{workflow.name }</span>{" "}
              اطمینان دارید؟
            </p>
            <p className="text-red-500 font-medium text-right">
              این عمل قابل بازگشت نیست!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            حذف گروه کاری
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}