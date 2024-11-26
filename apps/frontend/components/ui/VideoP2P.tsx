"use client";

import { useState } from "react";

export const VideoP2P = ({
  startVideoCall,
  joinRoom,
  localVideoRef,
  remoteVideoRef,
  toggleMicrophone,
  toggleVideo,
  microphoneActive,
  videoActive,
}: any) => {
  const [shareScreenActive, setShareScreenActive] = useState(true);
  const [roomIdInput, setRoomIdInput] = useState("");

  const handleShareScreen = () => {
    setShareScreenActive(!shareScreenActive);
  };

  return (
    <div className="bg-gray-900 text-white h-screen w-screen flex flex-col">
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-4">
          <h2 className="text-xl font-bold mb-4">Local Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full bg-black rounded-lg shadow-lg"
          />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-4">
          <h2 className="text-xl font-bold mb-4">Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-full h-full bg-black rounded-lg shadow-lg"
          />
        </div>
      </div>
      {/* Flex container for the buttons and icons */}
      <div className="bg-gray-800 p-4 w-full flex justify-between items-center">
        {/* Left section with buttons */}
        <div className="flex space-x-4">
          <button
            onClick={startVideoCall}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
          >
            Start Video Call
          </button>
          <input
            className="text-black px-4 py-2 rounded"
            type="text"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            placeholder="Enter Room ID"
          />
          <button
            onClick={() => joinRoom(roomIdInput)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
          >
            Join Room
          </button>
        </div>

        {/* Right section with icons in a parent div */}
        <div className="bg-white p-2 rounded-full flex space-x-4 items-center">
          <button
            onClick={toggleMicrophone}
            className="transition-transform transform hover:scale-110 duration-300"
          >
            <img
              src={microphoneActive ? "microphone.png" : "mute.png"}
              alt="microphone"
              className="h-6 w-6"
            />
          </button>

          <button
            onClick={toggleVideo}
            className="transition-transform transform hover:scale-110 duration-300"
          >
            <img
              src={videoActive ? "video-call.png" : "video.png"}
              alt="video-call"
              className="h-6 w-6"
            />
          </button>

          <button
            onClick={handleShareScreen}
            className="transition-transform transform hover:scale-110 duration-300"
          >
            <img
              src={shareScreenActive ? "share-screen.png" : "stop-screen-share.png"}
              alt="share screen"
              className="h-6 w-6"
            />
          </button>

          <button className="transition-transform transform hover:scale-110 duration-300">
            <img src="full-screen.png" alt="full screen" className="h-6 w-6" />
          </button>

          <button className="transition-transform transform hover:scale-110 duration-300">
            <img src="circle.png" alt="end meeting" className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
