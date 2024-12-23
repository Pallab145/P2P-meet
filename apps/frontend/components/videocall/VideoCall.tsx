"use client";

import { useState,useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import socket from "../../components/videocall/socket";
import { VideoP2P } from "../../components/ui/VideoP2P";

export const VideoCall= () => {
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const rtpCapabilitiesRef = useRef<any | null>(null);
  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  let producerTransport: any;
  let consumerTransport: any;
  let consumer: any;
  let producer: any;

  const getLocalVideo = async ( video : boolean , audio : boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
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

  const getRtpCapabilities = (): Promise<any> => {
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

  const createDevice = async (rtpCapabilities: any): Promise<mediasoupClient.Device | null> => {
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
      socket.emit('createWebRtcTransport', { sender: true, roomID : localStorage.getItem('roomID') }, (params: any) => {
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
            roomID: roomID,  
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
            roomID: roomID,
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
                    console.log("Setting remote video track");
                    remoteVideoRef.current.srcObject = new MediaStream([track]);
                } else {
                    console.error("Remote video element not found");
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
    alert(`room id ${generatedRoomID}`)
    console.log(`Stored room ID in localStorage: ${generatedRoomID}`);
  });
};
  
const startVideoCall = async () => {
  try {
    console.log("Starting video call");
  
    createRoom(); 
  
    await getLocalVideo(true,true);
    console.log("Got local video");
  
    await getRtpCapabilities();
    const rtpCapabilities = rtpCapabilitiesRef.current;
    const newDevice = await createDevice(rtpCapabilities);
    if (newDevice) {
      await createSendTransport(newDevice);
  
      producer = await producerTransport.produce({ track: localVideoTrackRef.current });
      console.log("Producer created with ID:", producer.id);
        
      const roomId = localStorage.getItem('roomID');
      socket.emit('producer-ready', { producerId: producer.id, roomId: roomId });
  
      await connectSendTransport();
      console.log("Started video call successfully");
    } else {
      console.error("Device creation failed.");
    }
  
  } catch (error) {
    console.error("Error starting video call:", error);
  }
};
  

const joinRoom = (roomToJoin: string) => {
  console.log(`Attempting to join room with ID: ${roomToJoin}`);
  socket.emit("join-room", roomToJoin, (response: any) => {
    if (response.error) {
      setErrorMessage(response.error);
      console.error("Error joining room:", response.error);
    } else {
      console.log(`Joined room with ID: ${roomToJoin}`);
    }
  });
};
  
const joinVideoCall = async (roomID: string) => {
  if (!roomID) {
    setErrorMessage("No room ID provided.");
    return;
  }
  
  console.log("Joining video call");
  joinRoom(roomID);
  
  await getLocalVideo(true,true);
  console.log("Got local video");
  
  await getRtpCapabilities();
  const rtpCapabilities = rtpCapabilitiesRef.current;
  const newDevice = await createDevice(rtpCapabilities);
  if (newDevice) {
    await createRecvTransport(roomID);
    await connectRecvTransport(roomID);
    console.log("Joined video call successfully");
  } else {
    console.error("Device creation failed.");
  }
};

const micOnAndOff = () => {
  if (localAudioTrackRef.current) {
    if (localAudioTrackRef.current.enabled) {
      localAudioTrackRef.current.enabled = false;
    } else {
      localAudioTrackRef.current.enabled = true;
    }
  }
};

const videoOnAndOff = () => {
  if (localVideoTrackRef.current) {
    if (localVideoTrackRef.current.enabled) {
      localVideoTrackRef.current.enabled = false;
    } else {
      localVideoTrackRef.current.enabled = true;
    }
  }
};

const stopMediaStream = () => {
  console.log("Stopping media stream...");
    
  if (localAudioTrackRef.current) {
    localAudioTrackRef.current.stop();
    localAudioTrackRef.current = null;
    console.log("Stopped local audio track");
  }
  
  if (localVideoTrackRef.current) {
    localVideoTrackRef.current.stop();
    localVideoTrackRef.current = null;
    console.log("Stopped local video track");
  }
  
  if (localVideoRef.current?.srcObject instanceof MediaStream) {
    const stream = localVideoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    localVideoRef.current.srcObject = null;
  }
  
  if (remoteVideoRef.current?.srcObject instanceof MediaStream) {
    const stream = remoteVideoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    remoteVideoRef.current.srcObject = null;
  }
  
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      stream.getTracks().forEach((track) => track.stop());
      console.log("Stopped all additional audio tracks");
    })
    .catch((error) => {
      console.error("Error stopping additional audio tracks:", error);
    });
  };
  
  
  
  

const endVideoCall = () => {
  const roomID = localStorage.getItem("roomID") || "";
  
  try {
    if (!roomID) {
      console.warn("No room ID found. Cannot end the video call.");
      return;
    }
  
    console.log(`Ending video call for room ID: ${roomID}`);
    socket.emit("end-videoCall", roomID, () => {
      console.log(`Video call ended for room ID: ${roomID}`);
      
      stopMediaStream(); 
      localStorage.removeItem("roomID");
      console.log("Room ID removed from localStorage");
  
      if (producerTransport) producerTransport.close();
      if (consumerTransport) consumerTransport.close();
      if (producer) producer.close();
      if (consumer) consumer.close();
  
      producerTransport = null;
      consumerTransport = null;
      producer = null;
      consumer = null;
    });
  } catch (error) {
    console.error("Error occurred during endVideoCall");
    console.error(error);
  }
};
  
  

return (
  <VideoP2P 
    startVideoCall={startVideoCall} 
    localVideoRef={localVideoRef} 
    remoteVideoRef={remoteVideoRef} 
    joinRoom={joinVideoCall}
    endVideoCall={endVideoCall}
    micOnAndOff={micOnAndOff}
    videoOnAndOff={videoOnAndOff}
  />);
};
