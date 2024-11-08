import { TextGenerateEffect } from "./ui/Text-generate-effect";
import { WobbleCard } from "./ui/WobbleCard";

export const RightSideCard = () => {
  return (
    <div className="flex w-full p-8 rounded-3xl shadow-lg">
      <div className="basis-1/2 flex items-center justify-center">
        <div className="flex flex-col space-y-4 text-white">
          <div className="mr-4">
            <TextGenerateEffect words={ word } />
            <div className="my-6"></div>
            <button className="px-4 py-1 mr-5 bg-blue-600 rounded-md hover:bg-blue-500">Start</button>
            <button className="px-4 py-1 bg-blue-600 rounded-md hover:bg-blue-500">Join</button>
          </div>
        </div>
      </div>

      <div className="basis-1/2">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 max-w-7xl mx-auto w-full">
          <WobbleCard containerClassName="col-span-1 min-h-[200px] max-h-[300px] relative">
            <img
              src="/p2p.png"
              alt="p2p image"
              className="w-full h-full object-cover rounded-2xl shadow-md"
            />
          </WobbleCard>
        </div>
      </div>
    </div>
  );
};


const word = "Video Call Online";