import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/**
 * Button 提供项目统一的 shadcn 风格按钮契约。
 * variant 只表达语义强度，业务逻辑通过原生 button 属性和事件传入。
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<ButtonVariant, string> = {
      default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      outline: "border border-input bg-background shadow-sm hover:bg-secondary hover:text-secondary-foreground",
      ghost: "hover:bg-secondary hover:text-secondary-foreground",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
