import cn from "../utils/cn";

const Skeleton = ({
    className,
    ...properties
}: React.ComponentProps<"div">) => (
    <div
        className={cn("bg-accent animate-pulse rounded-md", className)}
        data-slot="skeleton"
        {...properties}
    />
);

export { Skeleton };
