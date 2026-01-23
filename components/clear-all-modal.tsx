"use client";

/**
 * Clear All Modal Component
 * 
 * Confirmation dialog for clearing entire profile graph
 */

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ClearAllModalProps {
  isOpen: boolean;
  categoryCount: number;
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClearAllModal({
  isOpen,
  categoryCount,
  itemCount,
  onConfirm,
  onCancel
}: ClearAllModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Profile Data?</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-3">
              <p>This will delete your entire profile graph including:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{categoryCount} {categoryCount === 1 ? 'category' : 'categories'}</li>
                <li>{itemCount} {itemCount === 1 ? 'item' : 'items'}</li>
              </ul>
              <p className="font-semibold text-red-600">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Clear All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
