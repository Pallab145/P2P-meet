"use client";

import { useState, useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import socket from "./socket";

export const VideoCall = () => {
  const [device, setDevice] = useState<mediasoupClient.Device | null>(null);
  const [rtpCapabilities, setRtpCapabilities] = useState<mediasoupClient.RtpCapabilities | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null); 
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null); 
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);


  let producerTransport: any;
  let consumerTransport: any;
  let consumer: any;
  let producer: any;
  let params = {
    encodings: [
      {
        rid: 'r0',
        maxBitrate: 100000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r1',
        maxBitrate: 300000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r2',
        maxBitrate: 900000,
        scalabilityMode: 'S1T3',
      },
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000
    }
  }

  const getLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
  
      const [audioTrack] = stream.getAudioTracks() as MediaStreamTrack[] | [];
      const [videoTrack] = stream.getVideoTracks() as MediaStreamTrack[] | [];
  
      setLocalAudioTrack(audioTrack || null);
      setLocalVideoTrack(videoTrack || null);
    } catch (error) {
      console.error("Error getting local video:", error);
    }
  };

  const getRtpCapabilities = () => {
    socket.emit('getRtpCapabilities', (data: any) => {
      if (data.error) {
        console.error("Error getting RTP Capabilities:", data.error);
        return;
      }
      console.log("RTP Capabilities:", data);
      setRtpCapabilities(data.rtpCapabilities);
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
    } catch (error) {
      console.error("Error creating device:", error);
    }
  };

  const createSendTransport = () => {
    socket.emit('createWebRtcTransport', { sender: true }, (params: any) => {
      if (params.error) {
        console.error("Error creating WebRTC Transport:", params.error);
        return;
      }

      producerTransport = device?.createSendTransport(params);
      producerTransport?.on('connect', ({ dtlsParameters }: any, callback: any) => {
        try {
          socket.emit('transport-connect', {
            // transportId: producerTransport.id,
            dtlsParameters,
          });
          callback();
        } catch (error) {
          console.error("Error connecting transport:", error);
        }
      });

      producerTransport?.on('produce',(params: any, callback: any) => {
        try {
          socket.emit('transport-produce', {
            kind: params.kind,
            rtpParameters: params.rtpParameters,
          }, ({ id }: any) => {
            callback({ id });
          });
        } catch (error) {
          console.error("Error producing transport:", error);
        }
      });
    });
  };

  const connectSendTransport = async () => {
    try {
      
      if (!localVideoTrack) {
        console.error("No local video track available.");
        return;
      }
      
      producer = await producerTransport.produce({
        track: localVideoTrack, 
      });

      producer.on('trackended', () => {
        console.log("Track ended");
      });

      producer.on('transportclose', () => {
        console.log("Transport closed");
      });
    } catch (error) {
      console.error("Error connecting send transport:", error);
    }
  };

  const createRecvTransport = () => {
    socket.emit('createWebRtcTransport', { sender: false }, (params: any) => {
      if (params.error) {
        console.error("Error creating recv transport:", params.error);
        return;
      }

      consumerTransport = device?.createRecvTransport(params);
      consumerTransport?.on('connect', ({ dtlsParameters }: any, callback: any) => {
        try {
          socket.emit('transport-recv-connect', {
            transportId: consumerTransport.id,
            dtlsParameters,
          });
          callback();
        } catch (error) {
          console.error("Error connecting recv transport:", error);
        }
      });
    });
  };

  const connectRecvTransport = async () => {
    console.log("Requesting to consume with rtpCapabilities:", device?.rtpCapabilities);
  
    // Ensure that the producer is created before consuming
    if (!producer) {
      console.error("Producer not initialized");
      return;
    }
  
    socket.emit('consume', {
      rtpCapabilities: device?.rtpCapabilities,
    }, async ({ params }: any) => {
      if (params.error) {
        console.error("Error consuming transport:", params.error);
        return;
      }
  
      console.log("Received consume parameters:", params);
  
      try {
        consumer = await consumerTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        });
  
        console.log("Consumer created successfully:", consumer);
  
        const { track } = consumer;
        console.log("Received track from consumer:", track);
  
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = new MediaStream([track]);
          console.log("Assigned track to remote video element.");
        } else {
          console.warn("Remote video ref not set.");
        }
  
        // Request server to resume the consumer if paused
        socket.emit('consumer-resume');
      } catch (error) {
        console.error("Error connecting recv transport:", error);
      }
    });
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