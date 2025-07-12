import { AspectRatio as AspectRatioPrimitive } from "radix-ui";

const AspectRatio = ({ ...properties }: React.ComponentProps<typeof AspectRatioPrimitive.Root>) => (
    <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...properties} />
);

export { AspectRatio };
