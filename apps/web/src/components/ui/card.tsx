import * as React from "react";
import { cn } from "@/lib/utils";

/** Card 是页面内独立工作区块的边界容器，保持 8px 圆角和低噪声边框。 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />;
}

/** CardHeader 承载标题和操作区，默认使用细边框分隔内容。 */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b px-5 py-4", className)} {...props} />;
}

/** CardTitle 使用紧凑字号，避免工具界面出现营销页式大标题。 */
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold tracking-normal", className)} {...props} />;
}

/** CardContent 承载主要控件，默认提供一致留白。 */
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
