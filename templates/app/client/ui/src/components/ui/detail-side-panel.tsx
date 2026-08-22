import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React from 'react';

interface DetailSidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const DetailSidePanel: React.FC<DetailSidePanelProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-lg',
            className
          )}
        >
          <div className="w-full shrink-0 border-b border-border bg-background">
            <div className="flex items-center justify-between px-4 py-3">
              <DialogPrimitive.Title className="truncate pr-2 text-lg font-semibold">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close details">
                  <X className="h-4 w-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">{children}</div>

          {footer && (
            <div className="w-full shrink-0 border-t border-border bg-background">
              <div className="flex justify-end gap-2 px-4 py-3">{footer}</div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
