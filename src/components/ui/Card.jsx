import { cn } from "@/utils/classNames";

function Card({ className, size = "default", ...props }) {
  return <div data-slot="card" data-size={size} className={cn("ui-card", className)} {...props} />;
}

function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn("ui-card__header", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <div data-slot="card-title" className={cn("ui-card__title", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return (
    <div data-slot="card-description" className={cn("ui-card__description", className)} {...props} />
  );
}

function CardAction({ className, ...props }) {
  return <div data-slot="card-action" className={cn("ui-card__action", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn("ui-card__content", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div data-slot="card-footer" className={cn("ui-card__footer", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
