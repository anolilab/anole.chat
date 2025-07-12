import { cn } from "@/lib/utils";

const Skeleton = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div className={cn("bg-accent animate-pulse rounded-md", className)} data-slot="skeleton" {...properties} />
);

export { Skeleton };
