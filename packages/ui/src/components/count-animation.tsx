"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";

import cn from "../utils/cn";

const CountAnimation = ({
  number,
  className,
}: {
  number: number;
  className?: string;
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, number, { duration: 1 });

    return animation.stop;
  }, [number]);

  return <motion.span className={cn(className)}>{rounded}</motion.span>;
}

export default CountAnimation;