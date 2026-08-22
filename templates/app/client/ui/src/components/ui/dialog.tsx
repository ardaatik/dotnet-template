import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = ({ children, ...props }: DialogPrimitive.DialogPortalProps) => (
  <DialogPrimitive.Portal {...props}>{children}</DialogPrimitive.Portal>
);
DialogPortal.displayName = DialogPrimitive.Portal.displayName;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="w-full shrink-0 border-b border-border bg-background">
    <div
      className={cn(
        'flex flex-col space-y-1.5 px-6 py-4 pr-12 text-center sm:text-left',
        className
      )}
      {...props}
    />
  </div>
);
DialogHeader.displayName = 'DialogHeader';

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('min-h-0 w-full flex-1 overflow-y-auto px-6 py-4', className)} {...props} />
);
DialogBody.displayName = 'DialogBody';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="w-full shrink-0 border-t border-border bg-background">
    <div
      className={cn(
        'flex flex-col-reverse px-6 py-4 sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  </div>
);
DialogFooter.displayName = 'DialogFooter';

function isDialogSlot(type: unknown, component: unknown, displayName: string): boolean {
  return type === component || getComponentDisplayName(type) === displayName;
}

function getComponentDisplayName(type: unknown): string | undefined {
  if (typeof type === 'string') {
    return undefined;
  }

  if (type && typeof type === 'object' && 'displayName' in type) {
    return (type as { displayName?: string }).displayName;
  }

  return undefined;
}

function partitionDialogChildren(children: React.ReactNode) {
  const childArray = React.Children.toArray(children);
  let header: React.ReactNode = null;
  let footer: React.ReactNode = null;
  const body: React.ReactNode[] = [];
  let hasExplicitBody = false;

  for (const child of childArray) {
    if (!React.isValidElement(child)) {
      body.push(child);
      continue;
    }

    if (isDialogSlot(child.type, DialogHeader, 'DialogHeader')) {
      header = child;
    } else if (isDialogSlot(child.type, DialogFooter, 'DialogFooter')) {
      footer = child;
    } else if (isDialogSlot(child.type, DialogBody, 'DialogBody')) {
      hasExplicitBody = true;
      body.push(child);
    } else {
      body.push(child);
    }
  }

  return { header, body, footer, hasExplicitBody };
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { header, body, footer, hasExplicitBody } = partitionDialogChildren(children);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 flex max-h-[90vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      >
        {header}
        {body.length > 0 &&
          (hasExplicitBody ? (
            body
          ) : (
            <div className="min-h-0 w-full flex-1 overflow-y-auto px-6 py-4">{body}</div>
          ))}
        {footer}
        <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
