import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Editorial textarea: matches Input styling
        "flex min-h-[80px] w-full rounded-[10px] border border-[hsl(var(--border-hairline))] bg-white px-3.5 py-2.5 text-[14px] font-body text-[hsl(var(--ink-900))] ring-offset-[hsl(var(--paper-100))] placeholder:text-[hsl(var(--fg-muted))] focus-visible:outline-none focus-visible:border-[hsl(var(--ink-900))] focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--ink-900)/0.08)] disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow] duration-150",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
