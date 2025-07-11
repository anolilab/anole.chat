import { useTheme } from "next-themes";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...properties }: ToasterProps) => {
    const { theme = "system" } = useTheme();

    return (
        <Sonner
            className="toaster group"
            theme={theme as ToasterProps["theme"]}
            toastOptions={{
                classNames: {
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    description: "group-[.toast]:text-muted-foreground",
                    error: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-red-500/20",
                    info: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-blue-500/20",
                    success: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-green-500/20",
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    warning: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-yellow-500/20",
                },
            }}
            {...properties}
        />
    );
};

export { Toaster };
