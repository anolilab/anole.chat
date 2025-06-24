import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    success: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-green-500/20",
                    error: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-red-500/20",
                    warning: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-yellow-500/20",
                    info: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-blue-500/20",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
