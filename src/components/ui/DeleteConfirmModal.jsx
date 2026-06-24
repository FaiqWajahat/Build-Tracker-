"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Record",
  description = "Are you sure you want to delete this record? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  itemName = "",
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm rounded-2xl border border-border bg-card/90 backdrop-blur-md p-6">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20 text-destructive animate-pulse">
            <Trash2 size={20} />
          </div>
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
            {itemName && (
              <span className="block mt-2 font-medium text-foreground bg-muted/50 py-1.5 px-3 rounded-lg border border-border/50 break-all text-center">
                {itemName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border-border hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-all"
          >
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl transition-all shadow-md shadow-destructive/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
