import { WobbleCard } from "./ui/WobbleCard";

export const RightSideCard = () => {
  return (
    <div className="flex w-full p-8 rounded-3xl shadow-lg">
      <div className="basis-1/2 flex items-center justify-center">
        <div className="flex flex-col space-y-4 text-white">
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">Video Call Online</h1>
          </div>
          <div className="mr-4">
            <p className="text-xl tracking-wide">
              Need to meet face-to-face virtually for work? Sign up for Dialpad's AI-powered collaboration platform with your Google account to start making unlimited online video calls for free, with unlimited audio recordings, virtual backgrounds, and more. It takes just a minute to get started. Or, take a self-guided interactive tour of the app first!
            </p>
          </div>
        </div>
      </div>

      <div className="basis-1/2">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 max-w-7xl mx-auto w-full">
          <WobbleCard containerClassName="col-span-1 min-h-[300px] relative">
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
