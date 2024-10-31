"use client";
import { useState, useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import socket from "./socket";

export const VideoCall = () => {
  const [device, setDevice] = useState<mediasoupClient.Device | null>(null);
const rtpCapabilitiesRef = useRef<mediasoupClient.RtpCapabilities | null>(null);
const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
const localVideoRef = useRef<HTMLVideoElement | null>(null);
const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

let producerTransport: any;
let consumerTransport: any;
let consumer: any;
let producer: any;

const getLocalVideo = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    
    const [audioTrack] = stream.getAudioTracks();
    const [videoTrack] = stream.getVideoTracks();
    
    setLocalAudioTrack(audioTrack || null);
    setLocalVideoTrack(videoTrack || null);
  } catch (error) {
    console.error("Error getting local video:", error);
  }
};

const getRtpCapabilities = (): Promise<mediasoupClient.RtpCapabilities> => {
  return new Promise((resolve, reject) => {
    console.log("Requesting RTP Capabilities");

    socket.emit('getRtpCapabilities', (response: any) => {
      console.log("Received response from backend:", response);

      if (response.error) {
        console.error("Error getting RTP Capabilities:", response.error);
        reject(response.error);
        return;
      }

      rtpCapabilitiesRef.current = response.rtpCapabilities;
      console.log("Set RTP Capabilities:", response.rtpCapabilities);
      resolve(response.rtpCapabilities);
    });
  });
};


const createDevice = async (rtpCapabilities: mediasoupClient.RtpCapabilities) => {
  console.log("hi there");

  if (!rtpCapabilities) {
    console.error("RTP capabilities not available.");
    return;
  }

  try {
    const newDevice = new mediasoupClient.Device();
    await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
    setDevice(newDevice);
    console.log("Device creation successful");
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
        socket.emit('transport-connect', { dtlsParameters });
        callback();
      });
      producerTransport?.on('produce', (params: any, callback: any) => {
        socket.emit('transport-produce', {
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        }, ({ id }: any) => {
          callback({ id });
        });
      });
    });
  };

  const connectSendTransport = async () => {
    try {
      if (!localVideoTrack) {
        console.error("No local video track available.");
        return;
      }
      producer = await producerTransport.produce({ track: localVideoTrack });
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
        socket.emit('transport-recv-connect', {
          transportId: consumerTransport.id,
          dtlsParameters,
        });
        callback();
      });
    });
  };

  const connectRecvTransport = async () => {
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
      try {
        consumer = await consumerTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        });
        const { track } = consumer;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = new MediaStream([track]);
        }
        socket.emit('consumer-resume');
      } catch (error) {
        console.error("Error connecting recv transport:", error);
      }
    });
  };

  const startVideoCall = () => {
    console.log("started");
    getLocalVideo();
    console.log("get Local video");
    getRtpCapabilities();
    console.log("get rtp capabilities");
    createDevice(rtpCapabilitiesRef);
    console.log("create device");
    createSendTransport();
    console.log("create send transport");
    connectSendTransport();
    console.log("connect send transport");
    createRecvTransport();
    console.log("create receive transport");
    connectRecvTransport();
    console.log("connect receive transport");
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
      <button
        onClick={startVideoCall}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Start Video Call
      </button>
    </div>
  );
};
