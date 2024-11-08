"use client";

import { TypewriterEffectSmooth } from "./ui/TypeWritterEffect";

export function TypewriterEffectSmoothDemo() {
  const words = [
    {
      text: "Connect",
    },
    {
      text: "with",
    },
    {
      text: "your",
    },
    {
      text: "love one's with",
    },
    {
      text: "meet.io",
      className: "text-blue-500 dark:text-blue-500",
    },
  ];
  return (
    <div className="flex flex-col items-center justify-center   ">
      <TypewriterEffectSmooth words={words} />

    </div>
    
  );
}
