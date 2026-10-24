// src/components/ui/reveal.tsx  (blur-to-sharp scroll reveal)
"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useEffect, useState } from "react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function useBlurAmount() {
  const [amount, setAmount] = useState(16);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 599px)");
    const update = () => setAmount(mq.matches ? 8 : 16);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return amount;
}

interface RevealProps
  extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "whileInView" | "viewport"> {
  index?: number; // stagger position inside a group (90 ms apart, max 6)
}

export function Reveal({ index = 0, children, ...props }: RevealProps) {
  const reduce = useReducedMotion();
  const blur = useBlurAmount();

  const variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 40, scale: 0.96, filter: `blur(${blur}px)` },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)", // settled text is always sharp
          transition: { duration: 0.7, ease: EASE, delay: index < 6 ? index * 0.09 : 0 },
        },
      };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}