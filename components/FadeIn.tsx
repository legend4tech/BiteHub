"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: FadeInProps) {
  const directions = {
    up:    { y: 16, x: 0 },   // was 40 — much shorter travel distance
    down:  { y: -16, x: 0 },
    left:  { x: 16, y: 0 },
    right: { x: -16, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      // margin: "0px" — fires the moment the element enters the viewport,
      // not 100px late. Prevents infinite-scroll sentinel from already
      // being in view before the animation completes.
      viewport={{ once: true, margin: "0px" }}
      transition={{
        duration: 0.4,   // was 0.7 — snappier
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
