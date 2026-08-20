import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@/utils/classNames";

function Label({ className, ...props }) {
  return <LabelPrimitive.Root data-slot="label" className={cn("ui-label", className)} {...props} />;
}

export { Label };
