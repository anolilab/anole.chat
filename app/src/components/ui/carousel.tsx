"use client";

import type { UseEmblaCarouselType } from "embla-carousel-react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProperties = {
    opts?: CarouselOptions;
    orientation?: "horizontal" | "vertical";
    plugins?: CarouselPlugin;
    setApi?: (api: CarouselApi) => void;
};

type CarouselContextProperties = CarouselProperties & {
    api: ReturnType<typeof useEmblaCarousel>[1];
    canScrollNext: boolean;
    canScrollPrev: boolean;
    carouselRef: ReturnType<typeof useEmblaCarousel>[0];
    scrollNext: () => void;
    scrollPrev: () => void;
};

const CarouselContext = React.createContext<CarouselContextProperties | null>(null);

function useCarousel() {
    const context = React.use(CarouselContext);

    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />");
    }

    return context;
}

const Carousel = ({ children, className, opts, orientation = "horizontal", plugins, setApi, ...properties }: CarouselProperties & React.ComponentProps<"div">) => {
    const [carouselReference, api] = useEmblaCarousel(
        {
            ...opts,
            axis: orientation === "horizontal" ? "x" : "y",
        },
        plugins,
    );
    const [canScrollPrevious, setCanScrollPrevious] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: CarouselApi) => {
        if (!api)
            return;

        setCanScrollPrevious(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrevious = React.useCallback(() => {
        api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
        api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                scrollPrevious();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                scrollNext();
            }
        },
        [scrollPrevious, scrollNext],
    );

    React.useEffect(() => {
        if (!api || !setApi)
            return;

        setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
        if (!api)
            return;

        onSelect(api);
        api.on("reInit", onSelect);
        api.on("select", onSelect);

        return () => {
            api?.off("select", onSelect);
        };
    }, [api, onSelect]);

    return (
        <CarouselContext
            value={{
                api,
                canScrollNext,
                canScrollPrev: canScrollPrevious,
                carouselRef: carouselReference,
                opts,
                orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
                scrollNext,
                scrollPrev: scrollPrevious,
            }}
        >
            <div
                aria-roledescription="carousel"
                className={cn("relative", className)}
                data-slot="carousel"
                onKeyDownCapture={handleKeyDown}
                role="region"
                {...properties}
            >
                {children}
            </div>
        </CarouselContext>
    );
};

const CarouselContent = ({ className, ...properties }: React.ComponentProps<"div">) => {
    const { carouselRef, orientation } = useCarousel();

    return (
        <div className="overflow-hidden" data-slot="carousel-content" ref={carouselRef}>
            <div className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)} {...properties} />
        </div>
    );
};

const CarouselItem = ({ className, ...properties }: React.ComponentProps<"div">) => {
    const { orientation } = useCarousel();

    return (
        <div
            aria-roledescription="slide"
            className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "pl-4" : "pt-4", className)}
            data-slot="carousel-item"
            role="group"
            {...properties}
        />
    );
};

const CarouselPrevious = ({ className, size = "icon", variant = "outline", ...properties }: React.ComponentProps<typeof Button>) => {
    const { canScrollPrev, orientation, scrollPrev } = useCarousel();

    return (
        <Button
            className={cn(
                "absolute size-8 rounded-full",
                orientation === "horizontal" ? "-left-12 top-1/2 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
                className,
            )}
            data-slot="carousel-previous"
            disabled={!canScrollPrev}
            onClick={scrollPrev}
            size={size}
            variant={variant}
            {...properties}
        >
            <ArrowLeft />
            <span className="sr-only">Previous slide</span>
        </Button>
    );
};

const CarouselNext = ({ className, size = "icon", variant = "outline", ...properties }: React.ComponentProps<typeof Button>) => {
    const { canScrollNext, orientation, scrollNext } = useCarousel();

    return (
        <Button
            className={cn(
                "absolute size-8 rounded-full",
                orientation === "horizontal" ? "-right-12 top-1/2 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
                className,
            )}
            data-slot="carousel-next"
            disabled={!canScrollNext}
            onClick={scrollNext}
            size={size}
            variant={variant}
            {...properties}
        >
            <ArrowRight />
            <span className="sr-only">Next slide</span>
        </Button>
    );
};

export { Carousel, type CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious };
