import { cn } from "@/utils/classNames";

function Input({ className, type, ...props }) {
  return <input type={type} data-slot="input" className={cn("ui-input", className)} {...props} />;
}

export { Input };
