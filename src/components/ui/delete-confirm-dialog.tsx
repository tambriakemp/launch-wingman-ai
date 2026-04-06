import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete permanently?",
  description = "This action cannot be undone. Type DELETE to confirm.",
}: DeleteConfirmDialogProps) {
  const [value, setValue] = useState("");

  const handleConfirm = () => {
    if (value.trim().toUpperCase() === "DELETE") {
      onConfirm();
      setValue("");
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setValue(""); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Input
            autoFocus
            placeholder='Type "DELETE" to confirm'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
          />
        </div>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => { onOpenChange(false); setValue(""); }}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={value.trim().toUpperCase() !== "DELETE"}
            onClick={handleConfirm}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
