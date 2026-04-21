import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Editorial input: white canvas on paper, hairline border, ink-900 focus ring
          "flex h-11 w-full rounded-[10px] border border-[hsl(var(--border-hairline))] bg-white px-3.5 py-2 text-[14px] font-body text-[hsl(var(--ink-900))] ring-offset-[hsl(var(--paper-100))] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[hsl(var(--fg-muted))] focus-visible:outline-none focus-visible:border-[hsl(var(--ink-900))] focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--ink-900)/0.08)] disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow] duration-150",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
