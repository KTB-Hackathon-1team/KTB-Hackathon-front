import { cn } from "@/utils/classNames";

function Textarea({ className, ...props }) {
  return <textarea data-slot="textarea" className={cn("ui-textarea", className)} {...props} />;
}

export { Textarea };
