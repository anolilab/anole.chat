"use client";

import { motion } from "motion/react";

const Think = () => (
    <motion.div
        animate={{
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.5, 1],
        }}
        className="bg-primary h-2 w-2 rounded-full"
        transition={{
            delay: 0,
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
        }}
    />
);

export default Think;
