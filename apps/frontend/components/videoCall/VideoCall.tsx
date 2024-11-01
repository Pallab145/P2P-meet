"use client";
import { useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import socket from "./socket";

export const VideoCall = () => {
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const rtpCapabilitiesRef = useRef<mediasoupClient.RtpCapabilities | null>(null);
  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
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
      localAudioTrackRef.current = audioTrack || null;
      localVideoTrackRef.current = videoTrack || null;
      console.log("Local audio track set:", audioTrack);
      console.log("Local video track set:", videoTrack);
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

  const createDevice = async (rtpCapabilities: mediasoupClient.RtpCapabilities): Promise<mediasoupClient.Device | null> => {
    console.log("Creating device");
    if (!rtpCapabilities) {
      console.error("RTP capabilities not available.");
      return null;
    }
    try {
      const newDevice = new mediasoupClient.Device();
      await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = newDevice;
      console.log("Device creation successful");
      return newDevice;
    } catch (error) {
      console.error("Error creating device:", error);
      return null;
    }
  };

  const createSendTransport = (newDevice: mediasoupClient.Device) => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('createWebRtcTransport', { sender: true }, (params: any) => {
        if (params.error) {
          console.error("Error creating WebRTC Transport:", params.error);
          reject(params.error);
          return;
        }
        producerTransport = newDevice.createSendTransport(params);
        console.log("Produced transport is:", producerTransport);
        
        producerTransport.on('connect', ({ dtlsParameters }: any, callback: any) => {
          socket.emit('transport-connect', { dtlsParameters });
          callback();
        });
        
        producerTransport.on('produce', (params: any, callback: any) => {
          socket.emit('transport-produce', {
            kind: params.kind,
            rtpParameters: params.rtpParameters,
          }, ({ id }: any) => {
            callback({ id });
          });
        });
        resolve();
      });
    });
  };

  const connectSendTransport = async () => {
    console.log("Local video track before producing:", localVideoTrackRef.current);
    console.log("Local audio track before producing:", localAudioTrackRef.current);
    try {
      if (!localVideoTrackRef.current || !producerTransport) {
        console.error("No local video track or producer transport available.");
        return;
      }
      producer = await producerTransport.produce({ track: localVideoTrackRef.current });
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
    return new Promise<void>((resolve, reject) => {
      socket.emit('createWebRtcTransport', { sender: false }, (params: any) => {
        if (params.error) {
          console.error("Error creating recv transport:", params.error);
          reject(params.error);
          return;
        }
        consumerTransport = deviceRef.current?.createRecvTransport(params);
        consumerTransport?.on('connect', ({ dtlsParameters }: any, callback: any) => {
          socket.emit('transport-recv-connect', {
            transportId: consumerTransport.id,
            dtlsParameters,
          });
          callback();
        });
        resolve();
      });
    });
  };
  

  const connectRecvTransport = async () => {
    if (!producer) {
      console.error("Producer not initialized");
      return;
    }
  
    socket.emit('consume', {
      rtpCapabilities: deviceRef.current?.rtpCapabilities,
    }, async (response: any) => {
      console.log("Consume response:", response);
      
      if (!response) {
        console.error("No response received from consume call.");
        return;
      }
      
      const { params } = response;
      if (!params || params.error) {
        console.error("Error consuming transport or params is undefined:", params?.error);
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
  
  
  

  const startVideoCall = async () => {
    try {
      console.log("Started video call");
  
      await getLocalVideo();
      console.log("Got local video");
  
      if (localVideoTrackRef.current && localAudioTrackRef.current) {
        await getRtpCapabilities();
        console.log("Got RTP capabilities");
  
        const rtpCapabilities = rtpCapabilitiesRef.current;
        if (rtpCapabilities) {
          const newDevice = await createDevice(rtpCapabilities);  // Capture the new device
          if (newDevice) {  // Use the new device for transport creation
            await createSendTransport(newDevice);
            console.log("Created send transport");
  
            if (producerTransport) {
              await connectSendTransport();
              console.log("Connected send transport");
            } else {
              console.error("Producer transport not available.");
            }
            
            await createRecvTransport();
            console.log("Created receive transport");
  
            await connectRecvTransport();
            console.log("Connected receive transport");
          }
        } else {
          console.error("RTP capabilities not available.");
        }
      } else {
        console.error("Local media tracks not available.");
      }
    } catch (error) {
      console.error("Error starting video call:", error);
    }
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
