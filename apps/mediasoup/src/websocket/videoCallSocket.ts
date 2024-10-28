import { Server } from 'socket.io';
// import { getRouter } from '../configure/mediasoup-config';
import { webRtcTransport } from '../controller/videoCallController';
import { router } from '../configure/mediasoup-config';

export function setupWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.emit('connection-success', { socketId: socket.id });

    socket.on('getRtpCapabilities', (callback: (data: { rtpCapabilities?: any; error?: string }) => void) => {
      try {
        //const router = getRouter(); 
        const rtpCapabilities: any = router.rtpCapabilities; 
        callback({ rtpCapabilities });
        console.log('RTP Capabilities:', JSON.stringify(rtpCapabilities, null, 2));

      } catch (error) {
        
        const errorMessage = (error as Error).message || 'Unknown error';
        console.error('Router not initialized:', errorMessage);
        callback({ error: errorMessage });
      }
    });

    socket.on('createWebRtcTransport', async ({ sender }, callback) => {
      console.log(`Creating WebRTC transport for sender: ${sender}`);
      await webRtcTransport(callback);
    });
  });
}
