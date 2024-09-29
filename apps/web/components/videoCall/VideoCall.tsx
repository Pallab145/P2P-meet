"use client"

import { useEffect, useRef, useState } from 'react';
import socket from './socket';


export const VideoCall = () => {
  const [isConnected, setIsConnected] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Request to join the room
    socket.emit('joinRoom', { roomId: 'test-room' });

    socket.on('transportCreated', async (data : any) => {
      console.log('Transport created:', data);
      await setupLocalMedia();
    });

    // Cleanup the connection when component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  // Setup the local media stream (camera and mic)
  const setupLocalMedia = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      
      setIsConnected(true);
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  };

  return (
    <div>
      <h2>Video Call</h2>
      <div className="video-container">
        <video ref={localVideoRef} autoPlay playsInline muted></video>
        <video ref={remoteVideoRef} autoPlay playsInline></video>
      </div>

      {!isConnected && <p>Connecting...</p>}
    </div>
  );
};
