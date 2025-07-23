import { motion } from "framer-motion";
import type { ReactNode, FC } from "react";
import { useRef, useLayoutEffect, useState } from "react";
import cn from "../utils/cn";

export interface AutoHeightProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  ease?: "easeIn" | "easeOut" | "easeInOut" | "linear";
}

export const AutoHeight: FC<AutoHeightProps> = ({
  children,
  className,
  duration = 0.2,
  ease = "easeInOut",
}) => {
  const [height, setHeight] = useState<number | "auto">("auto");
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current) {
          const newHeight = contentRef.current.scrollHeight;
          setHeight(newHeight);
        }
      });

      resizeObserver.observe(contentRef.current);

      // Initial height measurement
      const initialHeight = contentRef.current.scrollHeight;
      setHeight(initialHeight);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [children]);

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      animate={{ height }}
      transition={{
        duration,
        ease,
      }}
    >
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
}