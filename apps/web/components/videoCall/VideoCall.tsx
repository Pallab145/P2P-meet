"use client";

import { useState, useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import socket from "./socket";

export const VideoCall = () => {
  const [device, setDevice] = useState<mediasoupClient.Device | null>(null);
  const [rtpCapabilities, setRtpCapabilities] = useState<mediasoupClient.RtpCapabilities | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const getLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error getting local video:", error);
    }
  };

  const getRtpCapabilities = () => {
    socket.emit('getRtpCapabilities', (data: any) => {
      console.log(`RTP Capabilities:`, data); 
      const rtpCapabilities = data.rtpCapabilities;

      
      setRtpCapabilities(rtpCapabilities);
    });
  };

  const createDevice = async () => {
    if (!rtpCapabilities) {
      console.error("RTP capabilities not available.");
      return;
    }
  
    try {
      const newDevice = new mediasoupClient.Device();
      
      
      await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
      
      console.log("Device created successfully:", newDevice);
      setDevice(newDevice); 
      console.log(`RTP Capabilities in Device:`, newDevice.rtpCapabilities);
    } catch (error) {
      console.error("Creating device error:", error);
     
    }
  };
  

  const createSendTransport = () => {
    socket.emit('createWebRtcTransport', { sender: true }, (params : any) => {
      if (params.error) {
        console.log('Error creating WebRTC Transport:', params.error);
        return;
      }
      console.log('WebRTC Transport Params:', params);

    });
  };

  const connectSendTransport = () => {
    
  };

  const createRecvTransport = () => {
    
  };

  const connectRecvTransport = () => {
    
  };

  return (
    <div className="flex flex-col items-center p-8 space-y-6 bg-gray-100">
      <div className="flex space-x-6">
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Local Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-72 h-40 bg-black"
          />
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-72 h-40 bg-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
        <button
          onClick={getLocalVideo}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          1. Get Local Video
        </button>
        <button
          onClick={getRtpCapabilities}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          2. Get RTP Capabilities
        </button>
        <button
          onClick={createDevice}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          3. Create Device
        </button>
        <button
          onClick={createSendTransport}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          4. Create Send Transport
        </button>
        <button
          onClick={connectSendTransport}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          5. Connect Send Transport & Produce
        </button>
        <button
          onClick={createRecvTransport}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          6. Create Recv Transport
        </button>
        <button
          onClick={connectRecvTransport}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          7. Connect Recv Transport & Consume
        </button>
      </div>
    </div>
  );
};
