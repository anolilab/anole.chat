"use client";

import { motion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";

interface TimelineProperties {
    description?: string;
    timeline: {
        content: ReactNode;
        title: string;
    }[];
    title: string;
}

export const Timeline = ({ description, timeline, title }: TimelineProperties) => {
    const reference = useRef<HTMLDivElement>(null);
    const containerReference = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (reference.current) {
            const rect = reference.current.getBoundingClientRect();

            setHeight(rect.height);
        }
    }, [reference]);

    const { scrollYProgress } = useScroll({
        offset: ["start 10%", "end 50%"],
        target: containerReference,
    });

    const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
    const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    return (
        <div className="flex w-full flex-col gap-4" ref={containerReference}>
            <div>
                <h2 className="mb-4 text-lg md:text-3xl">{title}</h2>
                {description && <p className="text-muted-foreground max-w-sm text-sm md:text-base">{description}</p>}
            </div>

            <div className="relative mx-auto max-w-7xl pb-20" ref={reference}>
                {timeline.map((item, index) => (
                    <div className="flex justify-start pt-10 md:gap-10 md:pt-40" key={index}>
                        <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
                            <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full md:left-3">
                                <div className="rounded-fullp-2 h-4 w-4" />
                            </div>
                            <h3 className="hidden text-xl font-bold text-neutral-500 md:block md:pl-20 md:text-5xl dark:text-neutral-500">{item.title}</h3>
                        </div>

                        <div className="relative w-full pr-4 pl-20 md:pl-4">
                            <h3 className="mb-4 block text-left text-2xl font-bold text-neutral-500 md:hidden dark:text-neutral-500">{item.title}</h3>
                            {item.content}
                        </div>
                    </div>
                ))}
                <div
                    className="absolute top-0 left-8 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8 dark:via-neutral-700"
                    style={{
                        height: `${height}px`,
                    }}
                >
                    <motion.div
                        className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-purple-500 from-[0%] via-blue-500 via-[10%] to-transparent"
                        style={{
                            height: heightTransform,
                            opacity: opacityTransform,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
