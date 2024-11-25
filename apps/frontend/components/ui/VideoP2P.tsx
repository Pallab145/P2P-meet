"use client";

import { useState } from "react";

export const VideoP2P = ({
  startVideoCall,
  joinRoom,
  localVideoRef,
  remoteVideoRef,
}: any) => {
  const [microphoneActive, setMicrophoneActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [shareScreenActive, setShareScreenActive] = useState(true);
  const [roomIdInput, setRoomIdInput] = useState("");

  const handleMicrophone = () => {
    setMicrophoneActive(!microphoneActive);
  };

  const handleVideo = () => {
    setVideoActive(!videoActive);
  };

  const handleShareScreen = () => {
    setShareScreenActive(!shareScreenActive);
  };

  return (
    <div className="bg-gray-800 text-white h-screen w-screen flex flex-col">
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-800">
          <h2 className="text-lg font-semibold mb-2">Local Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full bg-black"
          />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-800">
          <h2 className="text-lg font-semibold mb-2">Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-full h-full bg-black"
          />
        </div>
      </div>
      <div className="bg-gray-700 text-white p-4 w-full flex justify-center space-x-4">
        <button
          onClick={startVideoCall}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Start Video Call
        </button>
        <input
          className="text-black px-4 py-2 rounded"
          type="text"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
          placeholder="123456"
        />
        <button
          onClick={() => joinRoom(roomIdInput)} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Join Room
        </button>
      </div>
      <div className="bg-slate-500 text-white p-4 w-full flex justify-center space-x-4">
        <div>
          <button
            onClick={handleMicrophone}
            className="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
          >
            <img
              src={microphoneActive ? "microphone.png" : "mute.png"}
              alt="microphone"
              className="h-10 w-10 mx-4"
            />
          </button>
        </div>

        <div>
          <button
            onClick={handleVideo}
            className="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
          >
            <img
              src={videoActive ? "video-call.png" : "video.png"}
              alt="video-call"
              className="h-10 w-10 mr-4"
            />
          </button>
        </div>

        <div>
          <button
            onClick={handleShareScreen}
            className="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
          >
            <img
              src={shareScreenActive ? "share-screen.png" : "stop-screen-share.png"}
              alt="share screen"
              className="h-10 w-10 mr-4"
            />
          </button>
        </div>

        <div>
          <button className="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300">
            <img src="full-screen.png" alt="full screen" className="h-10 w-10 mr-4" />
          </button>
        </div>

        <div>
          <button className="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300">
            <img src="circle.png" alt="end meeting" className="h-10 w-10" />
          </button>
        </div>
      </div>
    </div>
  );
};
