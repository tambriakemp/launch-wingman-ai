import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        // Editorial toast: paper canvas, ink-900 border, terracotta left rule, square corners
        unstyled: false,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(var(--paper-100))] group-[.toaster]:text-[hsl(var(--ink-900))] group-[.toaster]:border group-[.toaster]:border-[hsl(var(--ink-900))] group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-[hsl(var(--terracotta-500))] group-[.toaster]:rounded-[4px] group-[.toaster]:shadow-[0_20px_40px_-12px_rgba(31,27,23,0.22),0_4px_12px_rgba(31,27,23,0.08)] group-[.toaster]:font-body",
          title:
            "group-[.toast]:font-display group-[.toast]:font-medium group-[.toast]:text-[16px] group-[.toast]:tracking-[-0.01em] group-[.toast]:text-[hsl(var(--ink-900))]",
          description:
            "group-[.toast]:font-body group-[.toast]:text-[12.5px] group-[.toast]:leading-[1.45] group-[.toast]:text-[hsl(var(--fg-secondary))]",
          actionButton:
            "group-[.toast]:bg-[hsl(var(--ink-900))] group-[.toast]:text-[hsl(var(--paper-100))] group-[.toast]:rounded-[6px] group-[.toast]:font-body group-[.toast]:font-semibold group-[.toast]:text-[12.5px]",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-[hsl(var(--fg-muted))] group-[.toast]:font-body group-[.toast]:font-medium group-[.toast]:text-[12.5px]",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-[hsl(var(--border-hairline))] group-[.toast]:text-[hsl(var(--fg-muted))] group-[.toast]:hover:bg-[hsl(var(--paper-200))]",
          success:
            "group-[.toaster]:border-l-[hsl(var(--moss-500))] [&_[data-icon]]:text-[hsl(var(--moss-500))]",
          error:
            "group-[.toaster]:border-l-[hsl(var(--destructive))] [&_[data-icon]]:text-[hsl(var(--destructive))]",
          info: "group-[.toaster]:border-l-[hsl(var(--plum-700))] [&_[data-icon]]:text-[hsl(var(--plum-700))]",
          warning:
            "group-[.toaster]:border-l-[hsl(var(--warning))] [&_[data-icon]]:text-[hsl(var(--warning))]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
