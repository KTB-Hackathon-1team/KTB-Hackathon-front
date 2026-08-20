import { cva } from "class-variance-authority";
import { cn } from "@/utils/classNames";

const alertVariants = cva("ui-alert", {
  variants: {
    variant: {
      default: "ui-alert--default",
      destructive: "ui-alert--destructive",
    },
  },
  defaultVariants: { variant: "default" },
});

function Alert({ className, variant, ...props }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }) {
  return <div data-slot="alert-title" className={cn("ui-alert__title", className)} {...props} />;
}

function AlertDescription({ className, ...props }) {
  return (
    <div
      data-slot="alert-description"
      className={cn("ui-alert__description", className)}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }) {
  return <div data-slot="alert-action" className={cn("ui-alert__action", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
