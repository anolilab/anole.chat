import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export const ModeToggle = ({ className }: { className?: string }) => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <Button variant="icon" size="icon" className={cn("relative overflow-hidden", className)} onClick={toggleTheme}>
            <Sun
                className={cn("absolute rotate-0 scale-100 transform opacity-100 transition-all duration-200 ease-in-out", {
                    "rotate-90 scale-0 opacity-0": theme === "dark",
                })}
            />
            <Moon
                className={cn("absolute -rotate-90 scale-0 transform opacity-0 transition-all duration-200 ease-in-out", {
                    "rotate-0 scale-100 opacity-100": theme === "dark",
                })}
            />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
};
