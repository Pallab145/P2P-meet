"use client";
import { useState, useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import socket from "./socket";
import { VideoP2P } from "../ui/VideoP2P";

export const VideoCall = () => {
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const rtpCapabilitiesRef = useRef<mediasoupClient.RtpCapabilities | null>(null);
  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");

  let producerTransport: any;
  let consumerTransport: any;
  let consumer: any;
  let producer: any;

  const toggleMic = () => {
    if (localAudioTrackRef.current) {
      const enabled = !localAudioTrackRef.current.enabled;
      localAudioTrackRef.current.enabled = enabled;
      setMicOn(enabled);
      console.log(`Microphone ${enabled ? "enabled" : "disabled"}`);
    } else {
      console.error("No audio track available to toggle.");
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      const enabled = !localVideoTrackRef.current.enabled;
      localVideoTrackRef.current.enabled = enabled;
      setVideoOn(enabled);
      console.log(`Video ${enabled ? "enabled" : "disabled"}`);
    } else {
      console.error("No video track available to toggle.");
    }
  };

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
      socket.emit('createWebRtcTransport', { sender: true, roomID: localStorage.getItem('roomID') }, (params: any) => {
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
            console.log(`producerTransport id is ${id} `)
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

  const createRecvTransport = (roomID: string) => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('createWebRtcTransport', { sender: false, roomID: roomID }, (params: any) => {
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
            roomID: roomID,  // Ensure roomID is passed here
          });
          callback();
        });
        resolve();
      });
    });
  };

  const connectRecvTransport = async (roomID: string) => {
    socket.emit('get-producer', { roomId: roomID }, async (response: any) => {
      if (!response || !response.producerId) {
        console.error("Producer not initialized or response is invalid");
        return;
      }

      socket.emit('consume', {
        rtpCapabilities: deviceRef.current?.rtpCapabilities,
        producerId: response.producerId,
        roomID: roomID,  // Ensure roomID is passed here
      }, async (consumeResponse: any) => {
        console.log("Consume response:", consumeResponse);

        if (!consumeResponse) {
          console.error("No response received from consume call.");
          return;
        }

        const { params } = consumeResponse;
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
    });
  };

  const createRoom = () => {
    socket.emit("create-room", (generatedRoomID: string) => {
      console.log(`Room created with ID: ${generatedRoomID}`);
      localStorage.setItem('roomID', generatedRoomID);
      console.log(`Stored room ID in localStorage: ${generatedRoomID}`);
    });
  };

  const startVideoCall = async () => {
    try {
      console.log("Starting video call");

      createRoom();

      await getLocalVideo();
      console.log("Got local video");

      await getRtpCapabilities();
      const rtpCapabilities = rtpCapabilitiesRef.current;
      const newDevice = await createDevice(rtpCapabilities);
      if (newDevice) {
        await createSendTransport(newDevice);

        producer = await producerTransport.produce({ track: localVideoTrackRef.current });
        console.log("Producer created with ID:", producer.id);

        // Emit an event to notify the backend about the producer
        const roomId = localStorage.getItem('roomID');
        socket.emit('producer-ready', { producerId: producer.id, roomId: roomId });

        await connectSendTransport();
        console.log("Started video call successfully");
      } else {
        console.error("Device creation failed");
      }
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  const joinRoom = async (roomID: string) => {
    try {
      console.log(`Joining room with ID: ${roomID}`);
      await createRecvTransport(roomID);
      await connectRecvTransport(roomID);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  return (
    <VideoP2P
      startVideoCall={startVideoCall}
      joinRoom={joinRoom}
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      toggleMicrophone={toggleMic}
      toggleVideo={toggleVideo}
      microphoneActive={micOn}
      videoActive={videoOn}
    />
  );
};
