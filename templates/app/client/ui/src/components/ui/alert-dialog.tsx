import { cn } from '@/lib/utils';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as React from 'react';

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="w-full shrink-0 border-b border-border bg-background">
    <div
      className={cn('flex flex-col space-y-2 px-6 py-4 text-center sm:text-left', className)}
      {...props}
    />
  </div>
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('min-h-0 w-full flex-1 overflow-y-auto px-6 py-4', className)} {...props} />
);
AlertDialogBody.displayName = 'AlertDialogBody';

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
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
AlertDialogFooter.displayName = 'AlertDialogFooter';

function isAlertDialogSlot(type: unknown, component: unknown, displayName: string): boolean {
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

function partitionAlertDialogChildren(children: React.ReactNode) {
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

    if (isAlertDialogSlot(child.type, AlertDialogHeader, 'AlertDialogHeader')) {
      header = child;
    } else if (isAlertDialogSlot(child.type, AlertDialogFooter, 'AlertDialogFooter')) {
      footer = child;
    } else if (isAlertDialogSlot(child.type, AlertDialogBody, 'AlertDialogBody')) {
      hasExplicitBody = true;
      body.push(child);
    } else {
      body.push(child);
    }
  }

  return { header, body, footer, hasExplicitBody };
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { header, body, footer, hasExplicitBody } = partitionAlertDialogChildren(children);

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
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
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = AlertDialogPrimitive.Action;
const AlertDialogCancel = AlertDialogPrimitive.Cancel;

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
