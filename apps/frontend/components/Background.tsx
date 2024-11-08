import React from "react";
import { BackgroundBeamsWithCollision } from "./ui/BackgroundBeamsWithCollision";
import { AppBar } from "./AppBar";
import { RightSideCard } from "./RightSideCard";
import { Scroll } from "./ui/Scroll";
import { TypewriterEffectSmoothDemo } from "./TypeWritterEffect";


export function BackgroundBeamsWithCollisionDemo() {
  return (
    <BackgroundBeamsWithCollision>
      <Scroll>
        <div className="absolute top-0 left-0 w-full">
          <AppBar />
          <div className="border border-gray-700"></div>
          <TypewriterEffectSmoothDemo />
          <RightSideCard />
          <div className="my-8"></div>
        </div>
      </Scroll>
    </BackgroundBeamsWithCollision>
  );
}
