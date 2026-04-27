import * as React from "react";
import { cn } from "@/lib/utils";

/** Label 统一表单字段标题，并保留原生 label/htmlFor 的可访问性契约。 */
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium leading-none text-foreground", className)} {...props} />;
}
