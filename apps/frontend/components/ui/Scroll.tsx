"use client";
import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
// import { motion } from "framer-motion";
// import { cn } from "../../app/lib/utils";

export const Scroll = ({
  children 
}: {
  children: React.ReactNode
}) => {
  const gridRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: gridRef,
    offset: ["start start", "end start"],
  });

  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div className="h-full overflow-y-auto w-full" ref={gridRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start max-w-5xl mx-auto gap-10 py-40 px-10">
        {children}
      </div>
    </div>
  );
};
