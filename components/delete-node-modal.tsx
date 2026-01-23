"use client";

/**
 * Delete Node Modal Component
 * 
 * Confirmation dialog for deleting nodes from the profile graph
 */

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DeleteNodeModalProps {
  isOpen: boolean;
  nodeName: string;
  nodeType: 'item' | 'subnode' | 'category';
  affectedItems?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteNodeModal({
  isOpen,
  nodeName,
  nodeType,
  affectedItems = [],
  onConfirm,
  onCancel
}: DeleteNodeModalProps) {
  const getTitle = () => {
    switch (nodeType) {
      case 'item':
        return `Delete "${nodeName}"?`;
      case 'subnode':
        return `Delete "${nodeName}" subnode?`;
      case 'category':
        return `Delete "${nodeName}" category?`;
      default:
        return 'Delete item?';
    }
  };

  const getDescription = () => {
    if (nodeType === 'item') {
      return 'This will remove it from your profile permanently.';
    }
    
    return (
      <div className="space-y-2">
        <p>This will also delete:</p>
        <ul className="list-disc list-inside space-y-1">
          {affectedItems.map((item, index) => (
            <li key={index} className="text-sm">{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            {nodeType === 'item' ? 'Delete' : 'Delete All'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
