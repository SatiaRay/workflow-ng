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
import { User } from "lucide-react";

interface DeleteUserConfirmationProps {
  user: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteUserConfirmation({
  user,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: DeleteUserConfirmationProps) {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-red-500" />
            حذف کاربر
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              آیا از حذف کاربر{" "}
              <span className="font-semibold">{user.full_name || user.email}</span>{" "}
              اطمینان دارید؟
            </p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p>ایمیل: {user.email}</p>
              {user.phone && <p>شماره تماس: {user.phone}</p>}
              <p>نقش: {user.role || "کاربر"}</p>
              <p>وضعیت: {user.is_active ? "فعال" : "غیرفعال"}</p>
            </div>
            <p className="text-red-500 font-medium">
              این عمل قابل بازگشت نیست!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            حذف کاربر
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}