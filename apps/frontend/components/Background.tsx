import React from "react";
import { BackgroundBeamsWithCollision } from "./ui/BackgroundBeamsWithCollision";
import { AppBar } from "./AppBar";
import { RightSideCard } from "./RightSideCard";

export function BackgroundBeamsWithCollisionDemo() {
  return (
    <BackgroundBeamsWithCollision>
      <div className="absolute top-0 left-0 w-full">
        <AppBar />
        <div className="border border-sky-500"></div>
        <RightSideCard />
      </div>
    </BackgroundBeamsWithCollision>
  );
}
