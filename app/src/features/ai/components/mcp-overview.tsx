import { MCPIcon } from "@anole/ui/components/mcp-icon";
import { useLingui } from "@lingui/react/macro";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const MCPOverview = () => {
    const { t } = useLingui();

    return (
        <Link
            className="group hover:border-foreground/40 relative cursor-pointer overflow-hidden rounded-lg border p-12 text-center transition-all duration-300"
            to="/mcp/create"
        >
            <GradientBars />
            <div className="my-20 flex flex-col items-center justify-center space-y-4">
                <h3 className="flex items-center gap-3 text-2xl font-semibold md:text-4xl">
                    <MCPIcon className="fill-foreground hidden size-6 sm:block" />
                    {t`overviewTitle`}
                </h3>

                <p className="text-muted-foreground max-w-md">{t`overviewDescription`}</p>

                <div className="flex items-center gap-2 text-xl font-bold">
                    {t`addMcpServer`}
                    <ArrowUpRight className="size-6" />
                </div>
            </div>
        </Link>
    );
};

const calculateHeight = (index: number, total: number) => {
    const position = index / (total - 1);
    const maxHeight = 100;
    const minHeight = 30;

    const center = 0.5;
    const distanceFromCenter = Math.abs(position - center);
    const heightPercentage = (distanceFromCenter * 2) ** 1.2;

    return minHeight + (maxHeight - minHeight) * heightPercentage;
};

const GradientBars: React.FC = () => {
    const length = 15;

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            <div
                className="flex h-full transition-all duration-300 group-hover:translate-y-1/2"
                style={{
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                    WebkitFontSmoothing: "antialiased",
                    width: "100%",
                }}
            >
                {Array.from({ length }).map((_, index) => {
                    const height = calculateHeight(index, length);

                    return (
                        <div
                            className="from-primary/40 bg-gradient-to-t to-transparent"
                            key={index}
                            style={{
                                animation: "pulseBar 2s ease-in-out infinite alternate",
                                animationDelay: `${index * 0.1}s`,
                                boxSizing: "border-box",
                                flex: "1 0 calc(100% / 15)",
                                height: "100%",
                                maxWidth: "calc(100% / 15)",
                                outline: "1px solid rgba(0, 0, 0, 0)",
                                transform: `scaleY(${height / 100})`,
                                transformOrigin: "bottom",
                                transition: "transform 0.5s ease-in-out",
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
