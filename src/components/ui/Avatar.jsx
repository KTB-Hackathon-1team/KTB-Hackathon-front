import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "@/utils/classNames";

function Avatar({ className, size = "default", ...props }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn("ui-avatar", className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("ui-avatar__image", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("ui-avatar__fallback", className)}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }) {
  return <span data-slot="avatar-badge" className={cn("ui-avatar__badge", className)} {...props} />;
}

function AvatarGroup({ className, ...props }) {
  return <div data-slot="avatar-group" className={cn("ui-avatar-group", className)} {...props} />;
}

function AvatarGroupCount({ className, ...props }) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn("ui-avatar-group__count", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge };
