import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

/**
 * Badge 用于状态、当前服务等短文本标记。
 * 它不承载点击行为，交互动作仍应使用 Button。
 */
export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    outline: "border-border text-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
